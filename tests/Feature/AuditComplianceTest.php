<?php

use App\Models\Category;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Office;
use App\Models\PhysicalCount;
use App\Models\Property;
use App\Models\PropertyAssignment;
use App\Models\User;

it('generates the rpcppe report', function () {
    $user = User::factory()->create();
    $office = Office::create(['code' => 'O-1', 'name' => 'Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-1', 'name' => 'Dept']);
    $employee = Employee::create([
        'employee_id' => 'EMP-1',
        'name' => 'Test',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $physicalCount = PhysicalCount::factory()->create(['created_by' => $employee->id]);

    $response = $this->actingAs($user)->getJson(route('physical-counts.rpcppe', $physicalCount));

    $response->assertStatus(200)
        ->assertJsonStructure([
            'message',
            'data' => [
                'report_title',
                'as_of_date',
                'type',
                'status',
                'prepared_by',
                'coa_representative',
                'items',
                'committees',
            ],
        ]);
});

it('soft deletes a property instead of permanent deletion', function () {
    $category = Category::firstOrCreate(['code' => 'CAT1'], ['name' => 'Category 1']);
    $property = Property::factory()->create(['category_id' => $category->id]);

    $property->delete();

    $this->assertSoftDeleted($property);
    $this->assertDatabaseHas('properties', [
        'id' => $property->id,
    ]);
});

it('can store digital signatures on property assignments', function () {
    $office = Office::create(['code' => 'O-1', 'name' => 'Office']);
    $dept = Department::create(['office_id' => $office->id, 'code' => 'D-1', 'name' => 'Dept']);
    $employee = Employee::create([
        'employee_id' => 'EMP-1',
        'name' => 'Test',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $category = Category::firstOrCreate(['code' => 'CAT1'], ['name' => 'Category 1']);
    $assignment = PropertyAssignment::factory()->create([
        'property_id' => Property::factory()->create(['category_id' => $category->id])->id,
        'assigned_to' => $employee->id,
        'assigned_by' => $employee->id,
    ]);

    $assignment->update([
        'digital_signature' => 'signature_hash_123',
        'acknowledged_at' => now(),
    ]);

    expect($assignment->fresh()->digital_signature)->toBe('signature_hash_123');
    expect($assignment->fresh()->acknowledged_at)->not->toBeNull();
});
