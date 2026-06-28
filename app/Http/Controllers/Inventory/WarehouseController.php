<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class WarehouseController extends Controller
{
    /**
     * Store a newly created warehouse.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:warehouses,name'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $warehouse = Warehouse::create($validated);

        return response()->json($warehouse);
    }
}
