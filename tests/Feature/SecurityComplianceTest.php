<?php

use App\Models\Category;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Office;
use App\Models\Property;
use App\Models\PropertyAssignment;
use App\Models\PropertyTransfer;
use App\Models\User;
use Illuminate\Support\Facades\DB;

it('encrypts sensitive employee data at rest for DPA compliance', function () {
    $office = Office::firstOrCreate(['code' => 'TEST'], ['name' => 'Test']);
    $dept = Department::firstOrCreate(['code' => 'TESTD'], ['name' => 'TestD', 'office_id' => $office->id]);

    $employee = Employee::create([
        'employee_id' => 'EMP-DPA-001',
        'name' => 'John Doe',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
        'address' => '123 Secret St.',
        'contact_number' => '09123456789',
        'date_of_birth' => '1990-01-01',
        'tin' => '123-456-789',
    ]);

    // Read directly from DB to verify encryption
    $rawRecord = DB::table('employees')->where('id', $employee->id)->first();

    expect($rawRecord->address)->not->toBe('123 Secret St.')
        ->and($rawRecord->contact_number)->not->toBe('09123456789')
        ->and($rawRecord->tin)->not->toBe('123-456-789');

    // Eloquent should auto-decrypt
    $loadedEmployee = Employee::find($employee->id);
    expect($loadedEmployee->address)->toBe('123 Secret St.')
        ->and($loadedEmployee->contact_number)->toBe('09123456789')
        ->and($loadedEmployee->tin)->toBe('123-456-789');
});

it('generates digital signatures for property assignments upon acknowledgment', function () {
    $user = User::factory()->create();
    $office = Office::firstOrCreate(['code' => 'TEST'], ['name' => 'Test']);
    $dept = Department::firstOrCreate(['code' => 'TESTD'], ['name' => 'TestD', 'office_id' => $office->id]);
    $employee = Employee::create([
        'user_id' => $user->id,
        'employee_id' => 'EMP-SIG-001',
        'name' => 'John Doe',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $category = Category::firstOrCreate(['code' => 'CATTEST'], ['name' => 'Category']);
    $property = Property::factory()->create(['category_id' => $category->id]);

    $assignment = PropertyAssignment::factory()->create([
        'property_id' => $property->id,
        'assigned_to' => $employee->id,
        'assigned_by' => $employee->id,
    ]);

    $response = $this->actingAs($user)->post(route('inventory.property-assignments.acknowledge', $assignment));
    $response->assertRedirect()->assertSessionHas('success');

    $assignment->refresh();
    expect($assignment->acknowledged_at)->not->toBeNull()
        ->and($assignment->digital_signature)->not->toBeNull()
        ->and(strlen($assignment->digital_signature))->toBeGreaterThan(10);
});

it('generates digital signatures for property transfers upon acknowledgment', function () {
    $user = User::factory()->create();
    $office = Office::firstOrCreate(['code' => 'TEST'], ['name' => 'Test']);
    $dept = Department::firstOrCreate(['code' => 'TESTD'], ['name' => 'TestD', 'office_id' => $office->id]);
    $employee = Employee::create([
        'user_id' => $user->id,
        'employee_id' => 'EMP-SIG-002',
        'name' => 'Jane Doe',
        'position' => 'Staff',
        'office_id' => $office->id,
        'department_id' => $dept->id,
    ]);

    $category = Category::firstOrCreate(['code' => 'CATTEST'], ['name' => 'Category']);
    $property = Property::factory()->create(['category_id' => $category->id]);

    $transfer = PropertyTransfer::create([
        'property_id' => $property->id,
        'from_employee_id' => $employee->id,
        'to_employee_id' => $employee->id,
        'office_id' => $office->id,
        'ptr_number' => 'PTR-1234',
        'transfer_date' => now(),
        'reason' => 'Testing',
        'status' => 'pending',
        'approved_by' => $employee->id,
    ]);

    $response = $this->actingAs($user)->post(route('inventory.property-transfers.acknowledge', $transfer));
    $response->assertRedirect()->assertSessionHas('success');

    $transfer->refresh();
    expect($transfer->acknowledged_at)->not->toBeNull()
        ->and($transfer->digital_signature)->not->toBeNull()
        ->and(strlen($transfer->digital_signature))->toBeGreaterThan(10);
});
