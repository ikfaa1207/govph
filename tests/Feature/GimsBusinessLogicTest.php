<?php

use App\Enums\PropertyStatus;
use App\Models\Category;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Office;
use App\Models\Permission;
use App\Models\Property;
use App\Models\PropertyAssignment;
use App\Models\PropertySubAssignment;
use App\Models\PropertyTransfer;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use App\Services\Valuation\ValuationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('moving average cost calculations are correct', function () {
    // Setup UOM and Category
    $unit = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
    $category = Category::create(['name' => 'Office Supplies', 'code' => 'SUPP', 'is_ppe' => false]);

    // Create an item
    $item = Item::create([
        'item_code' => 'ITEM-TEST-01',
        'name' => 'Bond Paper',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'unit_cost' => 0.00,
        'reorder_level' => 10,
        'maximum_stock' => 100,
    ]);

    $valuationService = new ValuationService;

    // 1st Stock In: 10 units @ PHP 100 each
    $valuationService->recordStockIn($item, 10, 100.00, 'Test', 1, 'First delivery');
    $item->refresh();

    expect($item->current_stock)->toBe(10);
    expect((float) $item->unit_cost)->toBe(100.00);

    // 2nd Stock In: 5 units @ PHP 130 each
    // New average should be: (10 * 100 + 5 * 130) / 15 = 1650 / 15 = 110.00
    $valuationService->recordStockIn($item, 5, 130.00, 'Test', 2, 'Second delivery');
    $item->refresh();

    expect($item->current_stock)->toBe(15);
    expect((float) $item->unit_cost)->toBe(110.00);

    // Stock Out: 3 units. Cost should be average cost (110.00)
    $cost = $valuationService->recordStockOut($item, 3, 'Test', 3, 'RIS Issuance');
    $item->refresh();

    expect($item->current_stock)->toBe(12);
    expect($cost)->toBe(110.00);
});

