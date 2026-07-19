<?php

use App\Models\Category;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Location;
use App\Models\Office;
use App\Models\Permission;
use App\Models\PurchaseOrder;
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

test('procurement visibility is correctly scoped by role and department', function () {
    // Seed needed permissions
    Permission::firstOrCreate(['name' => 'warehouse.issue', 'module' => 'warehouse', 'description' => 'Issue stocks']);
    Permission::firstOrCreate(['name' => 'request.approve', 'module' => 'requisition', 'description' => 'Approve requests']);

    // Setup another office and department
    $otherOffice = Office::create(['code' => 'O-2', 'name' => 'Office 2']);
    $otherDept = Department::create([
        'office_id' => $otherOffice->id,
        'code' => 'HRD',
        'name' => 'HR Department',
    ]);

    // Users and Employees
    // 1. Supply Officer (Global Access)
    $supplyUser = User::factory()->create();
    $supplyUser->givePermissionTo('procurement.view', 'warehouse.issue');
    $supplyEmployee = Employee::create([
        'user_id' => $supplyUser->id,
        'employee_id' => 'EMP-SUP1',
        'name' => 'Supply Officer',
        'position' => 'Officer',
        'office_id' => $this->office->id,
        'department_id' => $this->department->id,
    ]);

    // 2. Department Head for IT
    $itHeadUser = User::factory()->create();
    $itHeadUser->givePermissionTo('procurement.view', 'request.approve');
    $itHeadEmployee = Employee::create([
        'user_id' => $itHeadUser->id,
        'employee_id' => 'EMP-H1',
        'name' => 'IT Head',
        'position' => 'IT Head',
        'office_id' => $this->office->id,
        'department_id' => $this->department->id,
    ]);

    // 3. Department Head for HR
    $hrHeadUser = User::factory()->create();
    $hrHeadUser->givePermissionTo('procurement.view', 'request.approve');
    $hrHeadEmployee = Employee::create([
        'user_id' => $hrHeadUser->id,
        'employee_id' => 'EMP-H2',
        'name' => 'HR Head',
        'position' => 'HR Head',
        'office_id' => $otherOffice->id,
        'department_id' => $otherDept->id,
    ]);

    // 4. Regular Employee in IT
    $itStaffUser = User::factory()->create();
    $itStaffUser->givePermissionTo('procurement.view');
    $itStaffEmployee = Employee::create([
        'user_id' => $itStaffUser->id,
        'employee_id' => 'EMP-S1',
        'name' => 'IT Staff',
        'position' => 'Staff',
        'office_id' => $this->office->id,
        'department_id' => $this->department->id,
    ]);

    // Create a PR and PO in IT Department (requested by IT Staff)
    $itPR = PurchaseRequest::create([
        'pr_number' => 'PR-IT-1',
        'requested_by' => $itStaffEmployee->id,
        'department_id' => $this->department->id,
        'purpose' => 'IT purchase',
        'status' => 'approved',
    ]);
    $itPO = PurchaseOrder::create([
        'purchase_request_id' => $itPR->id,
        'po_number' => 'PO-IT-1',
        'supplier_id' => $this->supplier->id,
        'po_date' => today()->toDateString(),
        'status' => 'draft',
    ]);

    // Create a PR and PO in HR Department (requested by HR Head)
    $hrPR = PurchaseRequest::create([
        'pr_number' => 'PR-HR-1',
        'requested_by' => $hrHeadEmployee->id,
        'department_id' => $otherDept->id,
        'purpose' => 'HR purchase',
        'status' => 'approved',
    ]);
    $hrPO = PurchaseOrder::create([
        'purchase_request_id' => $hrPR->id,
        'po_number' => 'PO-HR-1',
        'supplier_id' => $this->supplier->id,
        'po_date' => today()->toDateString(),
        'status' => 'draft',
    ]);

    // Verification 1: Supply Officer can see both PRs and POs
    $this->actingAs($supplyUser);
    $response = $this->get(route('inventory.purchase-requests.index'));
    $response->assertOk();
    $this->assertCount(2, $response->viewData('page')['props']['purchaseRequests']['data']);

    $response = $this->get(route('inventory.purchase-orders.index'));
    $response->assertOk();
    $this->assertCount(2, $response->viewData('page')['props']['purchaseOrders']['data']);

    // Verification 2: IT Head can only see IT PRs/POs, not HR ones
    $this->actingAs($itHeadUser);
    $response = $this->get(route('inventory.purchase-requests.index'));
    $response->assertOk();
    $this->assertCount(1, $response->viewData('page')['props']['purchaseRequests']['data']);
    $this->assertEquals('PR-IT-1', $response->viewData('page')['props']['purchaseRequests']['data'][0]['pr_number']);

    $response = $this->get(route('inventory.purchase-orders.index'));
    $response->assertOk();
    $this->assertCount(1, $response->viewData('page')['props']['purchaseOrders']['data']);
    $this->assertEquals('PO-IT-1', $response->viewData('page')['props']['purchaseOrders']['data'][0]['po_number']);

    // Verification 3: IT Staff can only see their own PR/PO
    $this->actingAs($itStaffUser);
    $response = $this->get(route('inventory.purchase-requests.index'));
    $response->assertOk();
    $this->assertCount(1, $response->viewData('page')['props']['purchaseRequests']['data']);
    $this->assertEquals('PR-IT-1', $response->viewData('page')['props']['purchaseRequests']['data'][0]['pr_number']);

    // Verification 4: HR Head can only see HR PRs/POs
    $this->actingAs($hrHeadUser);
    $response = $this->get(route('inventory.purchase-requests.index'));
    $response->assertOk();
    $this->assertCount(1, $response->viewData('page')['props']['purchaseRequests']['data']);
    $this->assertEquals('PR-HR-1', $response->viewData('page')['props']['purchaseRequests']['data'][0]['pr_number']);

    $response = $this->get(route('inventory.purchase-orders.index'));
    $response->assertOk();
    $this->assertCount(1, $response->viewData('page')['props']['purchaseOrders']['data']);
    $this->assertEquals('PO-HR-1', $response->viewData('page')['props']['purchaseOrders']['data'][0]['po_number']);

    // Verification 5: Property Custodian (who has property.assign) is scoped by department/personal and cannot see all
    Permission::firstOrCreate(['name' => 'property.assign', 'module' => 'property', 'description' => 'Assign property']);
    $custodianUser = User::factory()->create();
    $custodianUser->givePermissionTo('procurement.view', 'property.assign');
    $custodianEmployee = Employee::create([
        'user_id' => $custodianUser->id,
        'employee_id' => 'EMP-CUST1',
        'name' => 'Property Custodian',
        'position' => 'Custodian',
        'office_id' => $otherOffice->id,
        'department_id' => $otherDept->id,
    ]);

    $this->actingAs($custodianUser);
    $response = $this->get(route('inventory.purchase-requests.index'));
    $response->assertOk();
    // They did not request any PRs personally, so they should see 0 (not 2 or 1 from other departments)
    $this->assertCount(0, $response->viewData('page')['props']['purchaseRequests']['data']);
});
