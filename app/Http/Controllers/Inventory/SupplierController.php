<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SupplierController extends Controller
{
    /**
     * Store a newly created supplier in database.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('warehouse.receive');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'contact_person' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:255'],
            'tin' => ['required', 'string', 'max:255', 'unique:suppliers,tin'],
        ]);

        $supplier = Supplier::create($validated);

        AuditLogger::log('CREATE_SUPPLIER', $supplier, null, $supplier->toArray());

        return response()->json($supplier, 201);
    }
}
