<?php

namespace App\Actions\Property;

use App\Models\Property;
use App\Models\ReceivingReportItem;
use App\Services\DocumentSequenceService;
use Illuminate\Support\Str;

class SpawnPropertiesFromReceivingReport
{
    public function __construct(protected DocumentSequenceService $sequences) {}

    /**
     * Spawn or synchronize Property records based on accepted receiving quantity.
     */
    public function execute(ReceivingReportItem $itemLine, int $quantity): void
    {
        $item = $itemLine->item;
        if (! $item) {
            return;
        }

        $category = $item->category;
        if (! $category || ! $category->is_ppe) {
            return;
        }

        $existingCount = Property::where('receiving_report_item_id', $itemLine->id)->count();

        if ($quantity > $existingCount) {
            $needed = $quantity - $existingCount;
            for ($i = 0; $i < $needed; $i++) {
                $propNum = $this->sequences->next('PPE');
                $tempSerial = 'PENDING-SN-'.$itemLine->receivingReport->iar_number.'-'.Str::random(5);

                Property::create([
                    'property_number' => $propNum,
                    'serial_number' => $tempSerial,
                    'model' => $item->name,
                    'brand' => 'Pending Procurement Handoff',
                    'unit_cost' => $itemLine->unit_cost,
                    'date_acquired' => $itemLine->receivingReport->received_date ?? now()->toDateString(),
                    'category_id' => $item->category_id,
                    'condition' => 'new',
                    'status' => 'available',
                    'receiving_report_item_id' => $itemLine->id,
                ]);
            }
        } elseif ($quantity < $existingCount) {
            $excess = $existingCount - $quantity;

            // Delete available, unassigned ones first
            $toDelete = Property::where('receiving_report_item_id', $itemLine->id)
                ->where('status', 'available')
                ->orderBy('id', 'desc')
                ->limit($excess)
                ->get();

            foreach ($toDelete as $prop) {
                $prop->delete();
            }
        }
    }
}
