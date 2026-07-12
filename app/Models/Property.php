<?php

namespace App\Models;

use App\Enums\PropertyStatus;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property string $property_number
 * @property string $serial_number
 * @property string $model
 * @property string $brand
 * @property float|string $unit_cost
 * @property CarbonInterface $date_acquired
 * @property CarbonInterface|null $warranty_expiration
 * @property int $category_id
 * @property string $condition
 * @property PropertyStatus $status
 */
#[Fillable([
    'property_number',
    'serial_number',
    'model',
    'brand',
    'unit_cost',
    'date_acquired',
    'warranty_expiration',
    'category_id',
    'condition',
    'status',
    'receiving_report_item_id',
])]
class Property extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'status' => PropertyStatus::class,
            'unit_cost' => 'decimal:2',
            'date_acquired' => 'date',
            'warranty_expiration' => 'date',
        ];
    }

    /**
     * Get the category of this property.
     *
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get assignments of this property.
     *
     * @return HasMany<PropertyAssignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(PropertyAssignment::class);
    }

    /**
     * Get the active assignment of this property.
     *
     * @return HasOne<PropertyAssignment, $this>
     */
    public function activeAssignment(): HasOne
    {
        return $this->hasOne(PropertyAssignment::class)->whereNull('returned_date');
    }

    /**
     * Get the transfers of this property.
     *
     * @return HasMany<PropertyTransfer, $this>
     */
    public function transfers(): HasMany
    {
        return $this->hasMany(PropertyTransfer::class);
    }

    /**
     * Get the disposal record of this property, if any.
     *
     * @return HasOne<Disposal, $this>
     */
    public function disposal(): HasOne
    {
        return $this->hasOne(Disposal::class);
    }

    /**
     * Get sub-assignments (MRs) of this property.
     *
     * @return HasMany<PropertySubAssignment, $this>
     */
    public function subAssignments(): HasMany
    {
        return $this->hasMany(PropertySubAssignment::class);
    }

    /**
     * Get the active sub-assignment (MR) of this property.
     *
     * @return HasOne<PropertySubAssignment, $this>
     */
    public function activeSubAssignment(): HasOne
    {
        return $this->hasOne(PropertySubAssignment::class)->whereNull('returned_date');
    }

    /**
     * Get the semi-expendable classification based on cost (Circular No. 2022-004).
     */
    public function getSemiExpendableClassificationAttribute(): ?string
    {
        $cost = (float) $this->unit_cost;
        if ($cost >= 50000.00) {
            return null;
        }

        return $cost <= 5000.00 ? 'Low-Valued Semi-Expendable' : 'High-Valued Semi-Expendable';
    }

    /**
     * Get the receiving report item line that spawned this property.
     *
     * @return BelongsTo<ReceivingReportItem, $this>
     */
    public function receivingReportItem(): BelongsTo
    {
        return $this->belongsTo(ReceivingReportItem::class);
    }
}
