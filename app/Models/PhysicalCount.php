<?php

namespace App\Models;

use App\Enums\PhysicalCountStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $type
 * @property Carbon $as_of_date
 * @property PhysicalCountStatus $status
 * @property int $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'type',
    'as_of_date',
    'status',
    'created_by',
    'coa_representative_id',
    'coa_representative_absent_reason',
])]
class PhysicalCount extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'as_of_date' => 'date',
        'status' => PhysicalCountStatus::class,
    ];

    /**
     * @return HasMany<PhysicalCountItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(PhysicalCountItem::class);
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'created_by');
    }

    /**
     * @return HasMany<PhysicalCountCommittee, $this>
     */
    public function committees(): HasMany
    {
        return $this->hasMany(PhysicalCountCommittee::class);
    }

    /**
     * @return BelongsTo<Employee, $this>
     */
    public function coaRepresentative(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'coa_representative_id');
    }
}
