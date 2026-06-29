<?php

use App\Models\Permission;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Permission::firstOrCreate([
        'name' => 'warehouse.receive',
        'module' => 'warehouse',
        'description' => 'Receive items',
    ]);
});

test('unauthorized users cannot create a supplier', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson(route('inventory.suppliers.store'), [
            'name' => 'New Supplier Inc.',
            'tin' => '123-456-789-000',
            'contact_person' => 'Juan Dela Cruz',
            'address' => 'Manila, Philippines',
        ]);

    $response->assertForbidden();
});

test('authorized users can create a supplier', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('warehouse.receive');

    $response = $this->actingAs($user)
        ->postJson(route('inventory.suppliers.store'), [
            'name' => 'New Supplier Inc.',
            'tin' => '123-456-789-000',
            'contact_person' => 'Juan Dela Cruz',
            'contact_number' => '09171234567',
            'address' => 'Manila, Philippines',
        ]);

    $response->assertStatus(201);
    $response->assertJsonFragment([
        'name' => 'New Supplier Inc.',
        'tin' => '123-456-789-000',
    ]);

    $this->assertDatabaseHas('suppliers', [
        'name' => 'New Supplier Inc.',
        'tin' => '123-456-789-000',
    ]);
});

test('supplier creation requires name, tin, address, and contact person', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('warehouse.receive');

    $response = $this->actingAs($user)
        ->postJson(route('inventory.suppliers.store'), []);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['name', 'tin', 'address', 'contact_person']);
});

test('supplier tin must be unique', function () {
    Supplier::create([
        'name' => 'Existing Supplier',
        'tin' => '999-999-999-000',
        'contact_person' => 'Pedro',
        'address' => 'Quezon City',
    ]);

    $user = User::factory()->create();
    $user->givePermissionTo('warehouse.receive');

    $response = $this->actingAs($user)
        ->postJson(route('inventory.suppliers.store'), [
            'name' => 'New Duplicate TIN Supplier',
            'tin' => '999-999-999-000',
            'contact_person' => 'Juan',
            'address' => 'Manila',
        ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['tin']);
});
