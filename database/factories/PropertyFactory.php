<?php

namespace Database\Factories;

use App\Models\Property;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Property>
 */
class PropertyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_number' => $this->faker->unique()->numerify('PROP-####'),
            'serial_number' => $this->faker->unique()->numerify('SN-####'),
            'model' => $this->faker->word(),
            'brand' => $this->faker->word(),
            'status' => 'available',
            'date_acquired' => now()->toDateString(),
            'unit_cost' => 1000.00,
            'category_id' => 1,
            'condition' => 'Good',
        ];
    }
}
