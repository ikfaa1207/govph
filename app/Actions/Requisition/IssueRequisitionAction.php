<?php

namespace App\Actions\Requisition;

use App\Enums\RequisitionStatus;
use App\Models\DepartmentItem;
use App\Models\Employee;
use App\Models\Issuance;
use App\Models\IssuanceItem;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Services\Audit\AuditLogger;
use App\Services\DocumentSequenceService;
use App\Services\Valuation\ValuationService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class IssueRequisitionAction
{
    public function __construct(
        protected ValuationService $valuationService,
        protected DocumentSequenceService $sequences
    ) {}

    /**
     * Issue items from inventory (by Supply Officer).
     */
    public function execute(Requisition $requisition, Employee $employee, array $data): Issuance
    {
        $issueNumber = $this->sequences->next('ISSUE');

        return DB::transaction(function () use ($requisition, $employee, $issueNumber, $data) {
            $issuance = Issuance::create([
                'requisition_id' => $requisition->id,
                'issue_number' => $issueNumber,
                'issued_date' => ! empty($data['issued_date']) ? Carbon::parse($data['issued_date']) : now(),
                'issued_by' => $employee->id,
                'received_by' => $requisition->requesting_employee_id,
                'purpose' => $requisition->remarks,
            ]);

            $allCompleted = true;

            foreach ($data['items'] as $reqItem) {
                $dbItem = RequisitionItem::find($reqItem['id']);
                if (! $dbItem instanceof RequisitionItem) {
                    continue;
                }

                $qtyIssued = (int) $reqItem['quantity_issued'];

                if ($qtyIssued > 0) {
                    $item = $dbItem->item;

                    $cost = $this->valuationService->recordStockOut(
                        $item,
                        $qtyIssued,
                        Issuance::class,
                        $issuance->id,
                        "Issued via RIS #{$requisition->ris_number}"
                    );

                    IssuanceItem::create([
                        'issuance_id' => $issuance->id,
                        'item_id' => $item->id,
                        'quantity_issued' => $qtyIssued,
                        'unit_cost' => $cost,
                    ]);

                    // Add to Department Inventory
                    $deptItem = DepartmentItem::firstOrCreate(
                        ['department_id' => $requisition->department_id, 'item_id' => $item->id],
                        ['current_stock' => 0]
                    );
                    $deptItem->increment('current_stock', $qtyIssued);

                    $dbItem->quantity_issued += $qtyIssued;
                    $dbItem->save();
                }

                if ($dbItem->quantity_issued < $dbItem->quantity_approved) {
                    $allCompleted = false;
                }
            }

            $requisition->status = $allCompleted
                ? RequisitionStatus::Issued
                : RequisitionStatus::PartiallyIssued;
            $requisition->save();

            AuditLogger::log('ISSUE_RIS', $issuance, null, $issuance->toArray());

            return $issuance;
        });
    }
}
