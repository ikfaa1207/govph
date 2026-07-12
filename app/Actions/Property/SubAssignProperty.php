<?php

namespace App\Actions\Property;

use App\Enums\PropertyStatus;
use App\Models\Employee;
use App\Models\Property;
use App\Models\PropertySubAssignment;
use App\Services\Audit\AuditLogger;
use App\Services\DocumentSequenceService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SubAssignProperty
{
    public function __construct(protected DocumentSequenceService $sequences) {}

    /**
     * Issue an internal Sub-Assignment (Memorandum Receipt) for a property.
     *
     * @param  array<string, mixed>  $data
     */
    public function execute(Property $property, array $data, Employee $issuer): void
    {
        if (! in_array($property->status, [PropertyStatus::Assigned, PropertyStatus::Transferred], true)) {
            throw new InvalidArgumentException('Only assigned or transferred properties can be sub-assigned.');
        }

        $isNonSystem = filter_var($data['is_non_system'] ?? false, FILTER_VALIDATE_BOOLEAN);

        // Check if already sub-assigned to the same employee
        if (! $isNonSystem && $property->activeSubAssignment && (int) $property->activeSubAssignment->issued_to === (int) $data['issued_to']) {
            throw new InvalidArgumentException('Cannot sub-assign a property to the employee who already holds it.');
        }

        DB::transaction(function () use ($property, $data, $issuer, $isNonSystem) {
            // Close existing active sub-assignment if there is one
            if ($activeSubAssignment = $property->activeSubAssignment) {
                $activeSubAssignment->returned_date = now()->toDateString();
                $activeSubAssignment->remarks = ($activeSubAssignment->remarks ? $activeSubAssignment->remarks.' | ' : '').'Re-issued to another personnel.';
                $activeSubAssignment->save();
            }

            // Generate MR number via DocumentSequenceService
            $mrNumber = $this->sequences->next('MR');

            $subAssignment = PropertySubAssignment::create([
                'property_id' => $property->id,
                'issued_to' => $isNonSystem ? null : ($data['issued_to'] ?? null),
                'non_system_name' => $isNonSystem ? ($data['non_system_name'] ?? null) : null,
                'non_system_department' => $isNonSystem ? ($issuer->department->name ?? 'Unknown') : null,
                'mr_number' => $mrNumber,
                'issued_by' => $issuer->id,
                'date_issued' => now()->toDateString(),
                'remarks' => $data['remarks'] ?? null,
            ]);

            AuditLogger::log('ISSUE_MR', $property, null, $subAssignment->toArray());
        });
    }
}
