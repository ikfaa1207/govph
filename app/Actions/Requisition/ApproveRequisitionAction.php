<?php

namespace App\Actions\Requisition;

use App\Enums\RequisitionStatus;
use App\Models\Employee;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Services\Audit\AuditLogger;
use Illuminate\Support\Facades\DB;

class ApproveRequisitionAction
{
    /**
     * Approve requisition (by Dept Head).
     */
    public function execute(Requisition $requisition, ?Employee $employee, array $data): Requisition
    {
        return DB::transaction(function () use ($requisition, $employee, $data) {
            $requisition->status = RequisitionStatus::PendingSupply;
            if ($employee) {
                $requisition->department_head_id = $employee->id;
            }
            $requisition->approved_at = now();
            $requisition->save();

            foreach ($data['items'] as $reqItem) {
                $dbItem = RequisitionItem::find($reqItem['id']);
                if ($dbItem instanceof RequisitionItem) {
                    $dbItem->quantity_approved = $reqItem['quantity_approved'];
                    $dbItem->save();
                }
            }

            AuditLogger::log('APPROVE_RIS', $requisition, null, $requisition->toArray());

            return $requisition;
        });
    }
}
