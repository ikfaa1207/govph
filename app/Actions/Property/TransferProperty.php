<?php

namespace App\Actions\Property;

use App\Enums\PropertyStatus;
use App\Models\Employee;
use App\Models\Property;
use App\Models\PropertyAssignment;
use App\Models\PropertyTransfer;
use App\Services\Audit\AuditLogger;
use App\Services\DocumentSequenceService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class TransferProperty
{
    public function __construct(
        protected DocumentSequenceService $sequences,
        protected AssignProperty $assignProperty
    ) {}

    /**
     * Transfer a property to another employee.
     *
     * @param  array<string, mixed>  $data
     */
    public function execute(Property $property, array $data, Employee $custodian): void
    {
        if (! in_array($property->status, [PropertyStatus::Assigned, PropertyStatus::Transferred], true)) {
            throw new InvalidArgumentException('Only assigned or transferred properties can be transferred.');
        }

        $activeAssignment = $property->activeAssignment;
        if (! $activeAssignment) {
            throw new RuntimeException('Property has no active custodian to transfer from.');
        }

        if ($activeAssignment->assigned_to && (int) $activeAssignment->assigned_to === (int) $data['to_employee_id']) {
            throw new InvalidArgumentException('Cannot transfer a property to the employee who already holds it.');
        }

        DB::transaction(function () use ($property, $activeAssignment, $data, $custodian) {
            // Close active assignment
            $activeAssignment->returned_date = now()->toDateString();
            $activeAssignment->remarks = 'Transferred to other personnel.';
            $activeAssignment->save();

            // Create transfer record (PTR)
            $transfer = PropertyTransfer::create([
                'property_id' => $property->id,
                'ptr_number' => $this->sequences->next('PTR'),
                'transfer_date' => now()->toDateString(),
                'from_employee_id' => $activeAssignment->assigned_to,
                'to_employee_id' => $data['to_employee_id'],
                'office_id' => $data['office_id'],
                'reason' => $data['reason'],
                'approved_by' => $custodian->id,
                'status' => 'approved',
            ]);

            // Re-assign property to new employee
            $docType = $this->assignProperty->documentTypeFor($property);
            $docNo = $this->sequences->next($docType);

            $fromName = $activeAssignment->assigned_to
                ? "Employee ID {$activeAssignment->assigned_to}"
                : "{$activeAssignment->non_system_name} ({$activeAssignment->non_system_department})";

            PropertyAssignment::create([
                'property_id' => $property->id,
                'assigned_to' => $data['to_employee_id'],
                'document_type' => $docType,
                'document_number' => $docNo,
                'assigned_by' => $custodian->id,
                'date_assigned' => now()->toDateString(),
                'remarks' => "Transferred from {$fromName}. PTR Reference: {$transfer->ptr_number}",
            ]);

            // Update property status
            $property->status = PropertyStatus::Transferred;
            $property->save();

            AuditLogger::log('TRANSFER_PROPERTY', $property, null, $transfer->toArray());
        });
    }
}
