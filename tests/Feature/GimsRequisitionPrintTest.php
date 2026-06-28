<?php

use App\Models\Category;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Office;
use App\Models\Permission;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Setup foundation records
    $this->office = Office::create(['code' => 'O-HQ', 'name' => 'Headquarters']);
    $this->deptA = Department::create(['office_id' => $this->office->id, 'code' => 'D-ACCT', 'name' => 'Accounting']);
    $this->deptB = Department::create(['office_id' => $this->office->id, 'code' => 'D-HR', 'name' => 'Human Resources']);

    $this->unit = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
    $this->category = Category::create(['name' => 'Office Supplies', 'code' => 'SUPP', 'is_ppe' => false]);

    $this->item = Item::create([
        'item_code' => 'ITEM-BOND-01',
        'name' => 'Bond Paper',
        'category_id' => $this->category->id,
        'unit_id' => $this->unit->id,
        'unit_cost' => 100.00,
        'reorder_level' => 10,
        'maximum_stock' => 100,
    ]);

    // Create necessary permissions
    $this->permView = Permission::create(['name' => 'inventory.view', 'module' => 'inventory']);
    $this->permApprove = Permission::create(['name' => 'request.approve', 'module' => 'requisition']);
    $this->permIssue = Permission::create(['name' => 'warehouse.issue', 'module' => 'warehouse']);
    $this->permAudit = Permission::create(['name' => 'audit.view', 'module' => 'audit']);

    // Create Users & Employees
    // 1. Requester Employee (Dept A)
    $this->requesterUser = User::create(['name' => 'Requester', 'email' => 'req@example.com', 'password' => bcrypt('password'), 'role' => 'employee']);
    $this->requesterEmp = Employee::create(['user_id' => $this->requesterUser->id, 'employee_id' => 'EMP-REQ', 'name' => 'Requester Employee', 'position' => 'Staff', 'office_id' => $this->office->id, 'department_id' => $this->deptA->id]);
    $this->requesterUser->givePermissionTo($this->permView);

    // 2. Department Head (Dept A)
    $this->deptHeadUser = User::create(['name' => 'Dept Head A', 'email' => 'head-a@example.com', 'password' => bcrypt('password'), 'role' => 'dept_head']);
    $this->deptHeadEmp = Employee::create(['user_id' => $this->deptHeadUser->id, 'employee_id' => 'EMP-HEAD-A', 'name' => 'Dept Head A Employee', 'position' => 'Chief Accountant', 'office_id' => $this->office->id, 'department_id' => $this->deptA->id]);
    $this->deptHeadUser->givePermissionTo($this->permView, $this->permApprove);

    // 3. Other Employee (Dept B)
    $this->otherUser = User::create(['name' => 'Other', 'email' => 'other@example.com', 'password' => bcrypt('password'), 'role' => 'employee']);
    $this->otherEmp = Employee::create(['user_id' => $this->otherUser->id, 'employee_id' => 'EMP-OTHER', 'name' => 'Other Employee', 'position' => 'Staff', 'office_id' => $this->office->id, 'department_id' => $this->deptB->id]);
    $this->otherUser->givePermissionTo($this->permView);

    // 4. Other Department Head (Dept B)
    $this->otherHeadUser = User::create(['name' => 'Dept Head B', 'email' => 'head-b@example.com', 'password' => bcrypt('password'), 'role' => 'dept_head']);
    $this->otherHeadEmp = Employee::create(['user_id' => $this->otherHeadUser->id, 'employee_id' => 'EMP-HEAD-B', 'name' => 'Dept Head B Employee', 'position' => 'HR Manager', 'office_id' => $this->office->id, 'department_id' => $this->deptB->id]);
    $this->otherHeadUser->givePermissionTo($this->permView, $this->permApprove);

    // 5. Supply Officer
    $this->supplyUser = User::create(['name' => 'Supply Officer', 'email' => 'supply@example.com', 'password' => bcrypt('password'), 'role' => 'supply_officer']);
    $this->supplyEmp = Employee::create(['user_id' => $this->supplyUser->id, 'employee_id' => 'EMP-SUPPLY', 'name' => 'Supply Officer Employee', 'position' => 'Supply Officer', 'office_id' => $this->office->id, 'department_id' => $this->deptA->id]);
    $this->supplyUser->givePermissionTo($this->permView, $this->permIssue);

    // 6. Auditor
    $this->auditorUser = User::create(['name' => 'Auditor', 'email' => 'auditor@example.com', 'password' => bcrypt('password'), 'role' => 'auditor']);
    $this->auditorEmp = Employee::create(['user_id' => $this->auditorUser->id, 'employee_id' => 'EMP-AUDIT', 'name' => 'Auditor Employee', 'position' => 'State Auditor', 'office_id' => $this->office->id, 'department_id' => $this->deptA->id]);
    $this->auditorUser->givePermissionTo($this->permView, $this->permAudit);

    // Create Requisition for Requester Employee (Dept A)
    $this->requisition = Requisition::create([
        'ris_number' => 'RIS-2026-TEST',
        'requesting_employee_id' => $this->requesterEmp->id,
        'department_id' => $this->deptA->id,
        'status' => 'pending_dept_head',
        'remarks' => 'Monthly supplies',
    ]);

    $this->requisitionItem = RequisitionItem::create([
        'requisition_id' => $this->requisition->id,
        'item_id' => $this->item->id,
        'quantity_requested' => 10,
    ]);
});

test('requester employee can access print page for their own RIS', function () {
    $this->actingAs($this->requesterUser);

    $response = $this->get(route('inventory.requisitions.print', $this->requisition->id));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('inventory/requisitions/print')
        ->has('requisition')
        ->where('requisition.ris_number', 'RIS-2026-TEST')
    );
});

test('other employee cannot access print page for a different RIS', function () {
    $this->actingAs($this->otherUser);

    $response = $this->get(route('inventory.requisitions.print', $this->requisition->id));

    $response->assertForbidden();
});

test('department head can access print page for RIS in their department', function () {
    $this->actingAs($this->deptHeadUser);

    $response = $this->get(route('inventory.requisitions.print', $this->requisition->id));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('inventory/requisitions/print'));
});

test('other department head cannot access print page for RIS in a different department', function () {
    $this->actingAs($this->otherHeadUser);

    $response = $this->get(route('inventory.requisitions.print', $this->requisition->id));

    $response->assertForbidden();
});

test('supply officer can access print page for any RIS', function () {
    $this->actingAs($this->supplyUser);

    $response = $this->get(route('inventory.requisitions.print', $this->requisition->id));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('inventory/requisitions/print'));
});

test('auditor can access print page for any RIS', function () {
    $this->actingAs($this->auditorUser);

    $response = $this->get(route('inventory.requisitions.print', $this->requisition->id));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('inventory/requisitions/print'));
});
