<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Office;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class OfficeController extends Controller
{
    /**
     * Store a newly created office.
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:offices,code'],
        ]);

        $office = Office::create($validated);

        AuditLogger::log('CREATE_OFFICE', $office, null, $office->toArray());

        return back();
    }

    /**
     * Update an office.
     */
    public function update(Request $request, Office $office): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:offices,code,'.$office->id],
        ]);

        $office->update($validated);

        AuditLogger::log('UPDATE_OFFICE', $office, null, $office->toArray());

        return back();
    }

    /**
     * Seed default offices.
     */
    public function seedDefaults(Request $request): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $defaults = [
            ['code' => 'MC', 'name' => 'Main Campus'],
            ['code' => 'NC', 'name' => 'North Campus'],
            ['code' => 'SC', 'name' => 'South Campus'],
        ];

        $seededCount = 0;
        $lastSeeded = null;
        foreach ($defaults as $data) {
            $office = Office::firstOrCreate(
                ['code' => $data['code']],
                ['name' => $data['name']]
            );
            if ($office->wasRecentlyCreated) {
                $seededCount++;
                $lastSeeded = $office;
            }
        }

        if ($seededCount > 0 && $lastSeeded) {
            AuditLogger::log('SEED_DEFAULT_OFFICES', $lastSeeded, null, ['count' => $seededCount]);
        }

        return back();
    }
}
