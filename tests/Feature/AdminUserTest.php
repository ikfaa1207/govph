<?php

use App\Models\Department;
use App\Models\Office;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('unauthorized users cannot access admin users page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('inventory.admin.users.index'));

    $response->assertForbidden();
});

test('authorized users can access admin users page', function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'users.manage', 'module' => 'users']);
    $user->givePermissionTo('users.manage');

    $response = $this->actingAs($user)->get(route('inventory.admin.users.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('inventory/admin/users')
    );
});

test('authorized users can create a new user', function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'users.manage', 'module' => 'users']);
    $user->givePermissionTo('users.manage');

    $role = Role::create(['name' => 'Custom Role']);
    $office = Office::create(['name' => 'Test Office', 'code' => 'TO']);
    $department = Department::create(['name' => 'Test Dept', 'code' => 'TD', 'office_id' => $office->id]);

    $response = $this->actingAs($user)->post(route('inventory.admin.users.store'), [
        'name' => 'John Doe',
        'email' => 'john.doe@example.com',
        'password' => 'Password123!',
        'roles' => [$role->id],
        'office_id' => $office->id,
        'department_id' => $department->id,
        'position' => 'Staff',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'User account created successfully.');

    $this->assertDatabaseHas('users', [
        'email' => 'john.doe@example.com',
        'name' => 'John Doe',
    ]);

    $this->assertDatabaseHas('employees', [
        'name' => 'John Doe',
        'office_id' => $office->id,
        'department_id' => $department->id,
    ]);
});
