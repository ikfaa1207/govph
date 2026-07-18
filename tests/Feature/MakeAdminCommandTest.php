<?php

use App\Models\Department;
use App\Models\Office;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Setup standard role
    $this->role = Role::create([
        'name' => 'System Administrator',
        'description' => 'Manages system structure and user rights.',
    ]);

    // Setup standard Office and Department
    $this->office = Office::create(['code' => 'CO', 'name' => 'Central Office']);
    $this->department = Department::create([
        'office_id' => $this->office->id,
        'code' => 'ITD',
        'name' => 'Information Technology Division',
    ]);
});

test('it can create a super administrator interactively', function () {
    $this->artisan('make:admin')
        ->expectsQuestion('Enter admin name', 'Super Admin')
        ->expectsQuestion('Enter admin email', 'superadmin@example.com')
        ->expectsQuestion('Enter admin password', 'password123')
        ->assertExitCode(0);

    $this->assertDatabaseHas('users', [
        'name' => 'Super Admin',
        'email' => 'superadmin@example.com',
    ]);

    $user = User::where('email', 'superadmin@example.com')->firstOrFail();
    $this->assertTrue($user->hasRole('System Administrator'));

    $this->assertDatabaseHas('employees', [
        'user_id' => $user->id,
        'name' => 'Super Admin',
        'position' => 'Super Administrator',
        'office_id' => $this->office->id,
        'department_id' => $this->department->id,
    ]);
});

test('it validates unique email during creation', function () {
    User::factory()->create(['email' => 'existing@example.com']);

    $this->artisan('make:admin')
        ->expectsQuestion('Enter admin name', 'Admin User')
        ->expectsQuestion('Enter admin email', 'existing@example.com')
        ->expectsQuestion('Enter admin email', 'newadmin@example.com')
        ->expectsQuestion('Enter admin password', 'password123')
        ->assertExitCode(0);

    $this->assertDatabaseHas('users', [
        'email' => 'newadmin@example.com',
    ]);
});

test('it validates password length during creation', function () {
    $this->artisan('make:admin')
        ->expectsQuestion('Enter admin name', 'Admin User')
        ->expectsQuestion('Enter admin email', 'admin@example.com')
        ->expectsQuestion('Enter admin password', 'short')
        ->expectsQuestion('Enter admin password', 'password123')
        ->assertExitCode(0);

    $this->assertDatabaseHas('users', [
        'email' => 'admin@example.com',
    ]);
});
