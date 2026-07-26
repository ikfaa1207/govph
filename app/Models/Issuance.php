<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

#[Fillable([
    'requisition_id',
    'issue_number',
    'issued_date',
    'issued_by',
    'received_by',
    'purpose',
])]
class Issuance extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issued_date' => 'datetime',
        ];
    }

    /**
     * Get the associated Requisition (RIS).
     *
     * @return BelongsTo<Requisition, $this>
     */
    public function requisition(): BelongsTo
    {
        return $this->belongsTo(Requisition::class);
    }

    /**
     * Get the issuing Supply Officer employee.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function issuer(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'issued_by');
    }

    /**
     * Get the receiving employee.
     *
     * @return BelongsTo<Employee, $this>
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'received_by');
    }

    /**
     * Get the details of items issued.
     *
     * @return HasMany<IssuanceItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(IssuanceItem::class);
    }

    /**
     * Get the associated stock transactions.
     *
     * @return MorphMany<StockTransaction, $this>
     */
    public function stockTransactions(): MorphMany
    {
        return $this->morphMany(StockTransaction::class, 'reference');
    }
}
