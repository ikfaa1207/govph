<?php

namespace App\Http\Controllers\Inventory;

use App\Enums\RequisitionStatus;
use App\Exceptions\InsufficientStockException;
use App\Http\Controllers\Controller;
use App\Http\Requests\ApproveRequisitionRequest;
use App\Http\Requests\StoreRequisitionRequest;
use App\Models\DepartmentItem;
use App\Models\Employee;
use App\Models\Issuance;
use App\Models\IssuanceItem;
use App\Models\Item;
use App\Models\Requisition;
use App\Models\RequisitionItem;
use App\Services\Audit\AuditLogger;
use App\Services\DocumentSequenceService;
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
    public function __construct(
        protected ValuationService $valuationService,
        protected DocumentSequenceService $sequences,
    ) {}

    /**
     * List requisitions depending on user role.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Requisition::class);

        $user = Auth::user();
        $employee = $user?->employee;

        $requisitions = Requisition::with(['requester.department', 'departmentHead', 'items.item.unit'])
            ->visibleTo($user, $employee)
            ->orderBy('id', 'desc')
            ->get();

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

        $stats = [
            'total_ris' => $requisitions->count(),
            'pending_approval' => $requisitions->where('status', 'pending_dept_head')->count(),
            'pending_issuance' => $requisitions->whereIn('status', ['pending_supply', 'partially_issued'])->count(),
            'completed' => $requisitions->where('status', 'issued')->count(),
        ];

        return Inertia::render('inventory/requisitions/index', [
            'requisitions' => $requisitions->values(),
            'stats' => $stats,
            'items' => $allItems,
            'currentEmployee' => $employee,
        ]);
    }

    /**
     * Create a new requisition request (RIS).
     */
    public function store(StoreRequisitionRequest $request): RedirectResponse
    {
        Gate::authorize('request.create');

        $user = Auth::user();
        $employee = $user?->employee;

        if (! $employee) {
            return back()->withErrors(['error' => 'You must have an employee profile to file requisitions.']);
        }

        $deptHead = Employee::where('department_id', $employee->department_id)
            ->whereHas('user.roles', fn ($q) => $q->where('name', 'Department Head'))
            ->first();

        $risNumber = $this->sequences->next('RIS');

        DB::transaction(function () use ($request, $employee, $deptHead, $risNumber) {
            $requisition = Requisition::create([
                'ris_number' => $risNumber,
                'requesting_employee_id' => $employee->id,
                'department_id' => $employee->department_id,
                'status' => RequisitionStatus::PendingDeptHead,
                'department_head_id' => $deptHead?->id,
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

        return back()->with('success', 'Requisition submitted successfully.');
    }

    /**
     * Approve requisition (by Dept Head).
     */
    public function approve(ApproveRequisitionRequest $request, Requisition $requisition): RedirectResponse
    {
        Gate::authorize('approve', $requisition);

        $employee = Auth::user()?->employee;

        DB::transaction(function () use ($request, $requisition, $employee) {
            $requisition->status = RequisitionStatus::PendingSupply;
            if ($employee) {
                $requisition->department_head_id = $employee->id;
            }
            $requisition->approved_at = now();
            $requisition->save();

            foreach ($request->input('items') as $reqItem) {
                $dbItem = RequisitionItem::find($reqItem['id']);
                if ($dbItem instanceof RequisitionItem) {
                    $dbItem->quantity_approved = $reqItem['quantity_approved'];
                    $dbItem->save();
                }
            }

            AuditLogger::log('APPROVE_RIS', $requisition, null, $requisition->toArray());
        });

        return back()->with('success', 'Requisition approved successfully.');
    }

    /**
     * Issue items from inventory (by Supply Officer).
     */
    public function issue(Request $request, Requisition $requisition): RedirectResponse
    {
        Gate::authorize('issue', $requisition);

        $user = Auth::user();
        $employee = $user?->employee;

        if (! $employee) {
            return back()->withErrors(['error' => 'You must have an employee profile to issue items.']);
        }

        $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'exists:requisition_items,id'],
            'items.*.quantity_issued' => ['required', 'integer', 'min:0'],
        ]);

        $issueNumber = $this->sequences->next('ISSUE');

        DB::transaction(function () use ($request, $requisition, $employee, $issueNumber) {
            $issuance = Issuance::create([
                'requisition_id' => $requisition->id,
                'issue_number' => $issueNumber,
                'issued_date' => now()->toDateString(),
                'issued_by' => $employee->id,
                'received_by' => $requisition->requesting_employee_id,
                'purpose' => $requisition->remarks,
            ]);

            $allCompleted = true;

            foreach ($request->input('items') as $reqItem) {
                $dbItem = RequisitionItem::find($reqItem['id']);
                if (! $dbItem instanceof RequisitionItem) {
                    continue;
                }

                $qtyIssued = (int) $reqItem['quantity_issued'];

                if ($qtyIssued > 0) {
                    $item = $dbItem->item;
                    $available = $item->current_stock;

                    if ($available < $qtyIssued) {
                        throw new InsufficientStockException($item, $qtyIssued, $available);
                    }

                    $cost = $this->valuationService->recordStockOut(
                        $item,
                        $qtyIssued,
                        Issuance::class,
                        $issuance->id,
                        "Issued via RIS #{$requisition->ris_number}"
                    );

                    IssuanceItem::create([
                        'issuance_id' => $issuance->id,
                        'item_id' => $item->id,
                        'quantity_issued' => $qtyIssued,
                        'unit_cost' => $cost,
                    ]);

                    // Add to Department Inventory
                    $deptItem = DepartmentItem::firstOrCreate(
                        ['department_id' => $requisition->department_id, 'item_id' => $item->id],
                        ['current_stock' => 0]
                    );
                    $deptItem->increment('current_stock', $qtyIssued);

                    $dbItem->quantity_issued += $qtyIssued;
                    $dbItem->save();
                }

                if ($dbItem->quantity_issued < $dbItem->quantity_approved) {
                    $allCompleted = false;
                }
            }

            $requisition->status = $allCompleted
                ? RequisitionStatus::Issued
                : RequisitionStatus::PartiallyIssued;
            $requisition->save();

            AuditLogger::log('ISSUE_RIS', $issuance, null, $issuance->toArray());
        });

        return back()->with('success', 'Items issued successfully.');
    }

    /**
     * Print requisition (RIS form).
     */
    public function print(Request $request, Requisition $requisition): Response
    {
        Gate::authorize('view', $requisition);

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
