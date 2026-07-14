<?php

use App\Models\Category;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Location;
use App\Models\Office;
use App\Models\Permission;
use App\Models\PurchaseRequest;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed required permissions
    Permission::firstOrCreate(['name' => 'procurement.view', 'module' => 'procurement', 'description' => 'View PR/PO']);
    Permission::firstOrCreate(['name' => 'procurement.create', 'module' => 'procurement', 'description' => 'Create PR/PO']);
    Permission::firstOrCreate(['name' => 'procurement.approve', 'module' => 'procurement', 'description' => 'Approve PR/PO']);
    Permission::firstOrCreate(['name' => 'inventory.view', 'module' => 'inventory', 'description' => 'View Inventory']);

    // Seed dependencies for Department/Employee
    $this->office = Office::create(['code' => 'O-1', 'name' => 'Office 1']);
    $this->department = Department::create([
        'office_id' => $this->office->id,
        'code' => 'ITD',
        'name' => 'IT Department',
    ]);

    // Seed mock Supplier
    $this->supplier = Supplier::create([
        'name' => 'Supplier Co',
        'tin' => '111-222-333-000',
        'contact_person' => 'Supplier Rep',
        'address' => 'Supplier Road',
    ]);

    // Seed category, unit, warehouse, location
    $this->category = Category::create(['name' => 'Supplies', 'code' => 'SUPP', 'is_ppe' => false]);
    $this->unit = Unit::create(['name' => 'Box', 'abbreviation' => 'box']);
    $this->warehouse = Warehouse::create(['name' => 'WH 1', 'address' => 'WH Addr 1']);
    $this->location = Location::create(['warehouse_id' => $this->warehouse->id, 'code' => 'LOC-1']);

    // Seed mock Item
    $this->item = Item::create([
        'item_code' => 'IT-001',
        'name' => 'Laptop',
        'category_id' => $this->category->id,
        'unit_id' => $this->unit->id,
        'unit_cost' => 50000.00,
        'location_id' => $this->location->id,
        'status' => 'active',
    ]);
});

test('unauthorized users cannot create a purchase request', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('inventory.purchase-requests.store'), [
            'department_id' => $this->department->id,
            'purpose' => 'For development team',
            'items' => [
                ['item_id' => $this->item->id, 'quantity' => 5, 'estimated_unit_cost' => 50000.00],
            ],
        ]);

    $response->assertForbidden();
});

