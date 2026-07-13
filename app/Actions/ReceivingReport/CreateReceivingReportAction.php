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
     * @param  array{
     *     status?: string,
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
    public function execute(array $data): ReceivingReport
    {
        $status = $data['status'] ?? 'finalized';

        return DB::transaction(function () use ($data, $status) {
            // Check for PO supplier mismatch
            $existingPo = PurchaseOrder::where('po_number', $data['po_number'])->first();
            if ($existingPo && (int) $existingPo->supplier_id !== (int) $data['supplier_id']) {
                throw ValidationException::withMessages([
                    'po_number' => ['The Purchase Order number already exists but is associated with a different supplier.'],
                ]);
            }

            // Find or create Purchase Order
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
