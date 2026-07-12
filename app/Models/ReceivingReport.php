<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

#[Fillable([
    'purchase_order_id',
    'iar_number',
    'invoice_number',
    'delivery_receipt_number',
    'received_date',
    'received_by',
    'inspected_by',
    'remarks',
    'status',
])]
class ReceivingReport extends Model
{
    use HasFactory;

    /**
     * Get the associated Purchase Order.
     *
     * @return BelongsTo<PurchaseOrder, $this>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * Get the receiving Supply Officer employee.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'received_by');
    }

    /**
     * Get the inspecting employee.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function inspector(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'inspected_by');
    }

    /**
     * Get the items details.
     *
     * @return HasMany<ReceivingReportItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(ReceivingReportItem::class);
    }

    /**
     * Get the associated stock transactions.
     *
     * @return MorphMany<StockTransaction, $this>
     */
    public function stockTransactions(): MorphMany
    {
        return $this->morphMany(StockTransaction::class, 'reference');
    }
}
