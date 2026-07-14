<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePurchaseRequestRequest;
use App\Models\Department;
use App\Models\Item;
use App\Models\PurchaseRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseRequestController extends Controller
{
    /**
     * Display a listing of purchase requests.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', PurchaseRequest::class);

        $query = PurchaseRequest::with(['requester.department', 'department', 'approver', 'items.item.unit']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('pr_number', 'like', "%{$search}%")
                    ->orWhere('purpose', 'like', "%{$search}%")
                    ->orWhereHas('requester', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $purchaseRequests = $query->orderBy('id', 'desc')->paginate(15);

        $counts = PurchaseRequest::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $stats = [
            'total' => array_sum($counts),
            'pending' => $counts['pending'] ?? 0,
            'approved' => $counts['approved'] ?? 0,
            'ordered' => $counts['ordered'] ?? 0,
            'rejected' => $counts['rejected'] ?? 0,
        ];

        $allItems = Item::where('status', 'active')
            ->with('unit')
            ->get()
            ->map(fn (Item $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'unit' => $item->unit->abbreviation ?? 'pcs',
                'unit_cost' => $item->unit_cost,
            ]);

        return Inertia::render('inventory/purchase-requests/index', [
            'purchaseRequests' => $purchaseRequests,
            'stats' => $stats,
            'items' => $allItems,
            'departments' => Department::all(),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Store a newly created purchase request.
     */
    public function store(StorePurchaseRequestRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $employee = $user->getEmployeeOrAbort('You must have an employee profile to create purchase requests.');

        $validated = $request->validated();

        $prNumber = 'PR-'.now()->format('Ymd').'-'.str_pad(
            strval(PurchaseRequest::whereDate('created_at', today())->count() + 1),
            4,
            '0',
            STR_PAD_LEFT,
        );

        $pr = PurchaseRequest::create([
            'pr_number' => $prNumber,
            'requested_by' => $employee->id,
            'department_id' => $validated['department_id'],
            'purpose' => $validated['purpose'],
            'status' => 'pending',
        ]);

        foreach ($validated['items'] as $item) {
            $pr->items()->create($item);
        }

        return back()->with('success', 'Purchase Request submitted successfully.');
    }

    /**
     * Approve a pending purchase request.
     */
    public function approve(PurchaseRequest $purchaseRequest): RedirectResponse
    {
        Gate::authorize('approve', $purchaseRequest);

        $purchaseRequest->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
        ]);

        return back()->with('success', 'Purchase Request approved successfully.');
    }

    /**
     * Reject a pending purchase request.
     */
    public function reject(Request $request, PurchaseRequest $purchaseRequest): RedirectResponse
    {
        Gate::authorize('reject', $purchaseRequest);

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $purchaseRequest->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return back()->with('success', 'Purchase Request rejected.');
    }
}
