<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'item_code',
    'stock_number',
    'name',
    'description',
    'category_id',
    'unit_id',
    'unit_cost',
    'reorder_level',
    'maximum_stock',
    'location_id',
    'expiration_date',
    'barcode',
    'image_path',
    'status'
])]
class Item extends Model
{
    use HasFactory;

    /**
     * Get the category of this item.
     *
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the unit of measure of this item.
     *
     * @return BelongsTo<Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Get the storage location of this item.
     *
     * @return BelongsTo<Location, $this>
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Get stock transactions for this item.
     *
     * @return HasMany<StockTransaction, $this>
     */
    public function stockTransactions(): HasMany
    {
        return $this->hasMany(StockTransaction::class);
    }

    /**
     * Get the current stock quantity.
     */
    public function getCurrentStockAttribute(): int
    {
        return (int) $this->stockTransactions()->sum('quantity');
    }
}
