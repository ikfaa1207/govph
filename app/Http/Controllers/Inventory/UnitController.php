<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class UnitController extends Controller
{
    /**
     * Store a newly created unit of measurement.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:units,name'],
            'abbreviation' => ['required', 'string', 'max:50', 'unique:units,abbreviation'],
        ]);

        $unit = Unit::create($validated);

        return response()->json($unit);
    }
}
