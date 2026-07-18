<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $user_id
 * @property string $employee_id
 * @property string $name
 * @property string $position
 * @property int|null $office_id
 * @property int|null $department_id
 * @property string|null $address
 * @property string|null $contact_number
 * @property string|null $date_of_birth
 * @property string|null $tin
 */
#[Fillable(['user_id', 'employee_id', 'name', 'position', 'office_id', 'department_id', 'address', 'contact_number', 'date_of_birth', 'tin'])]
class Employee extends Model
{
    use HasFactory;

    /**
     * Get the user account associated with this employee.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the office that this employee belongs to.
     *
     * @return BelongsTo<Office, $this>
     */
    public function office(): BelongsTo
    {
        return $this->belongsTo(Office::class);
    }

    /**
     * Get the department that this employee belongs to.
     *
     * @return BelongsTo<Department, $this>
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get property assignments (accountabilities) assigned to this employee.
     *
     * @return HasMany<PropertyAssignment, $this>
     */
    public function propertyAssignments(): HasMany
    {
        return $this->hasMany(PropertyAssignment::class, 'assigned_to');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'address' => 'encrypted',
            'contact_number' => 'encrypted',
            'date_of_birth' => 'encrypted',
            'tin' => 'encrypted',
        ];
    }
}
