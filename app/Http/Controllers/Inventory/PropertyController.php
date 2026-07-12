<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\Property\AssignProperty;
use App\Actions\Property\BatchAssignProperties;
use App\Actions\Property\DisposeProperty;
use App\Actions\Property\ReturnSubAssignment;
use App\Actions\Property\SubAssignProperty;
use App\Actions\Property\TransferProperty;
use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Employee;
use App\Models\Office;
use App\Models\Property;
use App\Models\PropertySubAssignment;
use App\Services\Audit\AuditLogger;
use App\Services\DocumentSequenceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PropertyController extends Controller
{
    public function __construct(
        protected DocumentSequenceService $sequences,
        protected AssignProperty $assignProperty,
        protected BatchAssignProperties $batchAssignProperties,
        protected TransferProperty $transferProperty,
        protected DisposeProperty $disposeProperty,
        protected SubAssignProperty $subAssignProperty,
        protected ReturnSubAssignment $returnSubAssignment,
    ) {}

    /**
     * Display a listing of properties and lookup tables.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('property.view');

        $user = Auth::user();
        $employee = $user?->employee;

        $seesGlobalInventory = Gate::allows('warehouse.issue')
            || Gate::allows('audit.view');

        $query = Property::with(['category', 'activeAssignment.assignee', 'activeSubAssignment.assignee', 'receivingReportItem.receivingReport']);

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
        $custodian = $user->getEmployeeOrAbort('Property Custodian employee profile not found.');

        abort_if($property->status !== PropertyStatus::Available, 400, 'Only available properties can be assigned.');

        $validated = $request->validate([
            'is_non_system' => ['nullable', 'boolean'],
            'assigned_to' => ['required_unless:is_non_system,true', 'nullable', 'exists:employees,id'],
            'non_system_name' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'non_system_department' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ]);

        try {
            $this->assignProperty->execute($property, $validated, $custodian);
        } catch (\Exception $e) {
            abort(400, $e->getMessage());
        }

        return redirect()->back()->with('success', 'Property assigned successfully.');
    }

    /**
     * Assign multiple properties to an employee in a batch.
     */
    public function batchAssign(Request $request): RedirectResponse
    {
        Gate::authorize('property.assign');

        $user = Auth::user();
        $custodian = $user->getEmployeeOrAbort('Property Custodian employee profile not found.');

        $validated = $request->validate([
            'property_ids' => ['required', 'array', 'min:1'],
            'property_ids.*' => ['exists:properties,id'],
            'is_non_system' => ['nullable', 'boolean'],
            'assigned_to' => ['required_unless:is_non_system,true', 'nullable', 'exists:employees,id'],
            'non_system_name' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'non_system_department' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ]);

        $properties = Property::whereIn('id', $validated['property_ids'])->get();

        try {
            $this->batchAssignProperties->execute($properties, $validated, $custodian);
        } catch (\Exception $e) {
            abort(400, $e->getMessage());
        }

        return redirect()->back()->with('success', 'Properties assigned successfully.');
    }

    /**
     * Transfer property (PTR) to another employee.
     */
    public function transfer(Request $request, Property $property): RedirectResponse
    {
        Gate::authorize('property.transfer');

        $user = Auth::user();
        $custodian = $user->getEmployeeOrAbort('Property Custodian employee profile not found.');

        abort_if(! in_array($property->status, [PropertyStatus::Assigned, PropertyStatus::Transferred]), 400, 'Only assigned or transferred properties can be transferred.');

        $validated = $request->validate([
            'to_employee_id' => ['required', 'exists:employees,id'],
            'office_id' => ['required', 'exists:offices,id'],
            'reason' => ['required', 'string'],
        ]);

        try {
            $this->transferProperty->execute($property, $validated, $custodian);
        } catch (\Exception $e) {
            abort(400, $e->getMessage());
        }

        return redirect()->back()->with('success', 'Property transfer approved.');
    }

    /**
     * Dispose of property (IIRUP).
     */
    public function dispose(Request $request, Property $property): RedirectResponse
    {
        Gate::authorize('property.dispose');

        $user = Auth::user();
        $custodian = $user->getEmployeeOrAbort('Property Custodian employee profile not found.');

        abort_if($property->status === PropertyStatus::Disposed, 400, 'This property has already been disposed.');

        $validated = $request->validate([
            'disposal_method' => ['required', 'in:auction,transfer,donation,destruction'],
            'reason' => ['required', 'in:broken,obsolete,lost,expired,condemned'],
            'appraised_value' => ['nullable', 'numeric', 'min:0'],
            'proceeds' => ['nullable', 'numeric', 'min:0'],
            'witness_by' => ['required', 'string', 'max:255'],
            'inspected_by' => ['nullable', 'exists:employees,id'],
            'jev_reference' => ['nullable', 'string', 'max:255'],
            'approved_by' => [
                'required',
                'exists:employees,id',
                function (string $attribute, mixed $value, \Closure $fail) use ($custodian) {
                    if ((int) $value === (int) $custodian->id) {
                        $fail('The disposal approver cannot be the same custodian who initiated the disposal.');
                    }
                },
            ],
        ]);

        try {
            $this->disposeProperty->execute($property, $validated, $custodian);
        } catch (\Exception $e) {
            abort(400, $e->getMessage());
        }

        return redirect()->back()->with('success', 'Property disposal completed.');
    }

    /**
     * Issue an internal Sub-Assignment (Memorandum Receipt) for a property.
     */
    public function subAssign(Request $request, Property $property): RedirectResponse
    {
        Gate::authorize('property.subassign');

        $user = Auth::user();
        $issuer = $user->getEmployeeOrAbort('Issuer employee profile not found.');
        $issuer->loadMissing('department');

        abort_if(! in_array($property->status, [PropertyStatus::Assigned, PropertyStatus::Transferred]), 400, 'Only assigned or transferred properties can be sub-assigned.');

        $validated = $request->validate([
            'is_non_system' => ['nullable', 'boolean'],
            'issued_to' => ['required_unless:is_non_system,true', 'nullable', 'exists:employees,id'],
            'non_system_name' => ['required_if:is_non_system,true', 'nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string'],
        ]);

        try {
            $this->subAssignProperty->execute($property, $validated, $issuer);
        } catch (\Exception $e) {
            abort(400, $e->getMessage());
        }

        return redirect()->back()->with('success', 'Memorandum Receipt issued successfully.');
    }

    /**
     * Return/close an internal Sub-Assignment (Memorandum Receipt).
     */
    public function returnSubAssignment(Request $request, PropertySubAssignment $subAssignment): RedirectResponse
    {
        Gate::authorize('property.subassign');

        $validated = $request->validate([
            'remarks' => ['nullable', 'string'],
        ]);

        try {
            $this->returnSubAssignment->execute($subAssignment, $validated);
        } catch (\Exception $e) {
            abort(400, $e->getMessage());
        }

        return redirect()->back()->with('success', 'Memorandum Receipt returned successfully.');
    }
}
