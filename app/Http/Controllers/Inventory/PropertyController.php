<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Disposal;
use App\Models\Employee;
use App\Models\Office;
use App\Models\Property;
use App\Models\PropertyAssignment;
use App\Models\PropertyTransfer;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PropertyController extends Controller
{
    /**
     * Display a listing of properties and lookup tables.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('property.view');

        $query = Property::with(['category', 'activeAssignment.assignee']);

        // Filter by condition/status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('property_number', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        $properties = $query->orderBy('id', 'desc')->get();
        $employees = Employee::orderBy('name')->get();
        $categories = Category::all();
        $offices = Office::all();

        return Inertia::render('inventory/property/index', [
            'properties' => $properties,
            'employees' => $employees,
            'categories' => $categories,
            'offices' => $offices,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Register a new PPE/property.
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('property.assign');

        $validated = $request->validate([
            'model' => ['required', 'string', 'max:255'],
            'brand' => ['required', 'string', 'max:255'],
            'serial_number' => ['required', 'string', 'unique:properties,serial_number'],
            'unit_cost' => ['required', 'numeric', 'min:0'],
            'date_acquired' => ['required', 'date'],
            'category_id' => ['required', 'exists:categories,id'],
            'warranty_expiration' => ['nullable', 'date'],
        ]);

        // Auto generate property number
        $validated['property_number'] = 'PPE-' . date('Y') . '-' . strtoupper(uniqid());
        $validated['condition'] = 'new';
        $validated['status'] = 'available';

        $property = Property::create($validated);

        AuditLogger::log('CREATE_PROPERTY', $property, null, $property->toArray());

        return redirect()->back()->with('success', 'Property registered successfully.');
    }

    /**
     * Assign equipment to an employee, automatically generating ICS or PAR.
     */
    public function assign(Request $request, Property $property): RedirectResponse
    {
        Gate::authorize('property.assign');

        $user = Auth::user();
        $custodian = Employee::where('user_id', $user->id)->first();

        if (!$custodian) {
            return redirect()->back()->withErrors(['error' => 'Property Custodian employee profile not found.']);
        }

        $request->validate([
            'is_non_system' => ['nullable', 'boolean'],
            'assigned_to' => ['required_unless:is_non_system,true', 'nullable', 'exists:employees,id'],
            'non_system_name' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'non_system_department' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request, $property, $custodian) {
            // Capitalization threshold routing (PHP 50,000)
            $threshold = 50000.00;
            $isPpe = (float) $property->unit_cost >= $threshold;
            
            $docType = $isPpe ? 'PAR' : 'ICS';
            $docNo = $docType . '-' . date('Y') . '-' . strtoupper(uniqid());

            $isNonSystem = $request->boolean('is_non_system');

            // Create assignment
            PropertyAssignment::create([
                'property_id' => $property->id,
                'assigned_to' => $isNonSystem ? null : $request->input('assigned_to'),
                'non_system_name' => $isNonSystem ? $request->input('non_system_name') : null,
                'non_system_department' => $isNonSystem ? $request->input('non_system_department') : null,
                'document_type' => $docType,
                'document_number' => $docNo,
                'assigned_by' => $custodian->id,
                'date_assigned' => now()->toDateString(),
                'remarks' => $request->input('remarks'),
            ]);

            // Update property status
            $property->status = 'assigned';
            $property->save();

            AuditLogger::log('ASSIGN_PROPERTY', $property, null, [
                'assigned_to' => $isNonSystem ? null : $request->input('assigned_to'),
                'non_system_name' => $isNonSystem ? $request->input('non_system_name') : null,
                'non_system_department' => $isNonSystem ? $request->input('non_system_department') : null,
                'document_type' => $docType,
                'document_number' => $docNo,
            ]);
        });

        return redirect()->back()->with('success', 'Property assigned successfully.');
    }

    /**
     * Transfer property (PTR) to another employee.
     */
    public function transfer(Request $request, Property $property): RedirectResponse
    {
        Gate::authorize('property.transfer');

        $user = Auth::user();
        $custodian = Employee::where('user_id', $user->id)->first();

        if (!$custodian) {
            return redirect()->back()->withErrors(['error' => 'Property Custodian employee profile not found.']);
        }

        $request->validate([
            'to_employee_id' => ['required', 'exists:employees,id'],
            'office_id' => ['required', 'exists:offices,id'],
            'reason' => ['required', 'string'],
        ]);

        $activeAssignment = $property->activeAssignment;
        if (!$activeAssignment) {
            return redirect()->back()->withErrors(['error' => 'Property has no active custodian to transfer from.']);
        }

        DB::transaction(function () use ($request, $property, $activeAssignment, $custodian) {
            // Close active assignment
            $activeAssignment->returned_date = now()->toDateString();
            $activeAssignment->remarks = 'Transferred to other personnel.';
            $activeAssignment->save();

            // Create transfer record (PTR)
            $transfer = PropertyTransfer::create([
                'property_id' => $property->id,
                'ptr_number' => 'PTR-' . date('Y') . '-' . strtoupper(uniqid()),
                'transfer_date' => now()->toDateString(),
                'from_employee_id' => $activeAssignment->assigned_to,
                'to_employee_id' => $request->input('to_employee_id'),
                'office_id' => $request->input('office_id'),
                'reason' => $request->input('reason'),
                'approved_by' => $custodian->id,
                'status' => 'approved',
            ]);

            // Re-assign property to new employee
            $threshold = 50000.00;
            $isPpe = (float) $property->unit_cost >= $threshold;
            $docType = $isPpe ? 'PAR' : 'ICS';
            $docNo = $docType . '-' . date('Y') . '-' . strtoupper(uniqid());

            PropertyAssignment::create([
                'property_id' => $property->id,
                'assigned_to' => $request->input('to_employee_id'),
                'document_type' => $docType,
                'document_number' => $docNo,
                'assigned_by' => $custodian->id,
                'date_assigned' => now()->toDateString(),
                'remarks' => "Transferred from Employee ID {$activeAssignment->assigned_to}. PTR Reference: {$transfer->ptr_number}",
            ]);

            // Update property status
            $property->status = 'transferred';
            $property->save();

            AuditLogger::log('TRANSFER_PROPERTY', $property, null, $transfer->toArray());
        });

        return redirect()->back()->with('success', 'Property transfer approved.');
    }

    /**
     * Dispose of property (IIRUP).
     */
    public function dispose(Request $request, Property $property): RedirectResponse
    {
        Gate::authorize('property.dispose');

        $user = Auth::user();
        $custodian = Employee::where('user_id', $user->id)->first();

        if (!$custodian) {
            return redirect()->back()->withErrors(['error' => 'Property Custodian employee profile not found.']);
        }

        $request->validate([
            'disposal_method' => ['required', 'in:auction,transfer,donation,destruction'],
            'reason' => ['required', 'in:broken,obsolete,lost,expired,condemned'],
            'appraised_value' => ['nullable', 'numeric', 'min:0'],
            'proceeds' => ['nullable', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($request, $property, $custodian) {
            // Close active assignment if exists
            if ($activeAssignment = $property->activeAssignment) {
                $activeAssignment->returned_date = now()->toDateString();
                $activeAssignment->remarks = 'Disposed / Condemned';
                $activeAssignment->save();
            }

            // Create disposal (IIRUP) record
            $disposal = Disposal::create([
                'property_id' => $property->id,
                'disposal_number' => 'IIRUP-' . date('Y') . '-' . strtoupper(uniqid()),
                'disposal_method' => $request->input('disposal_method'),
                'reason' => $request->input('reason'),
                'disposal_date' => now()->toDateString(),
                'appraised_value' => $request->input('appraised_value', 0.00),
                'proceeds' => $request->input('proceeds', 0.00),
                'witness_by' => 'COA Auditor Representative',
                'approved_by' => $custodian->id,
                'status' => 'completed',
            ]);

            // Update property status
            $property->condition = 'unserviceable';
            $property->status = 'disposed';
            $property->save();

            AuditLogger::log('DISPOSE_PROPERTY', $property, null, $disposal->toArray());
        });

        return redirect()->back()->with('success', 'Property disposal completed.');
    }
}
