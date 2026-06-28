<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class LocationController extends Controller
{
    /**
     * Store a newly created location.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'code' => ['required', 'string', 'max:50', 'unique:locations,code'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $location = Location::create($validated);
        $location->load('warehouse');

        return response()->json($location);
    }
}
