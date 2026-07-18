<?php

namespace App\Actions\PurchaseOrder;

use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use Illuminate\Support\Facades\DB;

class CreatePurchaseOrderAction
{
    /**
     * Execute the action to create a new purchase order.
     */
    public function execute(PurchaseRequest $pr, array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($pr, $data) {
            $poNumber = 'PO-'.now()->format('Ymd').'-'.str_pad(
                strval(PurchaseOrder::whereDate('created_at', today())->count() + 1),
                4,
                '0',
                STR_PAD_LEFT,
            );

            $po = PurchaseOrder::create([
                'purchase_request_id' => $pr->id,
                'po_number' => $poNumber,
                'supplier_id' => $data['supplier_id'],
                'po_date' => $data['po_date'],
                'delivery_date' => $data['delivery_date'] ?? null,
                'status' => 'draft',
            ]);

            foreach ($data['items'] as $item) {
                $po->items()->create($item);
            }

            // Mark PR as ordered
            $pr->update(['status' => 'ordered']);

            return $po;
        });
    }
}
