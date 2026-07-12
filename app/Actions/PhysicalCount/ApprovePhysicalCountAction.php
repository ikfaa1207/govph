<?php

namespace App\Actions\PhysicalCount;

use App\Enums\PhysicalCountStatus;
use App\Models\Employee;
use App\Models\PhysicalCount;
use App\Models\PhysicalCountCommittee;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ApprovePhysicalCountAction
{
    /**
     * Submit a committee member review.
     *
     * @param  array{
     *     status: string,
     *     remarks?: string|null,
     * }  $data
     */
    public function execute(PhysicalCount $physicalCount, Employee $employee, array $data): void
    {
        DB::transaction(function () use ($physicalCount, $employee, $data) {
            /** @var PhysicalCountCommittee|null $committee */
            $committee = $physicalCount->committees()->where('employee_id', $employee->id)->first();

            if (! $committee) {
                throw new RuntimeException('You are not assigned to this committee.');
            }

            $committee->update([
                'status' => $data['status'],
                'remarks' => $data['remarks'] ?? null,
                'approved_at' => now(),
            ]);

            if ($data['status'] === 'approved') {
                $allApproved = $physicalCount->committees()->where('status', '!=', 'approved')->doesntExist();
                if ($allApproved) {
                    $physicalCount->update(['status' => PhysicalCountStatus::Finalized]);
                }
            } else {
                // If rejected, return to draft so creator can fix it
                $physicalCount->update(['status' => PhysicalCountStatus::Draft]);
            }
        });
    }
}
