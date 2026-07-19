<?php

use App\Models\Department;
use App\Models\Employee;
use App\Models\Office;
use App\Models\Permission;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard and see scoped content', function () {
    Permission::firstOrCreate(['name' => 'dashboard.view', 'module' => 'dashboard']);
    Permission::firstOrCreate(['name' => 'warehouse.issue', 'module' => 'warehouse']);
    Permission::firstOrCreate(['name' => 'request.approve', 'module' => 'requisition']);

    // 1. Global / admin user with no employee record
    $globalUser = User::factory()->create();
    $globalUser->givePermissionTo('dashboard.view');

    $this->actingAs($globalUser);
    $response = $this->get(route('dashboard'));
    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/dashboard')
            ->where('userScope', 'global')
        );

    // 2. Department Head user
    $deptUser = User::factory()->create();
    $deptUser->givePermissionTo('dashboard.view');
    $deptUser->givePermissionTo('request.approve');

    $office = Office::create(['code' => 'TEST-OFFICE', 'name' => 'Test Office']);
    $department = Department::create(['code' => 'TEST-DEPT', 'name' => 'Test Department', 'office_id' => $office->id]);
    Employee::create([
        'user_id' => $deptUser->id,
        'employee_id' => 'EMP-TEST-01',
        'name' => 'Test Head',
        'position' => 'Head',
        'office_id' => $office->id,
        'department_id' => $department->id,
    ]);

    $this->actingAs($deptUser);
    $response = $this->get(route('dashboard'));
    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/dashboard')
            ->where('userScope', 'dept_head')
        );

    // 3. Regular employee (no approval permission)
    $empUser = User::factory()->create();
    $empUser->givePermissionTo('dashboard.view');

    Employee::create([
        'user_id' => $empUser->id,
        'employee_id' => 'EMP-TEST-02',
        'name' => 'Test Staff',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $department->id,
    ]);

    $this->actingAs($empUser);
    $response = $this->get(route('dashboard'));
    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/dashboard')
            ->where('userScope', 'employee')
            ->has('myProperties')
        );
});
