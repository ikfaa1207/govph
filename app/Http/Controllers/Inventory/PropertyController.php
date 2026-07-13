<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\Property\AssignProperty;
use App\Actions\Property\BatchAssignProperties;
use App\Actions\Property\DisposeProperty;
use App\Actions\Property\ReturnSubAssignment;
use App\Actions\Property\SubAssignProperty;
use App\Actions\Property\TransferProperty;
use App\Actions\Property\UpdateProperty;
use App\Enums\PropertyStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\AssignPropertyRequest;
use App\Http\Requests\BatchAssignPropertyRequest;
use App\Http\Requests\DisposePropertyRequest;
use App\Http\Requests\ReturnSubAssignmentRequest;
use App\Http\Requests\StorePropertyRequest;
use App\Http\Requests\SubAssignPropertyRequest;
use App\Http\Requests\TransferPropertyRequest;
use App\Http\Requests\UpdatePropertyRequest;
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
        protected UpdateProperty $updateProperty,
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
    public function store(StorePropertyRequest $request): RedirectResponse
    {
        Gate::authorize('property.assign');

        $validated = $request->validated();

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
    public function assign(AssignPropertyRequest $request, Property $property): RedirectResponse
    {
        Gate::authorize('property.assign');

        $user = Auth::user();
        $custodian = $user->getEmployeeOrAbort('Property Custodian employee profile not found.');

        abort_if($property->status !== PropertyStatus::Available, 400, 'Only available properties can be assigned.');

        $validated = $request->validated();

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
    public function batchAssign(BatchAssignPropertyRequest $request): RedirectResponse
    {
        Gate::authorize('property.assign');

        $user = Auth::user();
        $custodian = $user->getEmployeeOrAbort('Property Custodian employee profile not found.');

        $validated = $request->validated();

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
    public function transfer(TransferPropertyRequest $request, Property $property): RedirectResponse
    {
        Gate::authorize('property.transfer');

        $user = Auth::user();
        $custodian = $user->getEmployeeOrAbort('Property Custodian employee profile not found.');

        abort_if(! in_array($property->status, [PropertyStatus::Assigned, PropertyStatus::Transferred]), 400, 'Only assigned or transferred properties can be transferred.');

        $validated = $request->validated();

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
    public function dispose(DisposePropertyRequest $request, Property $property): RedirectResponse
    {
        Gate::authorize('property.dispose');

        $user = Auth::user();
        $custodian = $user->getEmployeeOrAbort('Property Custodian employee profile not found.');

        abort_if($property->status === PropertyStatus::Disposed, 400, 'This property has already been disposed.');

        $validated = $request->validated();

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
    public function subAssign(SubAssignPropertyRequest $request, Property $property): RedirectResponse
    {
        Gate::authorize('property.subassign');

        $user = Auth::user();
        $issuer = $user->getEmployeeOrAbort('Issuer employee profile not found.');
        $issuer->loadMissing('department');

        abort_if(! in_array($property->status, [PropertyStatus::Assigned, PropertyStatus::Transferred]), 400, 'Only assigned or transferred properties can be sub-assigned.');

        $validated = $request->validated();

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
    public function returnSubAssignment(ReturnSubAssignmentRequest $request, PropertySubAssignment $subAssignment): RedirectResponse
    {
        Gate::authorize('property.subassign');

        $validated = $request->validated();

        try {
            $this->returnSubAssignment->execute($subAssignment, $validated);
        } catch (\Exception $e) {
            abort(400, $e->getMessage());
        }

        return redirect()->back()->with('success', 'Memorandum Receipt returned successfully.');
    }

    /**
     * Update the details of a property.
     */
    public function update(UpdatePropertyRequest $request, Property $property): RedirectResponse
    {
        Gate::authorize('property.assign');

        try {
            $this->updateProperty->execute($property, $request->validated());
        } catch (\Exception $e) {
            abort(400, $e->getMessage());
        }

        return redirect()->back()->with('success', 'Property updated successfully.');
    }
}
