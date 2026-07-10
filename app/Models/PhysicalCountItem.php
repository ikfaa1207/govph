<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhysicalCountItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'physical_count_id',
        'property_id',
        'item_id',
        'recorded_qty',
        'actual_qty',
        'shortage_qty',
        'overage_qty',
        'remarks',
    ];

    protected $casts = [
        'recorded_qty' => 'decimal:2',
        'actual_qty' => 'decimal:2',
        'shortage_qty' => 'decimal:2',
        'overage_qty' => 'decimal:2',
    ];

    public function count(): BelongsTo
    {
        return $this->belongsTo(PhysicalCount::class, 'physical_count_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
