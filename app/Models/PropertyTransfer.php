<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'property_id',
    'ptr_number',
    'transfer_date',
    'from_employee_id',
    'to_employee_id',
    'office_id',
    'reason',
    'approved_by',
    'status',
])]
class PropertyTransfer extends Model
{
    use HasFactory;

    /**
     * Get the property transferred.
     *
     * @return BelongsTo<Property, $this>
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * Get the employee transferring from.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'from_employee_id');
    }

    /**
     * Get the employee transferring to.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function recipient(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'to_employee_id');
    }

    /**
     * Get the target office.
     *
     * @return BelongsTo<Office, $this>
     */
    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    /**
     * Get the Property Custodian who approved.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'approved_by');
    }
}
