<?php

namespace App\Models;

use App\Enums\RequisitionStatus;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $ris_number
 * @property int $requesting_employee_id
 * @property int $department_id
 * @property RequisitionStatus $status
 * @property int|null $department_head_id
 * @property CarbonInterface|null $approved_at
 * @property string|null $remarks
 */
#[Fillable([
    'ris_number',
    'requesting_employee_id',
    'department_id',
    'status',
    'department_head_id',
    'approved_at',
    'remarks',
])]
class Requisition extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'status' => RequisitionStatus::class,
            'approved_at' => 'datetime',
        ];
    }

    /**
     * Get the requesting employee.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'requesting_employee_id');
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
     * Get the department head who approved.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function departmentHead(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'department_head_id');
    }

    /**
     * Get the items in this requisition.
     *
     * @return HasMany<RequisitionItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(RequisitionItem::class);
    }

    /**
     * Get the issuances for this requisition.
     *
     * @return HasMany<Issuance, $this>
     */
    public function issuances(): HasMany
    {
        return $this->hasMany(Issuance::class);
    }

    /**
     * Scope queries to requisitions the given user is permitted to see.
     *
     * Rules (consolidated from previous copy-pasted logic):
     *  - users with `warehouse.issue` or `audit.view` see everything
     *  - users with `request.approve` and an employee profile see their department
     *  - other users with an employee profile see their own requests
     *  - users with no employee profile see nothing
     *
     * @param  Builder<Requisition>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user, ?Employee $employee = null): Builder
    {
        $employee ??= Employee::where('user_id', $user->id)->first();

        if ($user->can('warehouse.issue') || $user->can('audit.view')) {
            return $query;
        }

        if ($user->can('request.approve') && $employee) {
            return $query->where('department_id', $employee->department_id);
        }

        if ($employee) {
            return $query->where('requesting_employee_id', $employee->id);
        }

        return $query->whereRaw('1 = 0');
    }
}
