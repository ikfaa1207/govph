<?php

namespace App\Http\Controllers\Inventory;

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

        $query = PurchaseOrder::with(['purchaseRequest.requester', 'supplier', 'items.item.unit']);

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

        $counts = PurchaseOrder::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $stats = [
            'total' => array_sum($counts),
            'draft' => $counts['draft'] ?? 0,
            'sent' => $counts['sent'] ?? 0,
            'received' => ($counts['received'] ?? 0) + ($counts['partially_received'] ?? 0),
        ];

        $approvedPRs = PurchaseRequest::where('status', 'approved')
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
    public function store(StorePurchaseOrderRequest $request): RedirectResponse
    {
        Gate::authorize('create', PurchaseOrder::class);

        $validated = $request->validated();

        $pr = PurchaseRequest::where('id', $validated['purchase_request_id'])->first();
        if (! $pr instanceof PurchaseRequest) {
            abort(404);
        }

        if ($pr->status !== 'approved') {
            return back()->withErrors(['purchase_request_id' => 'Purchase Request must be approved before creating a PO.']);
        }

        $poNumber = 'PO-'.now()->format('Ymd').'-'.str_pad(
            strval(PurchaseOrder::whereDate('created_at', today())->count() + 1),
            4,
            '0',
            STR_PAD_LEFT,
        );

        $po = PurchaseOrder::create([
            'purchase_request_id' => $pr->id,
            'po_number' => $poNumber,
            'supplier_id' => $validated['supplier_id'],
            'po_date' => $validated['po_date'],
            'delivery_date' => $validated['delivery_date'] ?? null,
            'status' => 'draft',
        ]);

        foreach ($validated['items'] as $item) {
            $po->items()->create($item);
        }

        // Mark PR as ordered
        $pr->update(['status' => 'ordered']);

        return back()->with('success', 'Purchase Order created successfully.');
    }

    /**
     * Update a draft purchase order.
     */
    public function update(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
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

        $purchaseOrder->update([
            'supplier_id' => $validated['supplier_id'],
            'po_date' => $validated['po_date'],
            'delivery_date' => $validated['delivery_date'] ?? null,
        ]);

        $purchaseOrder->items()->delete();
        foreach ($validated['items'] as $item) {
            $purchaseOrder->items()->create($item);
        }

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
}
