<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Office;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DepartmentController extends Controller
{
    /**
     * Store a newly created department.
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'office_id' => ['required', 'exists:offices,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:departments,code'],
        ]);

        $department = Department::create($validated);

        AuditLogger::log('CREATE_DEPARTMENT', $department, null, $department->toArray());

        return back();
    }

    /**
     * Update a department.
     */
    public function update(Request $request, Department $department): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'office_id' => ['required', 'exists:offices,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:departments,code,'.$department->id],
        ]);

        $department->update($validated);

        AuditLogger::log('UPDATE_DEPARTMENT', $department, null, $department->toArray());

        return back();
    }

    /**
     * Seed default departments.
     */
    public function seedDefaults(Request $request): RedirectResponse
    {
        Gate::authorize('inventory.create');

        // Ensure at least one office exists to link to
        $office = Office::firstOrCreate(
            ['code' => 'MC'],
            ['name' => 'Main Campus']
        );

        $defaults = [
            ['code' => 'HRMD', 'name' => 'Human Resource Management Office'],
            ['code' => 'ITD', 'name' => 'College of Computer Studies'],
            ['code' => 'FAD', 'name' => 'Finance & Accounting Office'],
            ['code' => 'GSD', 'name' => 'General Services Office'],
            ['code' => 'PMD', 'name' => 'Procurement & Supply Office'],
            ['code' => 'PRD', 'name' => 'Planning & Development Office'],
            ['code' => 'COE', 'name' => 'College of Engineering'],
            ['code' => 'COED', 'name' => 'College of Education'],
        ];

        $seededCount = 0;
        $lastSeeded = null;
        foreach ($defaults as $data) {
            $department = Department::firstOrCreate(
                ['code' => $data['code']],
                ['name' => $data['name'], 'office_id' => $office->id]
            );
            if ($department->wasRecentlyCreated) {
                $seededCount++;
                $lastSeeded = $department;
            }
        }

        if ($seededCount > 0 && $lastSeeded) {
            AuditLogger::log('SEED_DEFAULT_DEPARTMENTS', $lastSeeded, null, ['count' => $seededCount]);
        }

        return back();
    }
}
