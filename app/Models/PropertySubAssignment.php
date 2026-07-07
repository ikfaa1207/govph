<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'property_id',
    'issued_to',
    'non_system_name',
    'non_system_department',
    'mr_number',
    'issued_by',
    'date_issued',
    'returned_date',
    'remarks',
])]
class PropertySubAssignment extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'date_issued' => 'date',
            'returned_date' => 'date',
        ];
    }

    /**
     * Get the associated property.
     *
     * @return BelongsTo<Property, $this>
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * Get the employee to whom the MR is issued.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'issued_to');
    }

    /**
     * Get the employee who issued the MR.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function issuer(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'issued_by');
    }
}
