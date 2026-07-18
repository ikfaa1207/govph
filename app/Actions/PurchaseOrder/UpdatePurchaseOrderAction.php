<?php

namespace App\Actions\PurchaseOrder;

use App\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;

class UpdatePurchaseOrderAction
{
    /**
     * Execute the action to update a purchase order.
     */
    public function execute(PurchaseOrder $purchaseOrder, array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($purchaseOrder, $data) {
            $purchaseOrder->update([
                'supplier_id' => $data['supplier_id'],
                'po_date' => $data['po_date'],
                'delivery_date' => $data['delivery_date'] ?? null,
            ]);

            $purchaseOrder->items()->delete();
            foreach ($data['items'] as $item) {
                $purchaseOrder->items()->create($item);
            }

            return $purchaseOrder;
        });
    }
}
