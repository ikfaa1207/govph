<?php

namespace App\Actions\PhysicalCount;

use App\Enums\PhysicalCountStatus;
use App\Models\PhysicalCount;
use App\Models\PhysicalCountItem;
use Illuminate\Support\Facades\DB;

class UpdatePhysicalCountAction
{
    /**
     * Update the physical count progress or submit for review.
     *
     * @param  array{
     *     items: array<int, array{id: int, actual_qty: float|int|null, remarks: string|null}>,
     *     action?: string|null,
     * }  $data
     */
    public function execute(PhysicalCount $physicalCount, array $data): void
    {
        DB::transaction(function () use ($physicalCount, $data) {
            foreach ($data['items'] as $itemData) {
                $countItem = PhysicalCountItem::where('id', $itemData['id'])
                    ->where('physical_count_id', $physicalCount->id)
                    ->first();

                if ($countItem) {
                    $actualQty = $itemData['actual_qty'];
                    if ($actualQty !== null && $actualQty !== '') {
                        $actualQty = (float) $actualQty;
                        $recordedQty = (float) $countItem->recorded_qty;

                        $countItem->actual_qty = $actualQty;
                        if ($actualQty < $recordedQty) {
                            $countItem->shortage_qty = $recordedQty - $actualQty;
                            $countItem->overage_qty = 0;
                        } elseif ($actualQty > $recordedQty) {
                            $countItem->overage_qty = $actualQty - $recordedQty;
                            $countItem->shortage_qty = 0;
                        } else {
                            $countItem->shortage_qty = 0;
                            $countItem->overage_qty = 0;
                        }
                    } else {
                        $countItem->actual_qty = null;
                        $countItem->shortage_qty = null;
                        $countItem->overage_qty = null;
                    }

                    $countItem->remarks = $itemData['remarks'] ?? null;
                    $countItem->save();
                }
            }

            if (($data['action'] ?? null) === 'submit_for_review') {
                $physicalCount->status = PhysicalCountStatus::PendingReview;
                $physicalCount->save();

                // Reset committee approval statuses for the new review cycle
                $physicalCount->committees()->update([
                    'status' => 'pending',
                    'remarks' => null,
                    'approved_at' => null,
                ]);
            }
        });
    }
}
