<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Item;
use App\Models\Property;
use App\Models\PropertyAssignment;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use Carbon\Carbon;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('en_PH');

        $employees = Employee::where('employee_id', 'like', 'EMP-GEN-%')->get();
        $head = Employee::where('employee_id', 'EMP-HEAD-04')->first();
        $custodian = Employee::where('employee_id', 'EMP-CUST-03')->first();
        $supply = Employee::where('employee_id', 'EMP-SUPPLY-02')->first();

        $consumables = Item::whereHas('category', fn ($q) => $q->where('is_ppe', false))->get();
        $equipment = Item::whereHas('category', fn ($q) => $q->where('is_ppe', true))->get();

        // 1. Generate Requisitions (RIS) for Consumables
        foreach ($employees as $emp) {
            // Each employee makes 1 to 3 requests
            $numRequests = rand(1, 3);
            for ($i = 0; $i < $numRequests; $i++) {
                $status = $faker->randomElement(['pending_dept_head', 'pending_supply', 'issued', 'partially_issued']);

                $dateRequested = Carbon::now()->subDays(rand(1, 60));

                $ris = Requisition::create([
                    'ris_number' => 'RIS-'.date('Y').'-'.str_pad((string) rand(1, 9999), 4, '0', STR_PAD_LEFT),
                    'requesting_employee_id' => $emp->id,
                    'department_id' => $emp->department_id,
                    'remarks' => $faker->randomElement(['Office Use', 'Seminar/Training Materials', 'Quarterly Supply Replenishment', 'Field Work']),
                    'status' => $status,
                    'department_head_id' => in_array($status, ['pending_supply', 'issued', 'partially_issued']) ? $head->id : null,
                    'approved_at' => in_array($status, ['pending_supply', 'issued', 'partially_issued']) ? $dateRequested->copy()->addHours(rand(1, 24)) : null,
                    'created_at' => $dateRequested,
                    'updated_at' => $dateRequested,
                ]);

                // Add 1 to 4 items per RIS
                $requestedItems = $consumables->random(rand(1, 4));
                foreach ($requestedItems as $item) {
                    $qty = rand(1, 5);
                    RequisitionItem::create([
                        'requisition_id' => $ris->id,
                        'item_id' => $item->id,
                        'quantity_requested' => $qty,
                        'quantity_approved' => in_array($status, ['pending_supply', 'issued', 'partially_issued']) ? $qty : 0,
                        'quantity_issued' => ($status === 'issued') ? $qty : 0,
                    ]);
                }
            }
        }

        // 2. Generate Properties and Assignments (PAR/ICS)
        $propNumber = 1000;
        foreach ($employees as $emp) {
            // Assign 1 to 2 pieces of equipment per employee (e.g. Laptop, Chair)
            $assignedEqp = $equipment->random(rand(1, 2));

            foreach ($assignedEqp as $item) {
                // Create the physical Property entity first
                $property = Property::create([
                    'property_number' => 'PROP-'.date('Y').'-'.str_pad((string) ($propNumber++), 4, '0', STR_PAD_LEFT),
                    'serial_number' => strtoupper($faker->bothify('SN-????-####')),
                    'model' => $item->name,
                    'brand' => explode(' ', $item->name)[0], // Simple guess
                    'unit_cost' => $item->unit_cost,
                    'date_acquired' => Carbon::now()->subMonths(rand(1, 24)),
                    'category_id' => $item->category_id,
                    'condition' => 'good',
                    'status' => 'assigned',
                ]);

                $documentType = ($item->unit_cost >= 50000) ? 'PAR' : 'ICS';

                // Create the Assignment
                PropertyAssignment::create([
                    'property_id' => $property->id,
                    'assigned_to' => $emp->id,
                    'document_type' => $documentType,
                    'document_number' => $documentType.'-'.date('Y').'-'.str_pad((string) ($propNumber - 1), 4, '0', STR_PAD_LEFT),
                    'assigned_by' => $custodian->id,
                    'date_assigned' => Carbon::now()->subMonths(rand(1, 12)),
                    'remarks' => 'Initial issuance to employee.',
                ]);
            }
        }
    }
}
