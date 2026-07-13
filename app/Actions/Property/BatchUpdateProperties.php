<?php

namespace App\Actions\Property;

use App\Models\Property;
use App\Services\Audit\AuditLogger;
use Illuminate\Support\Facades\DB;

class BatchUpdateProperties
{
    /**
     * Update multiple properties in a batch.
     *
     * @param  array<int, array{
     *     id: int,
     *     brand: string,
     *     model: string,
     *     serial_number: string,
     *     condition: string,
     * }>  $propertiesData
     */
    public function execute(array $propertiesData): void
    {
        DB::transaction(function () use ($propertiesData) {
            foreach ($propertiesData as $data) {
                $property = Property::findOrFail($data['id']);
                $property->update([
                    'brand' => $data['brand'],
                    'model' => $data['model'],
                    'serial_number' => $data['serial_number'],
                    'condition' => $data['condition'],
                ]);

                AuditLogger::log('UPDATE_PROPERTY', $property, null, $property->toArray());
            }
        });
    }
}
