<?php

use App\Models\Category;
use App\Models\Item;
use App\Models\Location;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Services\Valuation\ValuationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('calculates moving average and creates stock transactions', function () {
    // Create required lookups
    $warehouse = Warehouse::create(['name' => 'Main Warehouse']);
    $supplier = App\Models\Supplier::create([
        'name' => 'Test Supplier',
        'address' => '123 Test Ave',
        'contact_person' => 'Tester',
        'contact_number' => '09171234567',
        'tin' => '999-999-999-000',
    ]);

    $category = Category::create(['name' => 'Test Cat', 'code' => 'TEST', 'is_ppe' => false]);
    $unit = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
    $location = Location::create(['warehouse_id' => $warehouse->id, 'code' => 'TST-01', 'description' => 'Test']);

    $item = Item::create([
        'item_code' => 'TEST-ITEM-001',
        'stock_number' => 'T-0001',
        'name' => 'Test Item',
        'description' => 'Item for valuation tests',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'unit_cost' => 0.00,
        'reorder_level' => 0,
        'maximum_stock' => 1000,
        'location_id' => $location->id,
        'status' => 'active',
    ]);

    $service = new ValuationService;

    $service->recordStockIn($item, 60, 220.00, Supplier::class, $supplier->id, 'Initial batch');
    $item->refresh();
    expect((float) $item->unit_cost)->toBe(220.00);

    $service->recordStockIn($item, 40, 240.00, Supplier::class, $supplier->id, 'Second batch');
    $item->refresh();
    // (60*220 + 40*240)/100 = 228.00
    expect((float) $item->unit_cost)->toBe(228.00);

    $this->assertDatabaseCount('stock_transactions', 2);
});
