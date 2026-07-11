<?php

namespace App\Models;

use App\Enums\PhysicalCountStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
class PhysicalCount extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'as_of_date',
        'status',
        'created_by',
    ];

    protected $casts = [
        'as_of_date' => 'date',
        'status' => PhysicalCountStatus::class,
    ];

    public function items(): HasMany
    {
        return $this->hasMany(PhysicalCountItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'created_by');
    }

    public function committees(): HasMany
    {
        return $this->hasMany(PhysicalCountCommittee::class);
    }
}
