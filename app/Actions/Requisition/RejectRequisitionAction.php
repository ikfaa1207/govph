<?php

namespace App\Actions\Requisition;

use App\Enums\RequisitionStatus;
use App\Models\Requisition;
use App\Services\Audit\AuditLogger;
use Illuminate\Support\Facades\DB;

class RejectRequisitionAction
{
    /**
     * Reject requisition (by Dept Head / Admin).
     */
    public function execute(Requisition $requisition, array $data): Requisition
    {
        return DB::transaction(function () use ($requisition, $data) {
            $requisition->status = RequisitionStatus::RejectedDeptHead;
            $requisition->remarks = $data['remarks'];
            $requisition->save();

            AuditLogger::log('REJECT_RIS', $requisition, null, $requisition->toArray());

            return $requisition;
        });
    }
}
