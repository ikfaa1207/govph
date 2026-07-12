<?php

namespace App\Actions\Property;

use App\Enums\PropertyStatus;
use App\Models\Disposal;
use App\Models\Employee;
use App\Models\Property;
use App\Services\Audit\AuditLogger;
use App\Services\DocumentSequenceService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DisposeProperty
{
    public function __construct(
        protected DocumentSequenceService $sequences
    ) {}

    /**
     * Dispose of a property.
     *
     * @param  array<string, mixed>  $data
     */
    public function execute(Property $property, array $data, Employee $custodian): void
    {
        if ($property->status === PropertyStatus::Disposed) {
            throw new InvalidArgumentException('This property has already been disposed.');
        }

        DB::transaction(function () use ($property, $data, $custodian) {
            // Close active assignment if exists
            if ($activeAssignment = $property->activeAssignment) {
                $activeAssignment->returned_date = now()->toDateString();
                $activeAssignment->remarks = 'Disposed / Condemned';
                $activeAssignment->save();
            }

            // Create disposal (IIRUP) record
            $disposal = Disposal::create([
                'property_id' => $property->id,
                'disposal_number' => $this->sequences->next('IIRUP'),
                'disposal_method' => $data['disposal_method'],
                'reason' => $data['reason'],
                'disposal_date' => now()->toDateString(),
                'appraised_value' => $data['appraised_value'] ?? 0.00,
                'proceeds' => $data['proceeds'] ?? 0.00,
                'witness_by' => 'COA Auditor Representative',
                'approved_by' => $custodian->id,
                'status' => 'completed',
            ]);

            // Update property status
            $property->condition = 'unserviceable';
            $property->status = PropertyStatus::Disposed;
            $property->save();

            AuditLogger::log('DISPOSE_PROPERTY', $property, null, $disposal->toArray());
        });
    }
}
