<?php

namespace App\Actions\PhysicalCount;

use App\Enums\PhysicalCountStatus;
use App\Models\Employee;
use App\Models\Item;
use App\Models\PhysicalCount;
use App\Models\PhysicalCountItem;
use App\Models\Property;
use Illuminate\Support\Facades\DB;

class CreatePhysicalCountAction
{
    /**
     * Execute the physical count creation.
     *
     * @param  array{
     *     type: string,
     *     as_of_date: string,
     *     chairperson_id: int,
     *     head_of_agency_id: int,
     *     member_ids: int[],
     * }  $data
     */
    public function execute(Employee $creator, array $data): PhysicalCount
    {
        return DB::transaction(function () use ($creator, $data) {
            $count = PhysicalCount::create([
                'type' => $data['type'],
                'as_of_date' => $data['as_of_date'],
                'status' => PhysicalCountStatus::Draft,
                'created_by' => $creator->id,
                'coa_representative_id' => $data['coa_representative_id'] ?? null,
                'coa_representative_absent_reason' => $data['coa_representative_absent_reason'] ?? null,
            ]);

            $count->committees()->create([
                'employee_id' => $data['chairperson_id'],
                'role' => 'chairperson',
            ]);

            $count->committees()->create([
                'employee_id' => $data['head_of_agency_id'],
                'role' => 'head_of_agency',
            ]);

            if (! empty($data['coa_representative_id'])) {
                $count->committees()->create([
                    'employee_id' => $data['coa_representative_id'],
                    'role' => 'coa_representative',
                ]);
            }

            foreach ($data['member_ids'] as $memberId) {
                $count->committees()->create([
                    'employee_id' => $memberId,
                    'role' => 'member',
                ]);
            }

            if ($count->type === 'RPCPPE') {
                $properties = Property::where('status', '!=', 'disposed')->get();
                $itemsToInsert = [];
                foreach ($properties as $property) {
                    $itemsToInsert[] = [
                        'physical_count_id' => $count->id,
                        'property_id' => $property->id,
                        'item_id' => null,
                        'recorded_qty' => 1,
                        'actual_qty' => null,
                        'shortage_qty' => null,
                        'overage_qty' => null,
                        'remarks' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                PhysicalCountItem::insert($itemsToInsert);
            } else {
                $items = Item::all();
                $itemsToInsert = [];
                foreach ($items as $item) {
                    $totalStock = DB::table('department_items')->where('item_id', $item->id)->sum('current_stock') ?: 0;
                    $itemsToInsert[] = [
                        'physical_count_id' => $count->id,
                        'property_id' => null,
                        'item_id' => $item->id,
                        'recorded_qty' => $totalStock,
                        'actual_qty' => null,
                        'shortage_qty' => null,
                        'overage_qty' => null,
                        'remarks' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                PhysicalCountItem::insert($itemsToInsert);
            }

            return $count;
        });
    }
}
