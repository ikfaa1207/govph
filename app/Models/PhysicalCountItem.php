<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'physical_count_id',
    'property_id',
    'item_id',
    'recorded_qty',
    'actual_qty',
    'shortage_qty',
    'overage_qty',
    'remarks',
])]
class PhysicalCountItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $casts = [
        'recorded_qty' => 'decimal:2',
        'actual_qty' => 'decimal:2',
        'shortage_qty' => 'decimal:2',
        'overage_qty' => 'decimal:2',
    ];

    /**
     * @return BelongsTo<PhysicalCount, $this>
     */
    public function count(): BelongsTo
    {
        return $this->belongsTo(PhysicalCount::class, 'physical_count_id');
    }

    /**
     * @return BelongsTo<Property, $this>
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * @return BelongsTo<Item, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
