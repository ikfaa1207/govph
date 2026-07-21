<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\PurchaseOrder\CreatePurchaseOrderAction;
use App\Actions\PurchaseOrder\UpdatePurchaseOrderAction;
use App\Enums\PurchaseRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePurchaseOrderRequest;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of purchase orders.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', PurchaseOrder::class);

        $query = PurchaseOrder::with(['purchaseRequest.requester', 'supplier', 'items.item.unit'])
            ->visibleTo($request->user());

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('purchaseRequest', function ($sub) use ($search) {
                        $sub->where('pr_number', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('supplier_id') && $request->input('supplier_id') !== 'all') {
            $query->where('supplier_id', $request->input('supplier_id'));
        }

        $purchaseOrders = $query->orderBy('id', 'desc')->paginate(15);

        $counts = PurchaseOrder::visibleTo($request->user())
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $stats = [
            'total' => array_sum($counts),
            'draft' => $counts['draft'] ?? 0,
            'sent' => $counts['sent'] ?? 0,
            'received' => ($counts['received'] ?? 0) + ($counts['partially_received'] ?? 0),
        ];

        $approvedPRs = PurchaseRequest::visibleTo($request->user())
            ->where('status', 'approved')
            ->with(['items.item.unit', 'requester', 'department'])
            ->get();

        return Inertia::render('inventory/purchase-orders/index', [
            'purchaseOrders' => $purchaseOrders,
            'stats' => $stats,
            'approvedPurchaseRequests' => $approvedPRs,
            'suppliers' => Supplier::all(),
            'filters' => $request->only(['search', 'status', 'supplier_id']),
        ]);
    }

    /**
     * Store a newly created purchase order.
     */
    public function store(StorePurchaseOrderRequest $request, CreatePurchaseOrderAction $action): RedirectResponse
    {
        Gate::authorize('create', PurchaseOrder::class);

        $validated = $request->validated();

        $pr = PurchaseRequest::where('id', $validated['purchase_request_id'])->first();
        if (! $pr instanceof PurchaseRequest) {
            abort(404);
        }

        if ($pr->status !== PurchaseRequestStatus::Approved) {
            return back()->withErrors(['purchase_request_id' => 'Purchase Request must be approved before creating a PO.']);
        }

        $action->execute($pr, $validated);

        return back()->with('success', 'Purchase Order created successfully.');
    }

    /**
     * Update a draft purchase order.
     */
    public function update(Request $request, PurchaseOrder $purchaseOrder, UpdatePurchaseOrderAction $action): RedirectResponse
    {
        Gate::authorize('update', $purchaseOrder);

        $validated = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'po_date' => ['required', 'date'],
            'delivery_date' => ['nullable', 'date', 'after_or_equal:po_date'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'exists:items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.remarks' => ['nullable', 'string', 'max:500'],
        ]);

        $action->execute($purchaseOrder, $validated);

        return back()->with('success', 'Purchase Order updated successfully.');
    }

    /**
     * Mark a draft purchase order as sent to supplier.
     */
    public function send(PurchaseOrder $purchaseOrder): RedirectResponse
    {
        Gate::authorize('send', $purchaseOrder);

        $purchaseOrder->update(['status' => 'sent']);

        return back()->with('success', 'Purchase Order marked as sent to supplier.');
    }

    /**
     * Print purchase order (Appendix 61 form).
     */
    public function print(PurchaseOrder $purchaseOrder): Response
    {
        Gate::authorize('view', $purchaseOrder);

        $purchaseOrder->load([
            'purchaseRequest.requester.department.office',
            'supplier',
            'items.item.unit',
        ]);

        return Inertia::render('inventory/purchase-orders/print', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }
}
