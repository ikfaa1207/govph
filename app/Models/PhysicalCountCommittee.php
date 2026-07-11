<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhysicalCountCommittee extends Model
{
    protected $fillable = [
        'physical_count_id',
        'employee_id',
        'role',
        'status',
        'remarks',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    public function physicalCount(): BelongsTo
    {
        return $this->belongsTo(PhysicalCount::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
