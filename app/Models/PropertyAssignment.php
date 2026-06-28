<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'property_id',
    'assigned_to',
    'non_system_name',
    'non_system_department',
    'document_type',
    'document_number',
    'assigned_by',
    'date_assigned',
    'returned_date',
    'remarks'
])]
class PropertyAssignment extends Model
{
    use HasFactory;

    /**
     * Get the property assigned.
     *
     * @return BelongsTo<Property, $this>
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * Get the employee who holds the accountability.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_to');
    }

    /**
     * Get the Property Custodian who issued the assignment.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function assigner(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_by');
    }
}
