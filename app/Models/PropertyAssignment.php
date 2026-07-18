<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

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
    'remarks',
    'digital_signature',
    'acknowledged_at',
])]
class PropertyAssignment extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'assignment_date' => 'date',
            'expected_return_date' => 'date',
            'actual_return_date' => 'date',
            'acknowledged_at' => 'datetime',
        ];
    }

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

    /**
     * Acknowledge the assignment and generate a digital signature.
     */
    public function acknowledge(int $userId): void
    {
        $timestamp = now()->timestamp;
        $this->acknowledged_at = now();
        $this->digital_signature = hash('sha256', "PA-{$this->id}-{$userId}-{$timestamp}");
        $this->save();
    }
}
