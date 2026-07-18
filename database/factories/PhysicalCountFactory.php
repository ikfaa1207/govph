<?php

namespace Database\Factories;

use App\Models\PhysicalCount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PhysicalCount>
 */
class PhysicalCountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => 'RPCPPE',
            'as_of_date' => now()->toDateString(),
            'status' => 'draft',
            'created_by' => 1,
        ];
    }
}
