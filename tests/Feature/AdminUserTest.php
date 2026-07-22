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

test('authorized users can create a new user with any temporary password', function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'users.manage', 'module' => 'users']);
    $user->givePermissionTo('users.manage');

    $role = Role::create(['name' => 'Custom Role']);
    $office = Office::create(['name' => 'Test Office', 'code' => 'TO']);
    $department = Department::create(['name' => 'Test Dept', 'code' => 'TD', 'office_id' => $office->id]);

    // Send a very short/simple password (e.g. '123')
    $response = $this->actingAs($user)->post(route('inventory.admin.users.store'), [
        'name' => 'John Doe 2',
        'email' => 'john.doe2@example.com',
        'password' => '123',
        'roles' => [$role->id],
        'office_id' => $office->id,
        'department_id' => $department->id,
        'position' => 'Staff',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'User account created successfully.');

    $createdUser = User::where('email', 'john.doe2@example.com')->first();
    expect($createdUser)->not->toBeNull();
    expect(Hash::check('123', $createdUser->password))->toBeTrue();
    expect($createdUser->password_change_required)->toBeTrue();
});

test('authorized users can reset a user password to any temporary password', function () {
    $admin = User::factory()->create();
    Permission::firstOrCreate(['name' => 'users.manage', 'module' => 'users']);
    $admin->givePermissionTo('users.manage');

    $user = User::factory()->create();

    // Reset password to a short/simple password (e.g. 'abc')
    $response = $this->actingAs($admin)->post(route('inventory.admin.users.reset-password', $user), [
        'password' => 'abc',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success', 'User password reset successfully.');

    $user->refresh();
    expect(Hash::check('abc', $user->password))->toBeTrue();
    expect($user->password_change_required)->toBeTrue();
});
