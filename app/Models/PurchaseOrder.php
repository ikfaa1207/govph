<?php

namespace App\Models;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'purchase_request_id',
    'po_number',
    'supplier_id',
    'po_date',
    'delivery_date',
    'status',
])]
/**
 * @property PurchaseOrderStatus $status
 */
class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        static::saved(function (PurchaseOrder $po) {
            if ($po->wasChanged('status') && $po->purchase_request_id) {
                if ($po->status === PurchaseOrderStatus::Received) {
                    $po->purchaseRequest()->update(['status' => PurchaseRequestStatus::Completed]);
                } elseif (in_array($po->status, [PurchaseOrderStatus::Sent, PurchaseOrderStatus::PartiallyReceived])) {
                    $po->purchaseRequest()->update(['status' => PurchaseRequestStatus::Ordered]);
                }
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => PurchaseOrderStatus::class,
        ];
    }

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

    /**
     * Scope a query to only include purchase orders visible to the given user.
     *
     * @param  Builder<PurchaseOrder>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user, ?Employee $employee = null): Builder
    {
        $employee ??= Employee::where('user_id', $user->id)->first();

        if ($user->hasPermissionTo('admin.super') || $user->hasPermissionTo('warehouse.issue') || $user->hasPermissionTo('audit.view')) {
            return $query;
        }

        return $query->whereHas('purchaseRequest', function (Builder $q) use ($user, $employee) {
            /** @var Builder<PurchaseRequest> $q */
            $q->visibleTo($user, $employee);
        });
    }
}
