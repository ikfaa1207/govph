<?php

namespace App\Actions\Requisition;

use App\Enums\RequisitionStatus;
use App\Models\Employee;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Services\Audit\AuditLogger;
use App\Services\DocumentSequenceService;
use Illuminate\Support\Facades\DB;

class CreateRequisitionAction
{
    public function __construct(protected DocumentSequenceService $sequences) {}

    /**
     * Create a new requisition request (RIS).
     */
    public function execute(Employee $employee, array $data): Requisition
    {
        $deptHead = Employee::where('department_id', $employee->department_id)
            ->whereHas('user.roles', fn ($q) => $q->where('name', 'Department Head'))
            ->first();

        $risNumber = $this->sequences->next('RIS');

        return DB::transaction(function () use ($employee, $deptHead, $risNumber, $data) {
            $requisition = Requisition::create([
                'ris_number' => $risNumber,
                'requesting_employee_id' => $employee->id,
                'department_id' => $employee->department_id,
                'status' => RequisitionStatus::PendingDeptHead,
                'department_head_id' => $deptHead?->id,
                'remarks' => $data['purpose'] ?? null,
            ]);

            foreach ($data['items'] as $reqItem) {
                RequisitionItem::create([
                    'requisition_id' => $requisition->id,
                    'item_id' => $reqItem['item_id'],
                    'quantity_requested' => $reqItem['quantity'],
                    'quantity_approved' => 0,
                    'quantity_issued' => 0,
                ]);
            }

            AuditLogger::log('CREATE_RIS', $requisition, null, $requisition->toArray());

            return $requisition;
        });
    }
}
