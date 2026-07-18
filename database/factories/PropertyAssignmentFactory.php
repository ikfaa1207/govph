<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\PropertyAssignment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PropertyAssignment>
 */
class PropertyAssignmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'assigned_to' => 1,
            'assigned_by' => 1,
            'date_assigned' => now()->toDateString(),
            'document_type' => 'PAR',
            'document_number' => $this->faker->unique()->numerify('PAR-####'),
        ];
    }
}
