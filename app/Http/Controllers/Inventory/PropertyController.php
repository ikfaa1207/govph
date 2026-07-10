<?php

namespace App\Http\Controllers\Inventory;

use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Disposal;
use App\Models\Employee;
use App\Models\Office;
use App\Models\Property;
use App\Models\PropertyAssignment;
use App\Models\PropertySubAssignment;
use App\Models\PropertyTransfer;
use App\Services\Audit\AuditLogger;
use App\Services\DocumentSequenceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PropertyController extends Controller
{
    public function __construct(protected DocumentSequenceService $sequences) {}

    /**
     * Display a listing of properties and lookup tables.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('property.view');

        $user = Auth::user();
        $employee = Employee::with('department')->where('user_id', $user->id)->first();

        $seesGlobalInventory = Gate::allows('warehouse.issue')
            || Gate::allows('audit.view');

        $query = Property::with(['category', 'activeAssignment.assignee', 'activeSubAssignment.assignee']);

        if (! $seesGlobalInventory && $employee) {
            $query->whereHas('activeAssignment.assignee', function ($q) use ($employee) {
                $q->where('department_id', $employee->department_id);
            });
        }

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

        $properties = $query->orderBy('id', 'desc')->paginate(15);
        $employees = Employee::orderBy('name')->get();
        $categories = Category::all();
        $offices = Office::all();

        $stats = [
            'total_items' => Property::count(),
            'available' => Property::where('status', 'available')->count(),
            'assigned' => Property::where('status', 'assigned')->count(),
            'total_value' => Property::sum('unit_cost'),
            'recently_added' => Property::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        return Inertia::render('inventory/property/index', [
            'properties' => $properties,
            'employees' => $employees,
            'categories' => $categories,
            'offices' => $offices,
            'current_employee' => $employee,
            'filters' => $request->only(['status', 'search']),
            'stats' => $stats,
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
        $validated['property_number'] = $this->sequences->next('PPE');
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

        if (! $custodian) {
            return redirect()->back()->withErrors(['error' => 'Property Custodian employee profile not found.']);
        }

        abort_if($property->status !== PropertyStatus::Available, 400, 'Only available properties can be assigned.');

        $request->validate([
            'is_non_system' => ['nullable', 'boolean'],
            'assigned_to' => ['required_unless:is_non_system,true', 'nullable', 'exists:employees,id'],
            'non_system_name' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'non_system_department' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request, $property, $custodian) {
            // Capitalization threshold routing
            $threshold = config('inventory.capitalization_threshold', 50000.00);
            $isPpe = (float) $property->unit_cost >= $threshold;

            $docType = $isPpe ? 'PAR' : 'ICS';
            $docNo = $this->sequences->next($docType);

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
            $property->status = PropertyStatus::Assigned;
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
     * Assign multiple properties to an employee in a batch.
     */
    public function batchAssign(Request $request): RedirectResponse
    {
        Gate::authorize('property.assign');

        $user = Auth::user();
        $custodian = Employee::where('user_id', $user->id)->first();

        if (! $custodian) {
            return redirect()->back()->withErrors(['error' => 'Property Custodian employee profile not found.']);
        }

        $request->validate([
            'property_ids' => ['required', 'array', 'min:1'],
            'property_ids.*' => ['exists:properties,id'],
            'is_non_system' => ['nullable', 'boolean'],
            'assigned_to' => ['required_unless:is_non_system,true', 'nullable', 'exists:employees,id'],
            'non_system_name' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'non_system_department' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ]);

        $properties = Property::whereIn('id', $request->input('property_ids'))->get();
        
        foreach ($properties as $property) {
            abort_if($property->status !== PropertyStatus::Available, 400, "Property {$property->property_number} is not available for assignment.");
        }

        DB::transaction(function () use ($request, $properties, $custodian) {
            $threshold = config('inventory.capitalization_threshold', 50000.00);
            
            // Separate properties into PAR and ICS based on threshold
            $ppeProperties = [];
            $icsProperties = [];
            
            foreach ($properties as $property) {
                if ((float) $property->unit_cost >= $threshold) {
                    $ppeProperties[] = $property;
                } else {
                    $icsProperties[] = $property;
                }
            }
            
            $isNonSystem = $request->boolean('is_non_system');
            
            // Assign PAR properties
            if (count($ppeProperties) > 0) {
                $parDocNo = $this->sequences->next('PAR');
                foreach ($ppeProperties as $property) {
                    PropertyAssignment::create([
                        'property_id' => $property->id,
                        'assigned_to' => $isNonSystem ? null : $request->input('assigned_to'),
                        'non_system_name' => $isNonSystem ? $request->input('non_system_name') : null,
                        'non_system_department' => $isNonSystem ? $request->input('non_system_department') : null,
                        'document_type' => 'PAR',
                        'document_number' => $parDocNo,
                        'assigned_by' => $custodian->id,
                        'date_assigned' => now()->toDateString(),
                        'remarks' => $request->input('remarks'),
                    ]);
                    
                    $property->status = PropertyStatus::Assigned;
                    $property->save();
                    AuditLogger::log('ASSIGN_PROPERTY', $property, null, ['document_type' => 'PAR', 'document_number' => $parDocNo]);
                }
            }
            
            // Assign ICS properties
            if (count($icsProperties) > 0) {
                $icsDocNo = $this->sequences->next('ICS');
                foreach ($icsProperties as $property) {
                    PropertyAssignment::create([
                        'property_id' => $property->id,
                        'assigned_to' => $isNonSystem ? null : $request->input('assigned_to'),
                        'non_system_name' => $isNonSystem ? $request->input('non_system_name') : null,
                        'non_system_department' => $isNonSystem ? $request->input('non_system_department') : null,
                        'document_type' => 'ICS',
                        'document_number' => $icsDocNo,
                        'assigned_by' => $custodian->id,
                        'date_assigned' => now()->toDateString(),
                        'remarks' => $request->input('remarks'),
                    ]);
                    
                    $property->status = PropertyStatus::Assigned;
                    $property->save();
                    AuditLogger::log('ASSIGN_PROPERTY', $property, null, ['document_type' => 'ICS', 'document_number' => $icsDocNo]);
                }
            }
        });

        return redirect()->back()->with('success', 'Properties assigned successfully.');
    }

    /**
     * Transfer property (PTR) to another employee.
     */
    public function transfer(Request $request, Property $property): RedirectResponse
    {
        Gate::authorize('property.transfer');

        $user = Auth::user();
        $custodian = Employee::where('user_id', $user->id)->first();

        if (! $custodian) {
            return redirect()->back()->withErrors(['error' => 'Property Custodian employee profile not found.']);
        }

        abort_if(! in_array($property->status, [PropertyStatus::Assigned, PropertyStatus::Transferred]), 400, 'Only assigned or transferred properties can be transferred.');

        $request->validate([
            'to_employee_id' => ['required', 'exists:employees,id'],
            'office_id' => ['required', 'exists:offices,id'],
            'reason' => ['required', 'string'],
        ]);

        $activeAssignment = $property->activeAssignment;
        if (! $activeAssignment) {
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
                'ptr_number' => $this->sequences->next('PTR'),
                'transfer_date' => now()->toDateString(),
                'from_employee_id' => $activeAssignment->assigned_to,
                'to_employee_id' => $request->input('to_employee_id'),
                'office_id' => $request->input('office_id'),
                'reason' => $request->input('reason'),
                'approved_by' => $custodian->id,
                'status' => 'approved',
            ]);

            // Re-assign property to new employee
            $threshold = config('inventory.capitalization_threshold', 50000.00);
            $isPpe = (float) $property->unit_cost >= $threshold;
            $docType = $isPpe ? 'PAR' : 'ICS';
            $docNo = $this->sequences->next($docType);

            $fromName = $activeAssignment->assigned_to
                ? "Employee ID {$activeAssignment->assigned_to}"
                : "{$activeAssignment->non_system_name} ({$activeAssignment->non_system_department})";

            PropertyAssignment::create([
                'property_id' => $property->id,
                'assigned_to' => $request->input('to_employee_id'),
                'document_type' => $docType,
                'document_number' => $docNo,
                'assigned_by' => $custodian->id,
                'date_assigned' => now()->toDateString(),
                'remarks' => "Transferred from {$fromName}. PTR Reference: {$transfer->ptr_number}",
            ]);

            // Update property status
            $property->status = PropertyStatus::Transferred;
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

        if (! $custodian) {
            return redirect()->back()->withErrors(['error' => 'Property Custodian employee profile not found.']);
        }

        abort_if($property->status === PropertyStatus::Disposed, 400, 'This property has already been disposed.');

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
                'disposal_number' => $this->sequences->next('IIRUP'),
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
            $property->status = PropertyStatus::Disposed;
            $property->save();

            AuditLogger::log('DISPOSE_PROPERTY', $property, null, $disposal->toArray());
        });

        return redirect()->back()->with('success', 'Property disposal completed.');
    }

    /**
     * Issue an internal Sub-Assignment (Memorandum Receipt) for a property.
     */
    public function subAssign(Request $request, Property $property): RedirectResponse
    {
        if (! Gate::allows('property.transfer') && ! Auth::user()->hasRole('Department Head')) {
            abort(403, 'Unauthorized to issue Memorandum Receipts.');
        }

        $user = Auth::user();
        $issuer = Employee::with('department')->where('user_id', $user->id)->first();

        if (! $issuer) {
            return redirect()->back()->withErrors(['error' => 'Issuer employee profile not found.']);
        }

        abort_if(! in_array($property->status, [PropertyStatus::Assigned, PropertyStatus::Transferred]), 400, 'Only assigned or transferred properties can be sub-assigned.');

        $request->validate([
            'is_non_system' => ['nullable', 'boolean'],
            'issued_to' => ['required_unless:is_non_system,true', 'nullable', 'exists:employees,id'],
            'non_system_name' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request, $property, $issuer) {
            // Close existing active sub-assignment if there is one
            if ($activeSubAssignment = $property->activeSubAssignment) {
                $activeSubAssignment->returned_date = now()->toDateString();
                $activeSubAssignment->remarks = ($activeSubAssignment->remarks ? $activeSubAssignment->remarks.' | ' : '').'Re-issued to another personnel.';
                $activeSubAssignment->save();
            }

            $isNonSystem = $request->boolean('is_non_system');

            // Generate MR number (MR-YYYY-XXXXX)
            $mrNumber = 'MR-'.date('Y').'-'.str_pad((string) (PropertySubAssignment::count() + 1), 5, '0', STR_PAD_LEFT);

            $subAssignment = PropertySubAssignment::create([
                'property_id' => $property->id,
                'issued_to' => $isNonSystem ? null : $request->input('issued_to'),
                'non_system_name' => $isNonSystem ? $request->input('non_system_name') : null,
                'non_system_department' => $isNonSystem ? ($issuer->department->name ?? 'Unknown') : null,
                'mr_number' => $mrNumber,
                'issued_by' => $issuer->id,
                'date_issued' => now()->toDateString(),
                'remarks' => $request->input('remarks'),
            ]);

            AuditLogger::log('ISSUE_MR', $property, null, $subAssignment->toArray());
        });

        return redirect()->back()->with('success', 'Memorandum Receipt issued successfully.');
    }

    /**
     * Return/close an internal Sub-Assignment (Memorandum Receipt).
     */
    public function returnSubAssignment(Request $request, PropertySubAssignment $subAssignment): RedirectResponse
    {
        if (! Gate::allows('property.transfer') && ! Auth::user()->hasRole('Department Head')) {
            abort(403, 'Unauthorized to return Memorandum Receipts.');
        }

        $request->validate([
            'remarks' => ['nullable', 'string'],
        ]);

        $subAssignment->returned_date = now()->toDateString();
        $subAssignment->remarks = ($subAssignment->remarks ? $subAssignment->remarks.' | ' : '').'Returned. '.$request->input('remarks', '');
        $subAssignment->save();

        AuditLogger::log('RETURN_MR', $subAssignment->property, null, ['mr_number' => $subAssignment->mr_number]);

        return redirect()->back()->with('success', 'Memorandum Receipt returned successfully.');
    }
}
