<?php

use App\Models\Office;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthorized users cannot store, update, or seed offices', function () {
    $user = User::factory()->create();

    $responseStore = $this->actingAs($user)->post(route('inventory.master-data.offices.store'), [
        'code' => 'OFF-1',
        'name' => 'Office One',
    ]);
    $responseStore->assertForbidden();

    $responseSeed = $this->actingAs($user)->post(route('inventory.master-data.offices.seed-defaults'));
    $responseSeed->assertForbidden();
});

test('authorized users can store an office', function () {
    $user = User::factory()->supplyOfficer()->create();
    Permission::firstOrCreate(['name' => 'inventory.create', 'module' => 'inventory']);
    $user->givePermissionTo('inventory.create');
    $user->refresh();

    $response = $this->actingAs($user)->post(route('inventory.master-data.offices.store'), [
        'code' => 'OFF-1',
        'name' => 'Office One',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('offices', [
        'code' => 'OFF-1',
        'name' => 'Office One',
    ]);
});

test('authorized users can update an office', function () {
    $user = User::factory()->supplyOfficer()->create();
    Permission::firstOrCreate(['name' => 'inventory.create', 'module' => 'inventory']);
    $user->givePermissionTo('inventory.create');
    $user->refresh();

    $office = Office::create([
        'code' => 'OFF-OLD',
        'name' => 'Old Office Name',
    ]);

    $response = $this->actingAs($user)->put(route('inventory.master-data.offices.update', $office), [
        'code' => 'OFF-NEW',
        'name' => 'New Office Name',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('offices', [
        'id' => $office->id,
        'code' => 'OFF-NEW',
        'name' => 'New Office Name',
    ]);
});

test('authorized users can seed default offices', function () {
    $user = User::factory()->supplyOfficer()->create();
    Permission::firstOrCreate(['name' => 'inventory.create', 'module' => 'inventory']);
    $user->givePermissionTo('inventory.create');
    $user->refresh();

    $response = $this->actingAs($user)->post(route('inventory.master-data.offices.seed-defaults'));

    $response->assertRedirect();
    $this->assertDatabaseHas('offices', [
        'code' => 'MC',
        'name' => 'Main Campus',
    ]);
    $this->assertDatabaseHas('offices', [
        'code' => 'NC',
        'name' => 'North Campus',
    ]);
});
