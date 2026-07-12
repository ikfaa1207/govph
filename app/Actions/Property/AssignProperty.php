<?php

namespace App\Actions\Property;

use App\Enums\PropertyStatus;
use App\Models\Employee;
use App\Models\Property;
use App\Models\PropertyAssignment;
use App\Services\Audit\AuditLogger;
use App\Services\DocumentSequenceService;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AssignProperty
{
    public function __construct(protected DocumentSequenceService $sequences) {}

    /**
     * Assign a single property to an employee (or non-system custodian).
     *
     * @param  array<string, mixed>  $data
     */
    public function execute(Property $property, array $data, Employee $custodian): PropertyAssignment
    {
        if ($property->status !== PropertyStatus::Available) {
            throw new RuntimeException("Property {$property->property_number} is not available for assignment.");
        }

        $docType = $this->documentTypeFor($property);
        $docNo = $this->sequences->next($docType);

        return $this->assignWithDocument($property, $data, $custodian, $docType, $docNo);
    }

    /**
     * Assign a property using a pre-allocated document type and number.
     *
     * @param  array<string, mixed>  $data
     */
    public function assignWithDocument(Property $property, array $data, Employee $custodian, string $docType, string $docNo): PropertyAssignment
    {
        if ($property->status !== PropertyStatus::Available) {
            throw new RuntimeException("Property {$property->property_number} is not available for assignment.");
        }

        return DB::transaction(function () use ($property, $data, $custodian, $docType, $docNo) {
            $isNonSystem = filter_var($data['is_non_system'] ?? false, FILTER_VALIDATE_BOOLEAN);

            $assignment = PropertyAssignment::create([
                'property_id' => $property->id,
                'assigned_to' => $isNonSystem ? null : ($data['assigned_to'] ?? null),
                'non_system_name' => $isNonSystem ? ($data['non_system_name'] ?? null) : null,
                'non_system_department' => $isNonSystem ? ($data['non_system_department'] ?? null) : null,
                'document_type' => $docType,
                'document_number' => $docNo,
                'assigned_by' => $custodian->id,
                'date_assigned' => now()->toDateString(),
                'remarks' => $data['remarks'] ?? null,
            ]);

            $property->status = PropertyStatus::Assigned;
            $property->save();

            AuditLogger::log('ASSIGN_PROPERTY', $property, null, [
                'assigned_to' => $isNonSystem ? null : ($data['assigned_to'] ?? null),
                'non_system_name' => $isNonSystem ? ($data['non_system_name'] ?? null) : null,
                'non_system_department' => $isNonSystem ? ($data['non_system_department'] ?? null) : null,
                'document_type' => $docType,
                'document_number' => $docNo,
            ]);

            return $assignment;
        });
    }

    /**
     * Determine document type based on unit cost capitalization threshold.
     */
    public function documentTypeFor(Property $property): string
    {
        $threshold = config('inventory.capitalization_threshold', 50000.00);

        return (float) $property->unit_cost >= $threshold ? 'PAR' : 'ICS';
    }
}
