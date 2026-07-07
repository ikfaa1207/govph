<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'receiving_report_id',
    'item_id',
    'quantity_received',
    'quantity_accepted',
    'quantity_rejected',
    'unit_cost',
    'batch_number',
    'expiration_date',
    'rejection_reason',
])]
class ReceivingReportItem extends Model
{
    use HasFactory;

    /**
     * Get the receiving report.
     *
     * @return BelongsTo<ReceivingReport, $this>
     */
    public function receivingReport(): BelongsTo
    {
        return $this->belongsTo(ReceivingReport::class);
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
