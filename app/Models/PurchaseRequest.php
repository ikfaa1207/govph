<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'pr_number',
    'requested_by',
    'department_id',
    'purpose',
    'status',
    'approved_by',
    'rejection_reason',
])]
class PurchaseRequest extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Get the requesting employee.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'requested_by');
    }

    /**
     * Get the department.
     *
     * @return BelongsTo<Department, $this>
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the approving user.
     *
     * @return BelongsTo<User, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the line items for this purchase request.
     *
     * @return HasMany<PurchaseRequestItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    /**
     * Get the purchase order generated from this request.
     *
     * @return HasOne<PurchaseOrder, $this>
     */
    public function purchaseOrder(): HasOne
    {
        return $this->hasOne(PurchaseOrder::class);
    }

    /**
     * Scope a query to only include purchase requests visible to the given user.
     *
     * @param  Builder<PurchaseRequest>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user, ?Employee $employee = null): Builder
    {
        $employee ??= Employee::where('user_id', $user->id)->first();

        if ($user->hasPermissionTo('admin.super') || $user->hasPermissionTo('warehouse.issue') || $user->hasPermissionTo('audit.view') || $user->hasPermissionTo('procurement.create') || $user->hasPermissionTo('property.assign')) {
            return $query;
        }

        if ($user->hasPermissionTo('request.approve') && $employee) {
            return $query->where('department_id', $employee->department_id);
        }

        if ($employee) {
            return $query->where('requested_by', $employee->id);
        }

        return $query->whereRaw('1 = 0');
    }
}
