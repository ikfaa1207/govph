<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
    use HasFactory;

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
}
