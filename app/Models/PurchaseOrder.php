<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'purchase_request_id',
    'po_number',
    'supplier_id',
    'po_date',
    'delivery_date',
    'status',
])]
class PurchaseOrder extends Model
{
    use HasFactory;

    /**
     * Get the associated Purchase Request.
     *
     * @return BelongsTo<PurchaseRequest, $this>
     */
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    /**
     * Get the supplier for this order.
     *
     * @return BelongsTo<Supplier, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the line items for this purchase order.
     *
     * @return HasMany<PurchaseOrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    /**
     * Get the receiving reports linked to this purchase order.
     *
     * @return HasMany<ReceivingReport, $this>
     */
    public function receivingReports(): HasMany
    {
        return $this->hasMany(ReceivingReport::class);
    }
}
