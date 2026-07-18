<?php

namespace App\Actions\ReceivingReport;

use App\Actions\Property\SpawnPropertiesFromReceivingReport;
use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\ReceivingReport;
use App\Models\ReceivingReportItem;
use App\Services\Audit\AuditLogger;
use App\Services\Valuation\ValuationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateReceivingReportAction
{
    public function __construct(
        protected ValuationService $valuationService,
        protected SpawnPropertiesFromReceivingReport $spawnPropertiesAction
    ) {}

    /**
     * Create a new receiving report and record stock-in if finalized.
     *
     * @param  array<string, mixed>  $data
     */
    public function execute(array $data): ReceivingReport
    {
        $status = $data['status'] ?? 'finalized';

        return DB::transaction(function () use ($data, $status) {
            // Find the Purchase Order
            $po = PurchaseOrder::where('po_number', $data['po_number'])->firstOrFail();

            // Check for PO supplier mismatch
            if ((int) $po->supplier_id !== (int) $data['supplier_id']) {
                throw ValidationException::withMessages([
                    'po_number' => ['The Purchase Order is associated with a different supplier.'],
                ]);
            }

            if ($status === 'finalized') {
                $allFulfilled = true;
                foreach ($po->items as $poItem) {
                    $totalAccepted = ReceivingReportItem::whereHas('receivingReport', function ($q) use ($po) {
                        $q->where('purchase_order_id', $po->id)->where('status', 'finalized');
                    })->where('item_id', $poItem->item_id)->sum('quantity_accepted');

                    // Add current request's accepted quantity
                    $currentQty = 0;
                    foreach ($data['items'] as $itemData) {
                        if ((int) $itemData['item_id'] === $poItem->item_id) {
                            $currentQty += (int) ($itemData['quantity_accepted'] ?? 0);
                        }
                    }

                    if (($totalAccepted + $currentQty) < $poItem->quantity) {
                        $allFulfilled = false;
                        break;
                    }
                }

                $po->update(['status' => $allFulfilled ? 'received' : 'partially_received']);
            }

            // Create Receiving Report
            $receivingReport = ReceivingReport::create([
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

            // Add items and update inventory stock and moving average costs if finalized
            foreach ($data['items'] as $itemData) {
                $itemId = $itemData['item_id'];
                $item = Item::where('id', $itemId)->firstOrFail();

                $receivedQty = (int) $itemData['quantity_received'];
                $acceptedQty = isset($itemData['quantity_accepted']) ? (int) $itemData['quantity_accepted'] : 0;
                $rejectedQty = max(0, $receivedQty - $acceptedQty);
                $unitCost = (float) $itemData['unit_cost'];

                // Create receiving report item line record
                $reportLine = ReceivingReportItem::create([
                    'receiving_report_id' => $receivingReport->id,
                    'item_id' => $itemId,
                    'quantity_received' => $receivedQty,
                    'quantity_accepted' => $acceptedQty,
                    'quantity_rejected' => $rejectedQty,
                    'unit_cost' => $unitCost,
                    'batch_number' => $itemData['batch_number'] ?? null,
                    'expiration_date' => $itemData['expiration_date'] ?? null,
                    'rejection_reason' => $itemData['rejection_reason'] ?? null,
                ]);

                // Record stock in for accepted quantities ONLY if finalized
                if ($status === 'finalized' && $acceptedQty > 0) {
                    $this->valuationService->recordStockIn(
                        $item,
                        $acceptedQty,
                        $unitCost,
                        ReceivingReport::class,
                        $receivingReport->id,
                        "Received via IAR #{$receivingReport->iar_number}"
                    );

                    $this->spawnPropertiesAction->execute($reportLine, $acceptedQty);
                }
            }

            // Log creating receiving report in audit log
            AuditLogger::log('CREATE_RECEIVING_REPORT', $receivingReport, null, $receivingReport->toArray());

            return $receivingReport;
        });
    }
}
