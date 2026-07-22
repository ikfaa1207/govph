<?php

use App\Models\Department;
use App\Models\Office;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthorized users cannot store, update, or seed departments', function () {
    $user = User::factory()->create();

    $responseStore = $this->actingAs($user)->post(route('inventory.master-data.departments.store'), [
        'office_id' => 1,
        'code' => 'DEPT-1',
        'name' => 'Department One',
    ]);
    $responseStore->assertForbidden();

    $responseSeed = $this->actingAs($user)->post(route('inventory.master-data.departments.seed-defaults'));
    $responseSeed->assertForbidden();
});

test('authorized users can store a department', function () {
    $user = User::factory()->supplyOfficer()->create();
    Permission::firstOrCreate(['name' => 'inventory.create', 'module' => 'inventory']);
    $user->givePermissionTo('inventory.create');
    $user->refresh();

    $office = Office::create([
        'code' => 'MC',
        'name' => 'Main Campus',
    ]);

    $response = $this->actingAs($user)->post(route('inventory.master-data.departments.store'), [
        'office_id' => $office->id,
        'code' => 'DEPT-1',
        'name' => 'Department One',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('departments', [
        'code' => 'DEPT-1',
        'name' => 'Department One',
        'office_id' => $office->id,
    ]);
});

test('authorized users can update a department', function () {
    $user = User::factory()->supplyOfficer()->create();
    Permission::firstOrCreate(['name' => 'inventory.create', 'module' => 'inventory']);
    $user->givePermissionTo('inventory.create');

    $office = Office::create([
        'code' => 'MC',
        'name' => 'Main Campus',
    ]);

    $department = Department::create([
        'office_id' => $office->id,
        'code' => 'DEPT-OLD',
        'name' => 'Old Department Name',
    ]);

    $response = $this->actingAs($user)->put(route('inventory.master-data.departments.update', $department), [
        'office_id' => $office->id,
        'code' => 'DEPT-NEW',
        'name' => 'New Department Name',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('departments', [
        'id' => $department->id,
        'code' => 'DEPT-NEW',
        'name' => 'New Department Name',
    ]);
});

test('authorized users can seed default departments', function () {
    $user = User::factory()->supplyOfficer()->create();
    Permission::firstOrCreate(['name' => 'inventory.create', 'module' => 'inventory']);
    $user->givePermissionTo('inventory.create');

    $response = $this->actingAs($user)->post(route('inventory.master-data.departments.seed-defaults'));

    $response->assertRedirect();
    $this->assertDatabaseHas('departments', [
        'code' => 'HRMD',
        'name' => 'Human Resource Management Office',
    ]);
    $this->assertDatabaseHas('departments', [
        'code' => 'ITD',
        'name' => 'College of Computer Studies',
    ]);
});
