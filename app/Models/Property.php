<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
    'status'
])]
class Property extends Model
{
    use HasFactory;

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
}
