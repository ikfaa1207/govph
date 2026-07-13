<?php

namespace App\Actions\Property;

use App\Models\Property;
use App\Services\Audit\AuditLogger;

class UpdateProperty
{
    /**
     * Update property details.
     */
    public function execute(Property $property, array $data): Property
    {
        $property->update([
            'brand' => $data['brand'],
            'model' => $data['model'],
            'serial_number' => $data['serial_number'],
            'condition' => $data['condition'] ?? $property->condition,
        ]);

        AuditLogger::log('UPDATE_PROPERTY', $property, null, $property->toArray());

        return $property;
    }
}
