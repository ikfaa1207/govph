<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class SupplierController extends Controller
{
    /**
     * Store a newly created supplier in database.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
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

        if ($request->wantsJson()) {
            return response()->json($supplier, 201);
        }

        return back();
    }

    /**
     * Update a supplier in database.
     */
    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        Gate::authorize('warehouse.receive');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'contact_person' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:255'],
            'tin' => ['required', 'string', 'max:255', 'unique:suppliers,tin,'.$supplier->id],
        ]);

        $supplier->update($validated);

        AuditLogger::log('UPDATE_SUPPLIER', $supplier, null, $supplier->toArray());

        return back();
    }

    /**
     * Toggle the active status of a supplier.
     */
    public function toggleStatus(Supplier $supplier): RedirectResponse
    {
        Gate::authorize('warehouse.receive');

        // Check if there are any purchase orders for this supplier
        $hasPOs = PurchaseOrder::where('supplier_id', $supplier->id)->exists();

        if ($supplier->is_active && $hasPOs) {
            return back()->withErrors(['error' => 'Cannot deactivate a supplier that has associated purchase orders.']);
        }

        $supplier->is_active = ! $supplier->is_active;
        $supplier->save();

        AuditLogger::log('TOGGLE_SUPPLIER_STATUS', $supplier, null, ['is_active' => $supplier->is_active]);

        return back();
    }
}