test('authorized supply officers with employee profile can create a purchase request', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('procurement.create');

    // Create employee profile
    $employee = Employee::create([
        'user_id' => $user->id,
        'employee_id' => 'EMP-001',
        'name' => 'Supply Officer Name',
        'position' => 'Officer',
        'office_id' => $this->office->id,
        'department_id' => $this->department->id,
    ]);

    $response = $this->actingAs($user)
        ->post(route('inventory.purchase-requests.store'), [
            'department_id' => $this->department->id,
            'purpose' => 'For development team',
            'items' => [
                ['item_id' => $this->item->id, 'quantity' => 5, 'estimated_unit_cost' => 50000.00, 'remarks' => 'Urgent'],
            ],
        ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('purchase_requests', [
        'requested_by' => $employee->id,
        'department_id' => $this->department->id,
        'purpose' => 'For development team',
        'status' => 'pending',
    ]);

    $this->assertDatabaseHas('purchase_request_items', [
        'item_id' => $this->item->id,
        'quantity' => 5,
        'estimated_unit_cost' => 50000.00,
        'remarks' => 'Urgent',
    ]);
});

test('unauthorized users cannot approve a purchase request', function () {
    $prUser = User::factory()->create();
    $prEmployee = Employee::create([
        'user_id' => $prUser->id,
        'employee_id' => 'EMP-001',
        'name' => 'Supply Officer Name',
        'position' => 'Officer',
        'office_id' => $this->office->id,
        'department_id' => $this->department->id,
    ]);

    $pr = PurchaseRequest::create([
        'pr_number' => 'PR-123',
        'requested_by' => $prEmployee->id,
        'department_id' => $this->department->id,
        'purpose' => 'Pr purpose',
        'status' => 'pending',
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post(route('inventory.purchase-requests.approve', $pr));

    $response->assertForbidden();
});

test('authorized users can approve a pending purchase request but not their own', function () {
    $prUser = User::factory()->create();
    $prEmployee = Employee::create([
        'user_id' => $prUser->id,
        'employee_id' => 'EMP-001',
        'name' => 'Supply Officer Name',
        'position' => 'Officer',
        'office_id' => $this->office->id,
        'department_id' => $this->department->id,
    ]);

    $pr = PurchaseRequest::create([
        'pr_number' => 'PR-123',
        'requested_by' => $prEmployee->id,
        'department_id' => $this->department->id,
        'purpose' => 'Pr purpose',
        'status' => 'pending',
    ]);

    // Test self-approval prevention
    $prUser->givePermissionTo('procurement.approve');
    $response = $this->actingAs($prUser)
        ->post(route('inventory.purchase-requests.approve', $pr));

    $response->assertForbidden();

    // Test proper approval
    $approverUser = User::factory()->create();
    $approverUser->givePermissionTo('procurement.approve');
    $approverEmployee = Employee::create([
        'user_id' => $approverUser->id,
        'employee_id' => 'EMP-002',
        'name' => 'Approver Employee',
        'position' => 'Head',
        'office_id' => $this->office->id,
        'department_id' => $this->department->id,
    ]);

    $response2 = $this->actingAs($approverUser)
        ->post(route('inventory.purchase-requests.approve', $pr));

    $response2->assertRedirect();
    $this->assertDatabaseHas('purchase_requests', [
        'id' => $pr->id,
        'status' => 'approved',
        'approved_by' => $approverUser->id,
    ]);
});

test('cannot generate a PO from a non-approved PR', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('procurement.create');
    $employee = Employee::create([
        'user_id' => $user->id,
        'employee_id' => 'EMP-001',
        'name' => 'Officer',
        'position' => 'Officer',
        'office_id' => $this->office->id,
        'department_id' => $this->department->id,
    ]);

    $pr = PurchaseRequest::create([
        'pr_number' => 'PR-123',
        'requested_by' => $employee->id,
        'department_id' => $this->department->id,
        'purpose' => 'Pr purpose',
        'status' => 'pending', // NOT approved
    ]);

    $response = $this->actingAs($user)
        ->post(route('inventory.purchase-orders.store'), [
            'purchase_request_id' => $pr->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => today()->toDateString(),
            'items' => [
                ['item_id' => $this->item->id, 'quantity' => 5, 'unit_cost' => 48000.00],
            ],
        ]);

    $response->assertRedirect();
    // It should redirect back with validation errors
    $response->assertSessionHasErrors(['purchase_request_id']);
});

test('can generate a PO from an approved PR', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('procurement.create');
    $employee = Employee::create([
        'user_id' => $user->id,
        'employee_id' => 'EMP-001',
        'name' => 'Officer',
        'position' => 'Officer',
        'office_id' => $this->office->id,
        'department_id' => $this->department->id,
    ]);

    $pr = PurchaseRequest::create([
        'pr_number' => 'PR-123',
        'requested_by' => $employee->id,
        'department_id' => $this->department->id,
        'purpose' => 'Pr purpose',
        'status' => 'approved',
    ]);

    $response = $this->actingAs($user)
        ->post(route('inventory.purchase-orders.store'), [
            'purchase_request_id' => $pr->id,
            'supplier_id' => $this->supplier->id,
            'po_date' => today()->toDateString(),
            'items' => [
                ['item_id' => $this->item->id, 'quantity' => 5, 'unit_cost' => 48000.00, 'remarks' => 'Negotiated pricing'],
            ],
        ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('purchase_orders', [
        'purchase_request_id' => $pr->id,
        'supplier_id' => $this->supplier->id,
        'status' => 'draft',
    ]);

    $this->assertDatabaseHas('purchase_order_items', [
        'item_id' => $this->item->id,
        'quantity' => 5,
        'unit_cost' => 48000.00,
        'remarks' => 'Negotiated pricing',
    ]);

    // PR status should be updated to ordered
    $this->assertEquals('ordered', $pr->fresh()->status);
});
