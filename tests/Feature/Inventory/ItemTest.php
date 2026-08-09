<?php

use App\Models\Category;
use App\Models\Item;
use App\Models\Location;
use App\Models\Permission;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::firstOrCreate([
        'name' => 'inventory.view',
        'module' => 'inventory',
        'description' => 'View inventory items',
    ]);

    Permission::firstOrCreate([
        'name' => 'inventory.create',
        'module' => 'inventory',
        'description' => 'Create inventory items',
    ]);

    Permission::firstOrCreate([
        'name' => 'inventory.update',
        'module' => 'inventory',
        'description' => 'Update inventory items',
    ]);
});

test('item listing includes location_id and location details in inertia props', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('inventory.view');

    $category = Category::create(['name' => 'Office Supplies', 'code' => 'OFF-SUPP', 'is_ppe' => false]);
    $unit = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
    $warehouse = Warehouse::create(['name' => 'Main Warehouse', 'address' => 'Building A']);
    $location = Location::create(['warehouse_id' => $warehouse->id, 'code' => 'SHELF-A1', 'description' => 'Shelf A1']);

    $item = Item::create([
        'name' => 'Paper Clip Standard',
        'item_code' => 'OS-01-2026-0001',
        'stock_number' => '7510-00-111-2222',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'location_id' => $location->id,
        'unit_cost' => 15.50,
        'reorder_level' => 10,
        'maximum_stock' => 100,
        'status' => 'active',
        'fund_cluster' => '01',
    ]);

    $response = $this->actingAs($user)
        ->get(route('inventory.items.index'));

    $response->assertStatus(200);

    $itemsData = $response->viewData('page')['props']['items']['data'];
    expect($itemsData)->not->toBeEmpty();
    expect($itemsData[0]['id'])->toBe($item->id);
    expect($itemsData[0]['location_id'])->toBe($location->id);
    expect($itemsData[0]['location'])->toBe('Main Warehouse - SHELF-A1');
});

test('updating an item preserves and updates location_id', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('inventory.view');
    $user->givePermissionTo('inventory.update');

    $category = Category::create(['name' => 'Office Supplies', 'code' => 'OFF-SUPP', 'is_ppe' => false]);
    $unit = Unit::create(['name' => 'Piece', 'abbreviation' => 'pc']);
    $warehouse = Warehouse::create(['name' => 'Main Warehouse', 'address' => 'Building A']);
    $location1 = Location::create(['warehouse_id' => $warehouse->id, 'code' => 'SHELF-A1', 'description' => 'Shelf A1']);
    $location2 = Location::create(['warehouse_id' => $warehouse->id, 'code' => 'SHELF-B2', 'description' => 'Shelf B2']);

    $item = Item::create([
        'name' => 'Ballpen Blue',
        'item_code' => 'OS-01-2026-0002',
        'stock_number' => '7510-00-333-4444',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
        'location_id' => $location1->id,
        'unit_cost' => 20.00,
        'reorder_level' => 5,
        'maximum_stock' => 50,
        'status' => 'active',
        'fund_cluster' => '01',
    ]);

    $response = $this->actingAs($user)
        ->put(route('inventory.items.update', $item->id), [
            'name' => 'Ballpen Blue Updated',
            'description' => 'Updated description',
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'reorder_level' => 15,
            'maximum_stock' => 100,
            'location_id' => $location2->id,
            'stock_number' => '7510-00-333-4444',
            'fund_cluster' => '01',
        ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('items', [
        'id' => $item->id,
        'name' => 'Ballpen Blue Updated',
        'location_id' => $location2->id,
    ]);
});
