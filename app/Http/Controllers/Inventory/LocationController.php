<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Location;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class LocationController extends Controller
{
    /**
     * Store a newly created location.
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'code' => ['required', 'string', 'max:50', 'unique:locations,code'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $location = Location::create($validated);
        $location->load('warehouse');

        return back();
    }

    /**
     * Update a location.
     */
    public function update(Request $request, Location $location): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'code' => ['required', 'string', 'max:50', 'unique:locations,code,'.$location->id],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $location->update($validated);
        $location->load('warehouse');

        return back();
    }

    /**
     * Toggle the active status of a location.
     */
    public function toggleStatus(Location $location): RedirectResponse
    {
        Gate::authorize('inventory.create');

        // Check if there are any items using this location
        $hasItems = Item::where('location_id', $location->id)->exists();

        if ($location->is_active && $hasItems) {
            return back()->withErrors(['error' => 'Cannot deactivate a location that is currently used by items.']);
        }

        $location->is_active = ! $location->is_active;
        $location->save();

        return back();
    }
}
