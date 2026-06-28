<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Issuance;
use App\Models\IssuanceItem;
use App\Models\Item;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Services\Audit\AuditLogger;
use App\Services\Valuation\ValuationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class RequisitionController extends Controller
{
    public function __construct(protected ValuationService $valuationService) {}

    /**
     * List requisitions depending on user role.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('inventory.view');

        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        $query = Requisition::with(['requester.department', 'departmentHead', 'items.item.unit']);

        // Data Scope Restrictions
        if (! $user->hasPermissionTo('warehouse.issue') && ! $user->hasPermissionTo('audit.view')) {
            if ($user->hasPermissionTo('request.approve') && $employee) {
                // Dept Head sees department requests
                $query->where('department_id', $employee->department_id);
            } elseif ($employee) {
                // Regular employee sees their own requests
                $query->where('requesting_employee_id', $employee->id);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $requisitions = $query->orderBy('id', 'desc')->get();
        $allItems = Item::where('status', 'active')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'current_stock' => $item->current_stock,
                'unit_cost' => $item->unit_cost,
                'unit' => $item->unit?->abbreviation ?? 'pcs',
            ];
        });

        return Inertia::render('inventory/requisitions/index', [
            'requisitions' => $requisitions,
            'items' => $allItems,
            'currentEmployee' => $employee,
        ]);
    }

    /**
     * Create a new requisition request (RIS).
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('request.create');

        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (! $employee) {
            return redirect()->back()->withErrors(['error' => 'You must have an employee profile to file requisitions.']);
        }

        $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'exists:items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'purpose' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request, $employee) {
            $requisition = Requisition::create([
                'ris_number' => 'RIS-'.date('Ymd').'-'.strtoupper(uniqid()),
                'requesting_employee_id' => $employee->id,
                'department_id' => $employee->department_id,
                'status' => 'pending_dept_head',
                'remarks' => $request->input('purpose'),
            ]);

            foreach ($request->input('items') as $reqItem) {
                RequisitionItem::create([
                    'requisition_id' => $requisition->id,
                    'item_id' => $reqItem['item_id'],
                    'quantity_requested' => $reqItem['quantity'],
                    'quantity_approved' => 0,
                    'quantity_issued' => 0,
                ]);
            }

            AuditLogger::log('CREATE_RIS', $requisition, null, $requisition->toArray());
        });

        return redirect()->back()->with('success', 'Requisition submitted successfully.');
    }

    /**
     * Approve requisition (by Dept Head).
     */
    public function approve(Request $request, Requisition $requisition): RedirectResponse
    {
        Gate::authorize('request.approve');

        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        if ($employee && $requisition->requesting_employee_id === $employee->id) {
            abort(403, 'A creator cannot approve their own requisition request.');
        }

        $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'exists:requisition_items,id'],
            'items.*.quantity_approved' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($request, $requisition, $employee) {
            $requisition->status = 'pending_supply';
            $requisition->department_head_id = $employee?->id;
            $requisition->approved_at = now();
            $requisition->save();

            foreach ($request->input('items') as $reqItem) {
                $dbItem = RequisitionItem::find($reqItem['id']);
                if ($dbItem) {
                    $dbItem->quantity_approved = $reqItem['quantity_approved'];
                    $dbItem->save();
                }
            }

            AuditLogger::log('APPROVE_RIS', $requisition, null, $requisition->toArray());
        });

        return redirect()->back()->with('success', 'Requisition approved successfully.');
    }

    /**
     * Issue items from inventory (by Supply Officer).
     */
    public function issue(Request $request, Requisition $requisition): RedirectResponse
    {
        Gate::authorize('warehouse.issue');

        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        if (! $employee) {
            return redirect()->back()->withErrors(['error' => 'You must have an employee profile to issue items.']);
        }

        $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'exists:requisition_items,id'],
            'items.*.quantity_issued' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($request, $requisition, $employee) {
            // Create issuance record
            $issuance = Issuance::create([
                'requisition_id' => $requisition->id,
                'issue_number' => 'ISSUE-'.date('Ymd').'-'.strtoupper(uniqid()),
                'issued_date' => now()->toDateString(),
                'issued_by' => $employee->id,
                'received_by' => $requisition->requesting_employee_id,
                'purpose' => $requisition->remarks,
            ]);

            $allCompleted = true;

            foreach ($request->input('items') as $reqItem) {
                $dbItem = RequisitionItem::find($reqItem['id']);
                if ($dbItem && $reqItem['quantity_issued'] > 0) {
                    $item = $dbItem->item;

                    // Verify availability
                    if ($item->current_stock < $reqItem['quantity_issued']) {
                        throw new \Exception("Insufficient stock for item: {$item->name}");
                    }

                    // Perform stock out via Valuation Service
                    $cost = $this->valuationService->recordStockOut(
                        $item,
                        $reqItem['quantity_issued'],
                        Issuance::class,
                        $issuance->id,
                        "Issued via RIS #{$requisition->ris_number}"
                    );

                    // Record issuance item cost
                    IssuanceItem::create([
                        'issuance_id' => $issuance->id,
                        'item_id' => $item->id,
                        'quantity_issued' => $reqItem['quantity_issued'],
                        'unit_cost' => $cost,
                    ]);

                    // Update issued quantity in RIS
                    $dbItem->quantity_issued += $reqItem['quantity_issued'];
                    $dbItem->save();
                }

                // If we didn't fully issue the approved amount, it's not completed
                if ($dbItem && $dbItem->quantity_issued < $dbItem->quantity_approved) {
                    $allCompleted = false;
                }
            }

            $requisition->status = $allCompleted ? 'issued' : 'partially_issued';
            $requisition->save();

            AuditLogger::log('ISSUE_RIS', $issuance, null, $issuance->toArray());
        });

        return redirect()->back()->with('success', 'Items issued successfully.');
    }

    /**
     * Print requisition (RIS form).
     */
    public function print(Request $request, Requisition $requisition): Response
    {
        Gate::authorize('inventory.view');

        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();

        // Data Scope Restrictions
        if (! $user->hasPermissionTo('warehouse.issue') && ! $user->hasPermissionTo('audit.view')) {
            if ($user->hasPermissionTo('request.approve') && $employee) {
                if ($requisition->department_id !== $employee->department_id) {
                    abort(403, 'Unauthorized.');
                }
            } elseif ($employee) {
                if ($requisition->requesting_employee_id !== $employee->id) {
                    abort(403, 'Unauthorized.');
                }
            } else {
                abort(403, 'Unauthorized.');
            }
        }

        $requisition->load([
            'requester.department.office',
            'departmentHead',
            'items.item.unit',
            'issuances.issuer',
            'issuances.receiver',
        ]);

        return Inertia::render('inventory/requisitions/print', [
            'requisition' => $requisition,
        ]);
    }
}
