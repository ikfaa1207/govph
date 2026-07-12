<?php

namespace App\Actions\ReceivingReport;

use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\ReceivingReport;
use App\Models\ReceivingReportItem;
use App\Services\Audit\AuditLogger;
use App\Services\Valuation\ValuationService;
use Illuminate\Support\Facades\DB;

class UpdateReceivingReportAction
{
    public function __construct(protected ValuationService $valuationService) {}

    /**
     * Update an existing receiving report and adjust stock inventory.
     *
     * @param  array{
     *     status: string,
     *     po_number: string,
     *     supplier_id: int,
     *     po_date: string,
     *     iar_number?: string|null,
     *     invoice_number?: string|null,
     *     delivery_receipt_number?: string|null,
     *     received_date?: string|null,
     *     received_by?: int|null,
     *     inspected_by?: int|null,
     *     remarks?: string|null,
     *     items: array<int, array{
     *         id?: int|null,
     *         item_id: int,
     *         quantity_received: int,
     *         quantity_accepted?: int|null,
     *         unit_cost: float|int,
     *         batch_number?: string|null,
     *         expiration_date?: string|null,
     *         rejection_reason?: string|null,
     *     }>,
     * }  $data
     */
    public function execute(ReceivingReport $report, array $data): void
    {
        $status = $data['status'] ?? 'finalized';
        $oldStatus = $report->status;

        DB::transaction(function () use ($report, $data, $status, $oldStatus) {
            // Load relations for accurate old state tracking
            $report->load('items');
            $oldState = $report->toArray();

            // Find or update Purchase Order
            $po = PurchaseOrder::firstOrCreate(
                ['po_number' => $data['po_number']],
                [
                    'supplier_id' => $data['supplier_id'],
                    'po_date' => $data['po_date'],
                    'status' => $status === 'finalized' ? 'received' : 'draft',
                ]
            );

            if ($status === 'finalized' && $po->status !== 'received') {
                $po->update(['status' => 'received']);
            }

            // Update Report Details
            $report->update([
                'purchase_order_id' => $po->id,
                'iar_number' => $data['iar_number'] ?? null,
                'invoice_number' => $data['invoice_number'] ?? null,
                'delivery_receipt_number' => $data['delivery_receipt_number'] ?? null,
                'received_date' => $data['received_date'] ?? null,
                'received_by' => $data['received_by'] ?? null,
                'inspected_by' => $data['inspected_by'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'status' => $status,
            ]);

            // Track IDs from the payload to delete missing items
            $payloadItemIds = array_filter(array_map(function ($item) {
                return $item['id'] ?? null;
            }, $data['items']));

            // Handle deleted items: reverse stock and delete (only if old state was finalized)
            foreach ($report->items as $existingItem) {
                if (! in_array($existingItem->id, $payloadItemIds)) {
                    if ($oldStatus === 'finalized' && $existingItem->quantity_accepted > 0) {
                        $existingItemId = (int) $existingItem->item_id;
                        /** @var Item $item */
                        $item = Item::findOrFail($existingItemId);
                        $this->valuationService->reverseStockIn(
                            $item,
                            $existingItem->quantity_accepted,
                            $existingItem->unit_cost,
                            ReceivingReport::class,
                            $report->id,
                            "Reversed via Edit IAR #{$report->iar_number}"
                        );
                    }
                    $existingItem->delete();
                }
            }

            // Process payload items
            foreach ($data['items'] as $itemData) {
                $itemId = (int) $itemData['item_id'];
                /** @var Item $item */
                $item = Item::findOrFail($itemId);

                $receivedQty = (int) $itemData['quantity_received'];
                $acceptedQty = isset($itemData['quantity_accepted']) ? (int) $itemData['quantity_accepted'] : 0;
                $rejectedQty = max(0, $receivedQty - $acceptedQty);
                $unitCost = (float) $itemData['unit_cost'];

                if (isset($itemData['id'])) {
                    // Updating an existing item
                    $existingLineId = (int) $itemData['id'];
                    /** @var ReceivingReportItem $existingLine */
                    $existingLine = ReceivingReportItem::findOrFail($existingLineId);

                    // Reverse old stock-in only if old status was finalized
                    if ($oldStatus === 'finalized' && $existingLine->quantity_accepted > 0) {
                        $this->valuationService->reverseStockIn(
                            $item,
                            $existingLine->quantity_accepted,
                            $existingLine->unit_cost,
                            ReceivingReport::class,
                            $report->id,
                            "Reversed (Update) via IAR #{$report->iar_number}"
                        );
                    }

                    // Update record
                    $existingLine->update([
                        'item_id' => $itemId,
                        'quantity_received' => $receivedQty,
                        'quantity_accepted' => $acceptedQty,
                        'quantity_rejected' => $rejectedQty,
                        'unit_cost' => $unitCost,
                        'batch_number' => $itemData['batch_number'] ?? null,
                        'expiration_date' => $itemData['expiration_date'] ?? null,
                        'rejection_reason' => $itemData['rejection_reason'] ?? null,
                    ]);

                } else {
                    // Creating new item line
                    ReceivingReportItem::create([
                        'receiving_report_id' => $report->id,
                        'item_id' => $itemId,
                        'quantity_received' => $receivedQty,
                        'quantity_accepted' => $acceptedQty,
                        'quantity_rejected' => $rejectedQty,
                        'unit_cost' => $unitCost,
                        'batch_number' => $itemData['batch_number'] ?? null,
                        'expiration_date' => $itemData['expiration_date'] ?? null,
                        'rejection_reason' => $itemData['rejection_reason'] ?? null,
                    ]);
                }

                // Apply new stock-in only if new status is finalized
                if ($status === 'finalized' && $acceptedQty > 0) {
                    $this->valuationService->recordStockIn(
                        $item,
                        $acceptedQty,
                        $unitCost,
                        ReceivingReport::class,
                        $report->id,
                        "Received via Edit IAR #{$report->iar_number}"
                    );
                }
            }

            // Refresh to get latest items for new state
            $report->refresh();
            $report->load('items');
            $newState = $report->toArray();

            // Log update
            AuditLogger::log('UPDATE_RECEIVING_REPORT', $report, $oldState, $newState);
        });
    }
}