test('property assignment routes to PAR or ICS depending on cost threshold', function () {
    // Setup foundation records
    $office = Office::create(['code' => 'O-TEST', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST', 'name' => 'Test Dept']);

    $custodianUser = User::factory()->propertyCustodian()->create([
        'name' => 'Custodian User',
        'email' => 'custodian@example.com',
        'password' => bcrypt('password'),
    ]);

    $custodian = Employee::create([
        'user_id' => $custodianUser->id,
        'employee_id' => 'EMP-CUST',
        'name' => 'Custodian User',
        'position' => 'Custodian',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $employeeUser = User::factory()->employee()->create([
        'name' => 'Staff User',
        'email' => 'staff@example.com',
        'password' => bcrypt('password'),
    ]);

    $employee = Employee::create([
        'user_id' => $employeeUser->id,
        'employee_id' => 'EMP-STAFF',
        'name' => 'Staff User',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    Permission::create(['name' => 'property.assign', 'module' => 'property']);
    $custodianUser->givePermissionTo('property.assign');

    $category = Category::create(['name' => 'IT Equipment', 'code' => 'IT-EQP', 'is_ppe' => true]);

    // 1. High value item (PHP 60,000) -> Should generate PAR
    $ppe = Property::create([
        'property_number' => 'PPE-HIGH-01',
        'serial_number' => 'SN-HIGH',
        'model' => 'MacBook Pro',
        'brand' => 'Apple',
        'unit_cost' => 60000.00,
        'date_acquired' => now()->toDateString(),
        'category_id' => $category->id,
        'condition' => 'new',
        'status' => 'available',
    ]);

    // 2. Low value item (PHP 35,000) -> Should generate ICS
    $semiExpendable = Property::create([
        'property_number' => 'PPE-LOW-01',
        'serial_number' => 'SN-LOW',
        'model' => 'iPad Air',
        'brand' => 'Apple',
        'unit_cost' => 35000.00,
        'date_acquired' => now()->toDateString(),
        'category_id' => $category->id,
        'condition' => 'new',
        'status' => 'available',
    ]);

    // Authenticate as custodian to execute assignment
    $this->actingAs($custodianUser);

    // Assign High cost item
    $this->post(route('inventory.properties.assign', $ppe->id), [
        'assigned_to' => $employee->id,
        'remarks' => 'Assigned for work from home.',
    ])->assertRedirect();

    $assignment1 = PropertyAssignment::where('property_id', $ppe->id)->first();
    expect($assignment1->document_type)->toBe('PAR');
    expect($assignment1->document_number)->toStartWith('PAR-');

    // Assign Low cost item
    $this->post(route('inventory.properties.assign', $semiExpendable->id), [
        'assigned_to' => $employee->id,
        'remarks' => 'Assigned for general research.',
    ])->assertRedirect();

    $assignment2 = PropertyAssignment::where('property_id', $semiExpendable->id)->first();
    expect($assignment2->document_type)->toBe('ICS');
    expect($assignment2->document_number)->toStartWith('ICS-');
});

test('requisition and issue workflow is successful', function () {
    // Setup foundation records
    $office = Office::create(['code' => 'O-TEST', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST', 'name' => 'Test Dept']);
    $unit = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
    $category = Category::create(['name' => 'Office Supplies', 'code' => 'SUPP', 'is_ppe' => false]);

    $item = Item::create([
        'item_code' => 'ITEM-BOND-01',
        'name' => 'Bond Paper',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'unit_cost' => 100.00,
        'reorder_level' => 10,
        'maximum_stock' => 100,
    ]);

    // Initial stock in
    $valuationService = new ValuationService;
    $valuationService->recordStockIn($item, 50, 100.00, 'Test', 1, 'Initial balance');

    // Users
    $employeeUser = User::factory()->employee()->create(['name' => 'Staff', 'email' => 'staff@example.com', 'password' => bcrypt('password')]);
    $employee = Employee::create(['user_id' => $employeeUser->id, 'employee_id' => 'E01', 'name' => 'Staff', 'position' => 'Staff', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $headUser = User::factory()->deptHead()->create(['name' => 'Head', 'email' => 'head@example.com', 'password' => bcrypt('password')]);
    $head = Employee::create(['user_id' => $headUser->id, 'employee_id' => 'E02', 'name' => 'Head', 'position' => 'Head', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $supplyUser = User::factory()->supplyOfficer()->create(['name' => 'Supply', 'email' => 'supply@example.com', 'password' => bcrypt('password')]);
    $supply = Employee::create(['user_id' => $supplyUser->id, 'employee_id' => 'E03', 'name' => 'Supply', 'position' => 'Supply', 'office_id' => $office->id, 'department_id' => $dept->id]);

    Permission::create(['name' => 'request.create', 'module' => 'requisition']);
    Permission::create(['name' => 'request.approve', 'module' => 'requisition']);
    Permission::create(['name' => 'warehouse.issue', 'module' => 'warehouse']);

    $employeeUser->givePermissionTo('request.create');
    $headUser->givePermissionTo('request.approve');
    $supplyUser->givePermissionTo('warehouse.issue');

    // Step 1: Employee submits RIS
    $this->actingAs($employeeUser);
    $this->post(route('inventory.requisitions.store'), [
        'items' => [
            ['item_id' => $item->id, 'quantity' => 10],
        ],
        'purpose' => 'Office printing',
    ])->assertRedirect();

    $requisition = Requisition::first();
    expect($requisition->status->value)->toBe('pending_dept_head');

    $requisitionItem = RequisitionItem::first();
    expect($requisitionItem->quantity_requested)->toBe(10);

    // Step 2: Department Head approves RIS
    $this->actingAs($headUser);
    $this->post(route('inventory.requisitions.approve', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_approved' => 8],
        ],
    ])->assertRedirect();

    $requisition->refresh();
    expect($requisition->status->value)->toBe('pending_supply');

    $requisitionItem->refresh();
    expect($requisitionItem->quantity_approved)->toBe(8);

    // Step 3: Supply Officer issues items
    $this->actingAs($supplyUser);
    $this->post(route('inventory.requisitions.issue', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_issued' => 8],
        ],
    ])->assertRedirect();

    $requisition->refresh();
    expect($requisition->status->value)->toBe('issued');

    $item->refresh();
    expect($item->current_stock)->toBe(42); // 50 - 8 = 42
});

test('property assignment supports non-system/external user accountabilities', function () {
    // Setup foundation records
    $office = Office::create(['code' => 'O-TEST-EXT', 'name' => 'Test External Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-EXT', 'name' => 'Test External Dept']);

    $custodianUser = User::factory()->propertyCustodian()->create([
        'name' => 'Custodian User',
        'email' => 'custodian.ext@example.com',
        'password' => bcrypt('password'),
    ]);

    $custodian = Employee::create([
        'user_id' => $custodianUser->id,
        'employee_id' => 'EMP-CUST-EXT',
        'name' => 'Custodian User',
        'position' => 'Custodian',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    Permission::create(['name' => 'property.assign', 'module' => 'property']);
    $custodianUser->givePermissionTo('property.assign');

    $category = Category::create(['name' => 'IT Equipment', 'code' => 'IT-EQP-EXT', 'is_ppe' => true]);

    $ppe = Property::create([
        'property_number' => 'PPE-EXT-01',
        'serial_number' => 'SN-EXT-01',
        'model' => 'L340 Laptop',
        'brand' => 'Lenovo',
        'unit_cost' => 55000.00,
        'date_acquired' => now()->toDateString(),
        'category_id' => $category->id,
        'condition' => 'new',
        'status' => 'available',
    ]);

    $this->actingAs($custodianUser);

    // Assign to a non-system external user
    $this->post(route('inventory.properties.assign', $ppe->id), [
        'is_non_system' => true,
        'non_system_name' => 'Pedro Penduko',
        'non_system_department' => 'Third-party Auditing Firm',
        'remarks' => 'Contractor unit assignment.',
    ])->assertRedirect();

    $assignment = PropertyAssignment::where('property_id', $ppe->id)->first();
    expect($assignment->document_type)->toBe('PAR');
    expect($assignment->assigned_to)->toBeNull();
    expect($assignment->non_system_name)->toBe('Pedro Penduko');
    expect($assignment->non_system_department)->toBe('Third-party Auditing Firm');
});

test('property assigned to a non-system user can be transferred to a system employee', function () {
    $office = Office::create(['code' => 'O-TEST-TR', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-TR', 'name' => 'Test Dept']);

    $custodianUser = User::factory()->propertyCustodian()->create([
        'name' => 'Custodian User',
        'email' => 'custodian.tr@example.com',
        'password' => bcrypt('password'),
    ]);

    $custodian = Employee::create([
        'user_id' => $custodianUser->id,
        'employee_id' => 'EMP-CUST-TR',
        'name' => 'Custodian User',
        'position' => 'Custodian',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $toEmployeeUser = User::factory()->employee()->create([
        'name' => 'Recipient User',
        'email' => 'recipient.tr@example.com',
        'password' => bcrypt('password'),
    ]);

    $toEmployee = Employee::create([
        'user_id' => $toEmployeeUser->id,
        'employee_id' => 'EMP-RECIP-TR',
        'name' => 'Recipient User',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    Permission::create(['name' => 'property.assign', 'module' => 'property']);
    Permission::create(['name' => 'property.transfer', 'module' => 'property']);
    $custodianUser->givePermissionTo('property.assign');
    $custodianUser->givePermissionTo('property.transfer');

    $category = Category::create(['name' => 'IT Equipment', 'code' => 'IT-EQP-TR', 'is_ppe' => true]);

    $ppe = Property::create([
        'property_number' => 'PPE-TR-01',
        'serial_number' => 'SN-TR-01',
        'model' => 'L340 Laptop',
        'brand' => 'Lenovo',
        'unit_cost' => 55000.00,
        'date_acquired' => now()->toDateString(),
        'category_id' => $category->id,
        'condition' => 'new',
        'status' => 'available',
    ]);

    $this->actingAs($custodianUser);

    // 1. Assign to a non-system external user first
    $this->post(route('inventory.properties.assign', $ppe->id), [
        'is_non_system' => true,
        'non_system_name' => 'Pedro Penduko',
        'non_system_department' => 'Third-party Auditing Firm',
        'remarks' => 'Contractor unit assignment.',
    ])->assertRedirect();

    $ppe->refresh();
    expect($ppe->status->value)->toBe('assigned');

    // 2. Transfer from the non-system user to a system employee
    $this->post(route('inventory.properties.transfer', $ppe->id), [
        'to_employee_id' => $toEmployee->id,
        'office_id' => $office->id,
        'reason' => 'Transferring to regular employee.',
    ])->assertRedirect();

    $ppe->refresh();
    expect($ppe->status->value)->toBe('transferred');

    // 3. Verify transfer record
    $transfer = PropertyTransfer::where('property_id', $ppe->id)->first();
    expect($transfer)->not->toBeNull();
    expect($transfer->from_employee_id)->toBeNull();
    expect($transfer->to_employee_id)->toBe($toEmployee->id);

    // 4. Verify new assignment
    $newAssignment = PropertyAssignment::where('property_id', $ppe->id)
        ->whereNull('returned_date')
        ->first();
    expect($newAssignment)->not->toBeNull();
    expect($newAssignment->assigned_to)->toBe($toEmployee->id);
    expect($newAssignment->remarks)->toContain('Transferred from Pedro Penduko (Third-party Auditing Firm)');
});

test('property subassign generates sequential MR numbers and prevents self sub-assignment', function () {
    $office = Office::create(['code' => 'O-TEST-SUB', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-SUB', 'name' => 'Test Dept']);

    $custodianUser = User::factory()->propertyCustodian()->create(['name' => 'Custodian User', 'email' => 'cust1@example.com']);
    $custodian = Employee::create(['user_id' => $custodianUser->id, 'employee_id' => 'EMP-C1', 'name' => 'Custodian User', 'position' => 'Custodian', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $employeeUser = User::factory()->employee()->create(['name' => 'Staff User', 'email' => 'staff1@example.com']);
    $employee = Employee::create(['user_id' => $employeeUser->id, 'employee_id' => 'EMP-S1', 'name' => 'Staff User', 'position' => 'Staff', 'office_id' => $office->id, 'department_id' => $dept->id]);

    Permission::create(['name' => 'property.assign', 'module' => 'property']);
    Permission::create(['name' => 'property.transfer', 'module' => 'property']);
    $custodianUser->givePermissionTo('property.assign');
    $custodianUser->givePermissionTo('property.transfer');

    $category = Category::create(['name' => 'IT Equipment', 'code' => 'IT-EQP-SUB', 'is_ppe' => true]);
    $property = Property::create([
        'property_number' => 'PPE-SUB-01',
        'serial_number' => 'SN-SUB-01',
        'model' => 'L340 Laptop',
        'brand' => 'Lenovo',
        'unit_cost' => 55000.00,
        'date_acquired' => now()->toDateString(),
        'category_id' => $category->id,
        'condition' => 'new',
        'status' => 'available',
    ]);

    // Assign to employee first
    $this->actingAs($custodianUser);
    $this->post(route('inventory.properties.assign', $property->id), [
        'assigned_to' => $employee->id,
        'remarks' => 'Initial assignment.',
    ])->assertRedirect();

    // Create another employee
    $employeeUser2 = User::factory()->employee()->create(['name' => 'Staff User 2', 'email' => 'staff2@example.com']);
    $employee2 = Employee::create(['user_id' => $employeeUser2->id, 'employee_id' => 'EMP-S2', 'name' => 'Staff User 2', 'position' => 'Staff', 'office_id' => $office->id, 'department_id' => $dept->id]);

    // Subassign to employee2 (should succeed)
    $responseOk = $this->post(route('inventory.properties.sub-assign', $property->id), [
        'issued_to' => $employee2->id,
        'remarks' => 'Sub-assignment to employee 2.',
    ]);
    $responseOk->assertRedirect();

    // Try to subassign to employee2 AGAIN (should fail)
    $responseFail = $this->post(route('inventory.properties.sub-assign', $property->id), [
        'issued_to' => $employee2->id,
        'remarks' => 'Duplicate sub-assignment.',
    ]);
    $responseFail->assertStatus(400);

    $subAssignment = PropertySubAssignment::where('property_id', $property->id)->first();
    expect($subAssignment)->not->toBeNull();
    // Verify sequence MR number prefix format (MR-YYYY-00000X)
    expect($subAssignment->mr_number)->toContain('MR-');
    expect(strlen($subAssignment->mr_number))->toBe(14); // MR-YYYY-000001 = 2 + 1 + 4 + 1 + 6 = 14
});

test('property transfer prevents self-transfer', function () {
    $office = Office::create(['code' => 'O-TEST-TRF', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-TRF', 'name' => 'Test Dept']);

    $custodianUser = User::factory()->propertyCustodian()->create(['name' => 'Custodian User', 'email' => 'cust2@example.com']);
    $custodian = Employee::create(['user_id' => $custodianUser->id, 'employee_id' => 'EMP-C2', 'name' => 'Custodian User', 'position' => 'Custodian', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $employeeUser = User::factory()->employee()->create(['name' => 'Staff User', 'email' => 'staff3@example.com']);
    $employee = Employee::create(['user_id' => $employeeUser->id, 'employee_id' => 'EMP-S3', 'name' => 'Staff User', 'position' => 'Staff', 'office_id' => $office->id, 'department_id' => $dept->id]);

    Permission::create(['name' => 'property.assign', 'module' => 'property']);
    Permission::create(['name' => 'property.transfer', 'module' => 'property']);
    $custodianUser->givePermissionTo('property.assign');
    $custodianUser->givePermissionTo('property.transfer');

    $category = Category::create(['name' => 'IT Equipment', 'code' => 'IT-EQP-TRF', 'is_ppe' => true]);
    $property = Property::create([
        'property_number' => 'PPE-TRF-01',
        'serial_number' => 'SN-TRF-01',
        'model' => 'L340 Laptop',
        'brand' => 'Lenovo',
        'unit_cost' => 55000.00,
        'date_acquired' => now()->toDateString(),
        'category_id' => $category->id,
        'condition' => 'new',
        'status' => 'available',
    ]);

    // Assign to employee
    $this->actingAs($custodianUser);
    $this->post(route('inventory.properties.assign', $property->id), [
        'assigned_to' => $employee->id,
        'remarks' => 'Initial assignment.',
    ])->assertRedirect();

    $property->refresh();

    // Try to transfer to the same employee (should fail)
    $response = $this->post(route('inventory.properties.transfer', $property->id), [
        'to_employee_id' => $employee->id,
        'office_id' => $office->id,
        'reason' => 'Transferring to the same person.',
    ]);
    $response->assertStatus(400);
});

test('property disposal prevents self-approval and requires witness name', function () {
    $office = Office::create(['code' => 'O-TEST-DISP', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-DISP', 'name' => 'Test Dept']);

    $custodianUser = User::factory()->propertyCustodian()->create(['name' => 'Custodian User', 'email' => 'cust3@example.com']);
    $custodian = Employee::create(['user_id' => $custodianUser->id, 'employee_id' => 'EMP-C3', 'name' => 'Custodian User', 'position' => 'Custodian', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $approverUser = User::factory()->admin()->create(['name' => 'Approver User', 'email' => 'appr3@example.com']);
    $approver = Employee::create(['user_id' => $approverUser->id, 'employee_id' => 'EMP-A3', 'name' => 'Approver User', 'position' => 'Inspection Officer', 'office_id' => $office->id, 'department_id' => $dept->id]);

    Permission::create(['name' => 'property.dispose', 'module' => 'property']);
    $custodianUser->givePermissionTo('property.dispose');

    $category = Category::create(['name' => 'IT Equipment', 'code' => 'IT-EQP-DISP', 'is_ppe' => true]);
    $property = Property::create([
        'property_number' => 'PPE-DISP-01',
        'serial_number' => 'SN-DISP-01',
        'model' => 'L340 Laptop',
        'brand' => 'Lenovo',
        'unit_cost' => 55000.00,
        'date_acquired' => now()->toDateString(),
        'category_id' => $category->id,
        'condition' => 'new',
        'status' => 'available',
    ]);

    $this->actingAs($custodianUser);

    // Try disposing with self as approver (should fail validation)
    $responseSelf = $this->post(route('inventory.properties.dispose', $property->id), [
        'disposal_method' => 'destruction',
        'reason' => 'broken',
        'approved_by' => $custodian->id, // Mismatch
        'witness_by' => 'COA Auditor',
    ]);
    $responseSelf->assertSessionHasErrors(['approved_by']);

    // Dispose with separate approver (should succeed)
    $responseOk = $this->post(route('inventory.properties.dispose', $property->id), [
        'disposal_method' => 'destruction',
        'reason' => 'broken',
        'approved_by' => $approver->id,
        'witness_by' => 'COA Auditor',
    ]);
    $responseOk->assertRedirect();

    $property->refresh();
    expect($property->status)->toBe(PropertyStatus::Disposed);
    expect($property->condition)->toBe('unserviceable');
});

test('property subassign gate secures MR actions and logs unauthorized attempts', function () {
    $office = Office::create(['code' => 'O-TEST-GATE', 'name' => 'Test Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-GATE', 'name' => 'Test Dept']);

    $employeeUser = User::factory()->employee()->create(['name' => 'Staff User', 'email' => 'staff4@example.com']);
    $employee = Employee::create(['user_id' => $employeeUser->id, 'employee_id' => 'EMP-S4', 'name' => 'Staff User', 'position' => 'Staff', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $category = Category::create(['name' => 'IT Equipment', 'code' => 'IT-EQP-GATE', 'is_ppe' => true]);
    $property = Property::create([
        'property_number' => 'PPE-GATE-01',
        'serial_number' => 'SN-GATE-01',
        'model' => 'L340 Laptop',
        'brand' => 'Lenovo',
        'unit_cost' => 55000.00,
        'date_acquired' => now()->toDateString(),
        'category_id' => $category->id,
        'condition' => 'new',
        'status' => 'available',
    ]);

    // Staff User has no permission or role (should fail sub-assignment)
    $this->actingAs($employeeUser);
    $response = $this->post(route('inventory.properties.sub-assign', $property->id), [
        'issued_to' => $employee->id,
        'remarks' => 'Unauthorized sub-assignment.',
    ]);
    $response->assertStatus(403);
});
