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
    $this->assertSoftDeleted('physical_counts', ['id' => $count->id]);
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

test('physical count creation requires COA representative or absent reason', function () {
    $user = User::factory()->create();
    Permission::firstOrCreate(['name' => 'reports.view', 'module' => 'reports']);
    $user->givePermissionTo('reports.view');

    $office = Office::create(['code' => 'O-1', 'name' => 'Office 1']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-1', 'name' => 'Dept 1']);

    $chairperson = Employee::create([
        'user_id' => $user->id,
        'employee_id' => 'EMP-001',
        'name' => 'Chairperson User',
        'position' => 'Chairperson',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $headOfAgency = Employee::create([
        'employee_id' => 'EMP-002',
        'name' => 'Head of Agency User',
        'position' => 'Head',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $member = Employee::create([
        'employee_id' => 'EMP-003',
        'name' => 'Member User',
        'position' => 'Member',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $response = $this->actingAs($user)->post(route('inventory.physical-counts.store'), [
        'type' => 'RPCPPE',
        'as_of_date' => now()->toDateString(),
        'chairperson_id' => $chairperson->id,
        'head_of_agency_id' => $headOfAgency->id,
        'member_ids' => [$member->id],
        'coa_representative_id' => '',
        'coa_representative_absent_reason' => '',
    ]);

    $response->assertSessionHasErrors(['coa_representative_absent_reason']);

    $response2 = $this->actingAs($user)->post(route('inventory.physical-counts.store'), [
        'type' => 'RPCPPE',
        'as_of_date' => now()->toDateString(),
        'chairperson_id' => $chairperson->id,
        'head_of_agency_id' => $headOfAgency->id,
        'member_ids' => [$member->id],
        'coa_representative_id' => '',
        'coa_representative_absent_reason' => 'Conflicting scheduling',
    ]);

    $response2->assertSessionHasNoErrors();
    $this->assertDatabaseHas('physical_counts', [
        'coa_representative_absent_reason' => 'Conflicting scheduling',
    ]);
});
