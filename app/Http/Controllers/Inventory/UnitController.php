<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Unit;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class UnitController extends Controller
{
    /**
     * Store a newly created unit of measurement.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:units,name'],
            'abbreviation' => ['required', 'string', 'max:50', 'unique:units,abbreviation'],
        ]);

        $unit = Unit::create($validated);

        AuditLogger::log('CREATE_UNIT', $unit, null, $unit->toArray());

        if ($request->wantsJson()) {
            return response()->json($unit, 201);
        }

        return back();
    }

    /**
     * Update a unit.
     */
    public function update(Request $request, Unit $unit): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:units,name,'.$unit->id],
            'abbreviation' => ['required', 'string', 'max:50', 'unique:units,abbreviation,'.$unit->id],
        ]);

        $unit->update($validated);

        AuditLogger::log('UPDATE_UNIT', $unit, null, $unit->toArray());

        return back();
    }

    /**
     * Toggle the active status of a unit.
     */
    public function toggleStatus(Unit $unit): RedirectResponse
    {
        Gate::authorize('inventory.create');

        // Check if there are any items using this unit
        $hasItems = Item::where('unit_id', $unit->id)->exists();

        if ($unit->is_active && $hasItems) {
            return back()->withErrors(['error' => 'Cannot deactivate a unit that is currently used by items.']);
        }

        $unit->is_active = ! $unit->is_active;
        $unit->save();

        AuditLogger::log('TOGGLE_UNIT_STATUS', $unit, null, ['is_active' => $unit->is_active]);

        return back();
    }

    /**
     * Seed default COA units of measurement.
     */
    public function seedDefaults(Request $request): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $defaults = [
            ['name' => 'piece', 'abbreviation' => 'pc'],
            ['name' => 'box', 'abbreviation' => 'box'],
            ['name' => 'pack', 'abbreviation' => 'pack'],
            ['name' => 'roll', 'abbreviation' => 'roll'],
            ['name' => 'bottle', 'abbreviation' => 'bot'],
            ['name' => 'unit', 'abbreviation' => 'unit'],
            ['name' => 'set', 'abbreviation' => 'set'],
            ['name' => 'ream', 'abbreviation' => 'ream'],
            ['name' => 'liter', 'abbreviation' => 'ltr'],
            ['name' => 'kilogram', 'abbreviation' => 'kg'],
        ];

        $seededCount = 0;
        $lastSeeded = null;
        foreach ($defaults as $data) {
            $unit = Unit::firstOrCreate(
                ['abbreviation' => $data['abbreviation']],
                ['name' => $data['name'], 'is_active' => true]
            );
            if ($unit->wasRecentlyCreated) {
                $seededCount++;
                $lastSeeded = $unit;
            }
        }

        if ($seededCount > 0 && $lastSeeded) {
            AuditLogger::log('SEED_DEFAULT_UNITS', $lastSeeded, null, ['count' => $seededCount]);
        }

        return back();
    }
}
