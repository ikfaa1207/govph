<?php

use App\Models\Category;
use App\Models\Location;
use App\Models\Permission;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->permCreate = Permission::create(['name' => 'inventory.create', 'module' => 'inventory']);

    // Authorized user (Supply Officer)
    $this->authorizedUser = User::factory()->supplyOfficer()->create([
        'name' => 'Supply Officer',
        'email' => 'supply@example.com',
        'password' => bcrypt('password'),
    ]);
    $this->authorizedUser->givePermissionTo($this->permCreate);

    // Unauthorized user (Regular employee)
    $this->unauthorizedUser = User::factory()->employee()->create([
        'name' => 'Employee Staff',
        'email' => 'staff@example.com',
        'password' => bcrypt('password'),
    ]);

    // Create a base warehouse for location testing
    $this->warehouse = Warehouse::create([
        'name' => 'Warehouse Alpha',
        'address' => 'Floor 1',
    ]);
});

test('authorized user can create category inline', function () {
    $this->actingAs($this->authorizedUser);

    $response = $this->postJson(route('inventory.categories.store'), [
        'name' => 'Writing Materials',
        'code' => 'WRIT-MAT',
        'is_ppe' => false,
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('categories', [
        'name' => 'Writing Materials',
        'code' => 'WRIT-MAT',
        'is_ppe' => 0,
    ]);
});

test('unauthorized user cannot create category inline', function () {
    $this->actingAs($this->unauthorizedUser);

    $response = $this->postJson(route('inventory.categories.store'), [
        'name' => 'Writing Materials',
        'code' => 'WRIT-MAT',
        'is_ppe' => false,
    ]);

    $response->assertForbidden();
    $this->assertDatabaseMissing('categories', ['code' => 'WRIT-MAT']);
});

test('category validation enforces uniqueness and required fields', function () {
    // Seed an existing category
    Category::create(['name' => 'Existing', 'code' => 'EXIST', 'is_ppe' => false]);

    $this->actingAs($this->authorizedUser);

    // Try creating duplicate name/code
    $response = $this->postJson(route('inventory.categories.store'), [
        'name' => 'Existing',
        'code' => 'EXIST',
        'is_ppe' => false,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['name', 'code']);
});

test('authorized user can create location inline', function () {
    $this->actingAs($this->authorizedUser);

    $response = $this->postJson(route('inventory.locations.store'), [
        'warehouse_id' => $this->warehouse->id,
        'code' => 'SHELF-X-99',
        'description' => 'Temporary loading bay',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('locations', [
        'warehouse_id' => $this->warehouse->id,
        'code' => 'SHELF-X-99',
    ]);
});

test('unauthorized user cannot create location inline', function () {
    $this->actingAs($this->unauthorizedUser);

    $response = $this->postJson(route('inventory.locations.store'), [
        'warehouse_id' => $this->warehouse->id,
        'code' => 'SHELF-X-99',
        'description' => 'Temporary loading bay',
    ]);

    $response->assertForbidden();
    $this->assertDatabaseMissing('locations', ['code' => 'SHELF-X-99']);
});

test('location validation enforces uniqueness and required warehouse', function () {
    // Seed an existing location
    Location::create([
        'warehouse_id' => $this->warehouse->id,
        'code' => 'SHELF-EXIST',
        'description' => 'Existing shelf',
    ]);

    $this->actingAs($this->authorizedUser);

    // Try duplicate code and missing warehouse
    $response = $this->postJson(route('inventory.locations.store'), [
        'warehouse_id' => 9999, // Non-existent warehouse
        'code' => 'SHELF-EXIST',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['warehouse_id', 'code']);
});

test('authorized user can create warehouse inline', function () {
    $this->actingAs($this->authorizedUser);

    $response = $this->postJson(route('inventory.warehouses.store'), [
        'name' => 'Warehouse Beta',
        'address' => 'Floor 2',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('warehouses', [
        'name' => 'Warehouse Beta',
        'address' => 'Floor 2',
    ]);
});

test('unauthorized user cannot create warehouse inline', function () {
    $this->actingAs($this->unauthorizedUser);

    $response = $this->postJson(route('inventory.warehouses.store'), [
        'name' => 'Warehouse Beta',
        'address' => 'Floor 2',
    ]);

    $response->assertForbidden();
    $this->assertDatabaseMissing('warehouses', ['name' => 'Warehouse Beta']);
});

test('warehouse validation enforces uniqueness and required name', function () {
    // Seed an existing warehouse
    Warehouse::create(['name' => 'Existing WH', 'address' => 'Floor 1']);

    $this->actingAs($this->authorizedUser);

    $response = $this->postJson(route('inventory.warehouses.store'), [
        'name' => 'Existing WH',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['name']);
});

test('authorized user can seed default categories', function () {
    $this->actingAs($this->authorizedUser);

    $response = $this->post(route('inventory.categories.seed-defaults'));
    $response->assertRedirect();

    $this->assertDatabaseHas('categories', [
        'code' => 'OFF-SUPP',
        'is_ppe' => false,
    ]);
    $this->assertDatabaseHas('categories', [
        'code' => 'IT-EQPT',
        'is_ppe' => true,
    ]);
});

test('authorized user can seed default units', function () {
    $this->actingAs($this->authorizedUser);

    $response = $this->post(route('inventory.units.seed-defaults'));
    $response->assertRedirect();

    $this->assertDatabaseHas('units', [
        'abbreviation' => 'pc',
    ]);
    $this->assertDatabaseHas('units', [
        'abbreviation' => 'ream',
    ]);
});
