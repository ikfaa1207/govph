<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\Requisition\ApproveRequisitionAction;
use App\Actions\Requisition\CreateRequisitionAction;
use App\Actions\Requisition\IssueRequisitionAction;
use App\Actions\Requisition\RejectRequisitionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\ApproveRequisitionRequest;
use App\Http\Requests\IssueRequisitionRequest;
use App\Http\Requests\RejectRequisitionRequest;
use App\Http\Requests\StoreRequisitionRequest;
use App\Models\Item;
use App\Models\Requisition;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class RequisitionController extends Controller
{
    public function __construct(
        protected CreateRequisitionAction $createAction,
        protected ApproveRequisitionAction $approveAction,
        protected IssueRequisitionAction $issueAction,
        protected RejectRequisitionAction $rejectAction,
    ) {}

    /**
     * List requisitions depending on user role.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('requisition.viewAny');

        $user = Auth::user();
        $employee = $user?->employee;

        $query = Requisition::with(['requester.department', 'departmentHead', 'items.item.unit'])
            ->visibleTo($user, $employee);

        // Search filtering
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('requisition_number', 'like', "%{$search}%")
                    ->orWhereHas('requester', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Status filtering
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Date range filtering
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        $requisitions = $query->orderBy('id', 'desc')->paginate(15);

        $allItems = Item::where('status', 'active')
            ->whereHas('category', fn ($q) => $q->where('is_ppe', false))
            ->with('unit')
            ->get()
            ->map(fn (Item $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'current_stock' => $item->current_stock,
                'unit_cost' => $item->unit_cost,
                'unit' => $item->unit->abbreviation ?? 'pcs',
            ]);

        $counts = Requisition::visibleTo($user, $employee)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $stats = [
            'total_ris' => array_sum($counts),
            'pending_approval' => $counts['pending_dept_head'] ?? 0,
            'pending_issuance' => ($counts['pending_supply'] ?? 0) + ($counts['partially_issued'] ?? 0),
            'completed' => $counts['issued'] ?? 0,
        ];

        return Inertia::render('inventory/requisitions/index', [
            'requisitions' => $requisitions,
            'stats' => $stats,
            'items' => $allItems,
            'currentEmployee' => $employee,
            'filters' => $request->only(['search', 'status', 'start_date', 'end_date']),
        ]);
    }

    /**
     * Create a new requisition request (RIS).
     */
    public function store(StoreRequisitionRequest $request): RedirectResponse
    {
        Gate::authorize('create', Requisition::class);

        $user = Auth::user();
        $employee = $user->getEmployeeOrAbort('You must have an employee profile to file requisitions.');

        $this->createAction->execute($employee, $request->validated());

        return back()->with('success', 'Requisition submitted successfully.');
    }

    /**
     * Approve requisition (by Dept Head).
     */
    public function approve(ApproveRequisitionRequest $request, Requisition $requisition): RedirectResponse
    {
        Gate::authorize('requisition.approve', $requisition);

        $employee = Auth::user()?->employee;

        $this->approveAction->execute($requisition, $employee, $request->validated());

        return back()->with('success', 'Requisition approved successfully.');
    }

    /**
     * Issue items from inventory (by Supply Officer).
     */
    public function issue(IssueRequisitionRequest $request, Requisition $requisition): RedirectResponse
    {
        Gate::authorize('requisition.issue', $requisition);

        $user = Auth::user();
        $employee = $user->getEmployeeOrAbort('You must have an employee profile to issue items.');

        $this->issueAction->execute($requisition, $employee, $request->validated());

        return back()->with('success', 'Items issued successfully.');
    }

    /**
     * Reject requisition (by Dept Head / Admin).
     */
    public function reject(RejectRequisitionRequest $request, Requisition $requisition): RedirectResponse
    {
        Gate::authorize('reject', $requisition);

        $this->rejectAction->execute($requisition, $request->validated());

        return back()->with('success', 'Requisition rejected successfully.');
    }

    /**
     * Print requisition (RIS form).
     */
    public function print(Request $request, Requisition $requisition): Response
    {
        Gate::authorize('requisition.view', $requisition);

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
