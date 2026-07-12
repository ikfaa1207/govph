<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'property_id',
    'disposal_number',
    'disposal_method',
    'reason',
    'disposal_date',
    'appraised_value',
    'proceeds',
    'witness_by',
    'approved_by',
    'inspected_by',
    'jev_reference',
    'status',
])]
class Disposal extends Model
{
    use HasFactory;

    /**
     * Get the property being disposed.
     *
     * @return BelongsTo<Property, $this>
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
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

    /**
     * Get the Technical Inspector who inspected the unserviceable property.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function inspector(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'inspected_by');
    }
}
