<?php

namespace App\Models;

use App\Enums\ItemStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $item_code
 * @property string|null $stock_number
 * @property string $name
 * @property string|null $description
 * @property int|null $category_id
 * @property int|null $unit_id
 * @property string $unit_cost
 * @property int $reorder_level
 * @property int $maximum_stock
 * @property int $current_stock
 * @property int|null $location_id
 * @property Carbon|null $expiration_date
 * @property string|null $barcode
 * @property string|null $image_path
 * @property ItemStatus $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
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
    'status',
])]
class Item extends Model
{
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'status' => ItemStatus::class,
            'unit_cost' => 'decimal:2',
            'reorder_level' => 'integer',
            'maximum_stock' => 'integer',
            'expiration_date' => 'date',
        ];
    }

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
     * Get the departments that stock this item.
     *
     * @return BelongsToMany<Department, $this>
     */
    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(Department::class, 'department_items')
            ->withPivot('current_stock')
            ->withTimestamps();
    }
}
