<?php

use App\Models\Category;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Office;
use App\Models\Property;
use App\Models\PropertyAssignment;
use App\Models\Requisition;
use App\Models\RequisitionItem;
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

    $valuationService = new ValuationService();

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
    
    $custodianUser = User::create([
        'name' => 'Custodian User',
        'email' => 'custodian@example.com',
        'password' => bcrypt('password'),
        'role' => 'property_custodian'
    ]);
    
    $custodian = Employee::create([
        'user_id' => $custodianUser->id,
        'employee_id' => 'EMP-CUST',
        'name' => 'Custodian User',
        'position' => 'Custodian',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $employeeUser = User::create([
        'name' => 'Staff User',
        'email' => 'staff@example.com',
        'password' => bcrypt('password'),
        'role' => 'employee'
    ]);

    $employee = Employee::create([
        'user_id' => $employeeUser->id,
        'employee_id' => 'EMP-STAFF',
        'name' => 'Staff User',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    \App\Models\Permission::create(['name' => 'property.assign', 'module' => 'property']);
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
    $valuationService = new ValuationService();
    $valuationService->recordStockIn($item, 50, 100.00, 'Test', 1, 'Initial balance');

    // Users
    $employeeUser = User::create(['name' => 'Staff', 'email' => 'staff@example.com', 'password' => bcrypt('password'), 'role' => 'employee']);
    $employee = Employee::create(['user_id' => $employeeUser->id, 'employee_id' => 'E01', 'name' => 'Staff', 'position' => 'Staff', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $headUser = User::create(['name' => 'Head', 'email' => 'head@example.com', 'password' => bcrypt('password'), 'role' => 'dept_head']);
    $head = Employee::create(['user_id' => $headUser->id, 'employee_id' => 'E02', 'name' => 'Head', 'position' => 'Head', 'office_id' => $office->id, 'department_id' => $dept->id]);

    $supplyUser = User::create(['name' => 'Supply', 'email' => 'supply@example.com', 'password' => bcrypt('password'), 'role' => 'supply_officer']);
    $supply = Employee::create(['user_id' => $supplyUser->id, 'employee_id' => 'E03', 'name' => 'Supply', 'position' => 'Supply', 'office_id' => $office->id, 'department_id' => $dept->id]);

    \App\Models\Permission::create(['name' => 'request.create', 'module' => 'requisition']);
    \App\Models\Permission::create(['name' => 'request.approve', 'module' => 'requisition']);
    \App\Models\Permission::create(['name' => 'warehouse.issue', 'module' => 'warehouse']);

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
    expect($requisition->status)->toBe('pending_dept_head');

    $requisitionItem = RequisitionItem::first();
    expect($requisitionItem->quantity_requested)->toBe(10);

    // Step 2: Department Head approves RIS
    $this->actingAs($headUser);
    $this->post(route('inventory.requisitions.approve', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_approved' => 8],
        ]
    ])->assertRedirect();

    $requisition->refresh();
    expect($requisition->status)->toBe('pending_supply');

    $requisitionItem->refresh();
    expect($requisitionItem->quantity_approved)->toBe(8);

    // Step 3: Supply Officer issues items
    $this->actingAs($supplyUser);
    $this->post(route('inventory.requisitions.issue', $requisition->id), [
        'items' => [
            ['id' => $requisitionItem->id, 'quantity_issued' => 8],
        ]
    ])->assertRedirect();

    $requisition->refresh();
    expect($requisition->status)->toBe('issued');

    $item->refresh();
    expect($item->current_stock)->toBe(42); // 50 - 8 = 42
});

test('property assignment supports non-system/external user accountabilities', function () {
    // Setup foundation records
    $office = Office::create(['code' => 'O-TEST-EXT', 'name' => 'Test External Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-TEST-EXT', 'name' => 'Test External Dept']);
    
    $custodianUser = User::create([
        'name' => 'Custodian User',
        'email' => 'custodian.ext@example.com',
        'password' => bcrypt('password'),
        'role' => 'property_custodian'
    ]);
    
    $custodian = Employee::create([
        'user_id' => $custodianUser->id,
        'employee_id' => 'EMP-CUST-EXT',
        'name' => 'Custodian User',
        'position' => 'Custodian',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    \App\Models\Permission::create(['name' => 'property.assign', 'module' => 'property']);
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
