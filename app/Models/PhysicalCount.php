<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
    ];

    public function items(): HasMany
    {
        return $this->hasMany(PhysicalCountItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'created_by');
    }
}
