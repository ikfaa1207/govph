<?php

use App\Models\Category;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Location;
use App\Models\Office;
use App\Models\Permission;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create baseline permission
    Permission::firstOrCreate([
        'name' => 'warehouse.receive',
        'module' => 'warehouse',
        'description' => 'Receive items',
    ]);
});

test('unauthorized users cannot access receiving reports index', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->get(route('inventory.receiving.index'));

    $response->assertForbidden();
});

test('authorized users can view receiving reports index', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('warehouse.receive');

    $response = $this->actingAs($user)
        ->get(route('inventory.receiving.index'));

    $response->assertSuccessful();
});

test('can create receiving report and update stock and moving average cost', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('warehouse.receive');

    // Create necessary seed objects
    $office = Office::create(['code' => 'O-1', 'name' => 'Office 1']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-1', 'name' => 'Dept 1']);
    $employee = Employee::create([
        'user_id' => $user->id,
        'employee_id' => 'EMP-001',
        'name' => 'Supply Officer Name',
        'position' => 'Officer',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $supplier = Supplier::create([
        'name' => 'Test Supplier',
        'address' => 'Addr 1',
        'contact_person' => 'Contact 1',
        'contact_number' => '1234',
        'tin' => '111-222',
    ]);

    $category = Category::create(['name' => 'Supplies', 'code' => 'SUPP', 'is_ppe' => false]);
    $unit = Unit::create(['name' => 'Box', 'abbreviation' => 'box']);
    $wh = Warehouse::create(['name' => 'WH 1', 'address' => 'WH Addr 1']);
    $location = Location::create(['warehouse_id' => $wh->id, 'code' => 'LOC-1']);

    $item = Item::create([
        'item_code' => 'ITEM-001',
        'stock_number' => 'SN-001',
        'name' => 'Test Item Name',
        'description' => 'Desc 1',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'unit_cost' => 0.00, // Starts at 0
        'reorder_level' => 5,
        'maximum_stock' => 50,
        'location_id' => $location->id,
        'status' => 'active',
    ]);

    // Submit receiving report
    $response = $this->actingAs($user)
        ->from(route('inventory.receiving.index'))
        ->post(route('inventory.receiving.store'), [
            'po_number' => 'PO-2026-99',
            'supplier_id' => $supplier->id,
            'po_date' => '2026-06-01',
            'iar_number' => 'IAR-202606-99',
            'invoice_number' => 'INV-2026-99',
            'delivery_receipt_number' => 'DR-2026-99',
            'received_date' => '2026-06-29',
            'received_by' => $employee->id,
            'inspected_by' => $employee->id,
            'remarks' => 'Everything accepted.',
            'items' => [
                [
                    'item_id' => $item->id,
                    'quantity_received' => 10,
                    'quantity_accepted' => 10,
                    'unit_cost' => 150.00,
                    'batch_number' => 'BATCH-A',
                    'expiration_date' => '2027-12-31',
                ],
            ],
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('inventory.receiving.index'));

    // Assert databases updated
    $this->assertDatabaseHas('purchase_orders', [
        'po_number' => 'PO-2026-99',
        'status' => 'received',
    ]);

    $this->assertDatabaseHas('receiving_reports', [
        'iar_number' => 'IAR-202606-99',
        'invoice_number' => 'INV-2026-99',
        'delivery_receipt_number' => 'DR-2026-99',
    ]);

    $this->assertDatabaseHas('receiving_report_items', [
        'item_id' => $item->id,
        'quantity_received' => 10,
        'quantity_accepted' => 10,
        'quantity_rejected' => 0,
        'unit_cost' => 150.00,
        'batch_number' => 'BATCH-A',
    ]);

    $this->assertDatabaseHas('stock_transactions', [
        'item_id' => $item->id,
        'transaction_type' => 'in',
        'quantity' => 10,
        'unit_cost' => 150.00,
    ]);

    // Check item values updated correctly
    $item->refresh();
    expect($item->current_stock)->toBe(10);
    expect((float) $item->unit_cost)->toBe(150.00);
});
