<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'issuance_id',
    'item_id',
    'quantity_issued',
    'unit_cost',
])]
class IssuanceItem extends Model
{
    use HasFactory;

    /**
     * Get the issuance record.
     *
     * @return BelongsTo<Issuance, $this>
     */
    public function issuance(): BelongsTo
    {
        return $this->belongsTo(Issuance::class);
    }

    /**
     * Get the item.
     *
     * @return BelongsTo<Item, $this>
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
