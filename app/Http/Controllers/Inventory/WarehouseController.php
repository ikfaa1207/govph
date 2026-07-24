<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\Warehouse;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class WarehouseController extends Controller
{
    /**
     * Store a newly created warehouse.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:warehouses,name'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $warehouse = Warehouse::create($validated);

        AuditLogger::log('CREATE_WAREHOUSE', $warehouse, null, $warehouse->toArray());

        if ($request->wantsJson()) {
            return response()->json($warehouse, 201);
        }

        return back();
    }

    /**
     * Update a warehouse.
     */
    public function update(Request $request, Warehouse $warehouse): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:warehouses,name,'.$warehouse->id],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $warehouse->update($validated);

        AuditLogger::log('UPDATE_WAREHOUSE', $warehouse, null, $warehouse->toArray());

        return back();
    }

    /**
     * Toggle the active status of a warehouse.
     */
    public function toggleStatus(Warehouse $warehouse): RedirectResponse
    {
        Gate::authorize('inventory.create');

        // Check if there are any locations using this warehouse
        $hasLocations = Location::where('warehouse_id', $warehouse->id)->exists();

        if ($warehouse->is_active && $hasLocations) {
            return back()->withErrors(['error' => 'Cannot deactivate a warehouse that has locations assigned to it.']);
        }

        $warehouse->is_active = ! $warehouse->is_active;
        $warehouse->save();

        AuditLogger::log('TOGGLE_WAREHOUSE_STATUS', $warehouse, null, ['is_active' => $warehouse->is_active]);

        return back();
    }
}
