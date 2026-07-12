<?php

use App\Enums\PhysicalCountStatus;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Office;
use App\Models\Permission;
use App\Models\PhysicalCount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthorized users cannot delete draft physical counts', function () {
    $user = User::factory()->create();
    $office = Office::create(['code' => 'O-1', 'name' => 'Office 1']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-1', 'name' => 'Dept 1']);
    $employee = Employee::create([
        'user_id' => $user->id,
        'employee_id' => 'EMP-001',
        'name' => 'Staff',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $creator = Employee::create([
        'employee_id' => 'EMP-002',
        'name' => 'Creator',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $count = PhysicalCount::create([
        'type' => 'RPCPPE',
        'as_of_date' => now()->toDateString(),
        'status' => PhysicalCountStatus::Draft,
        'created_by' => $creator->id,
    ]);

    $response = $this->actingAs($user)->delete(route('inventory.physical-counts.destroy', $count));

    $response->assertForbidden();
    $this->assertDatabaseHas('physical_counts', ['id' => $count->id]);
});

test('creator can delete draft physical count', function () {
    $user = User::factory()->create();
    $office = Office::create(['code' => 'O-1', 'name' => 'Office 1']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-1', 'name' => 'Dept 1']);
    $employee = Employee::create([
        'user_id' => $user->id,
        'employee_id' => 'EMP-001',
        'name' => 'Staff',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $count = PhysicalCount::create([
        'type' => 'RPCPPE',
        'as_of_date' => now()->toDateString(),
        'status' => PhysicalCountStatus::Draft,
        'created_by' => $employee->id,
    ]);

    $response = $this->actingAs($user)->delete(route('inventory.physical-counts.destroy', $count));

    $response->assertRedirect(route('inventory.physical-counts.index'));
    $this->assertDatabaseMissing('physical_counts', ['id' => $count->id]);
});

test('user with reports.view permission cannot delete draft physical count', function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'reports.view', 'module' => 'reports']);
    $user->givePermissionTo('reports.view');

    $office = Office::create(['code' => 'O-1', 'name' => 'Office 1']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-1', 'name' => 'Dept 1']);
    $employee = Employee::create([
        'user_id' => $user->id,
        'employee_id' => 'EMP-001',
        'name' => 'Staff',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $creator = Employee::create([
        'employee_id' => 'EMP-002',
        'name' => 'Creator',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $count = PhysicalCount::create([
        'type' => 'RPCPPE',
        'as_of_date' => now()->toDateString(),
        'status' => PhysicalCountStatus::Draft,
        'created_by' => $creator->id,
    ]);

    $response = $this->actingAs($user)->delete(route('inventory.physical-counts.destroy', $count));

    $response->assertForbidden();
    $this->assertDatabaseHas('physical_counts', ['id' => $count->id]);
});

test('cannot delete non-draft physical count', function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'reports.view', 'module' => 'reports']);
    $user->givePermissionTo('reports.view');

    $office = Office::create(['code' => 'O-1', 'name' => 'Office 1']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-1', 'name' => 'Dept 1']);
    $employee = Employee::create([
        'user_id' => $user->id,
        'employee_id' => 'EMP-001',
        'name' => 'Staff',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $count = PhysicalCount::create([
        'type' => 'RPCPPE',
        'as_of_date' => now()->toDateString(),
        'status' => PhysicalCountStatus::Finalized,
        'created_by' => $employee->id,
    ]);

    $response = $this->actingAs($user)->delete(route('inventory.physical-counts.destroy', $count));

    $response->assertRedirect();
    $response->assertSessionHasErrors(['error']);
    $this->assertDatabaseHas('physical_counts', ['id' => $count->id]);
});
