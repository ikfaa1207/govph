<?php

namespace App\Http\Controllers\Inventory;

use App\Enums\ItemStatus;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Issuance;
use App\Models\Item;
use App\Models\Location;
use App\Models\ReceivingReport;
use App\Models\Unit;
use App\Models\Warehouse;
use App\Services\Audit\AuditLogger;
use App\Services\DocumentSequenceService;
use App\Services\Valuation\ValuationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function __construct(
        protected ValuationService $valuationService,
        protected DocumentSequenceService $sequences
    ) {}

    /**
     * Display a listing of items.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('inventory.view');

        $query = Item::with(['category', 'unit', 'location.warehouse']);

        // Search filtering
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('item_code', 'like', "%{$search}%")
                    ->orWhere('stock_number', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        // Stock status filter
        if ($request->filled('stock_status')) {
            $stockStatus = $request->input('stock_status');
            if ($stockStatus === 'low_stock') {
                $query->whereColumn('current_stock', '<=', 'reorder_level')
                    ->where('current_stock', '>', 0);
            } elseif ($stockStatus === 'out_of_stock') {
                $query->where('current_stock', '<=', 0);
            } elseif ($stockStatus === 'in_stock') {
                $query->whereColumn('current_stock', '>', 'reorder_level');
            }
        }

        $items = $query->orderBy('id', 'desc')->paginate(15)->through(function ($item) {
            return [
                'id' => $item->id,
                'item_code' => $item->item_code,
                'stock_number' => $item->stock_number,
                'name' => $item->name,
                'description' => $item->description,
                'category' => $item->category,
                'unit' => $item->unit,
                'unit_cost' => $item->unit_cost,
                'current_stock' => $item->current_stock,
                'reorder_level' => $item->reorder_level,
                'status' => $item->status,
                'location' => $item->location ? $item->location->warehouse->name.' - '.$item->location->code : 'None',
            ];
        });

        // Optimize 5 separate queries into a single aggregate query
        $aggregates = Item::where('status', 'active')->selectRaw('
            count(*) as total_items,
            sum(case when current_stock <= reorder_level and current_stock > 0 then 1 else 0 end) as low_stock,
            sum(case when current_stock <= 0 then 1 else 0 end) as out_of_stock,
            sum(current_stock * unit_cost) as total_value,
            sum(case when created_at >= ? then 1 else 0 end) as recently_added
        ', [now()->subDays(7)])->first();

        $stats = [
            'total_items' => (int) ($aggregates->total_items ?? 0),
            'low_stock' => (int) ($aggregates->low_stock ?? 0),
            'out_of_stock' => (int) ($aggregates->out_of_stock ?? 0),
            'total_value' => (float) ($aggregates->total_value ?? 0),
            'recently_added' => (int) ($aggregates->recently_added ?? 0),
        ];

        return Inertia::render('inventory/items/index', [
            'items' => $items,
            'categories' => Category::all(),
            'units' => Unit::all(),
            'locations' => Location::with('warehouse')->get(),
            'warehouses' => Warehouse::all(),
            'filters' => $request->only(['search', 'category_id', 'stock_status']),
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created item in database.
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'unit_id' => ['required', 'exists:units,id'],
            'reorder_level' => ['required', 'integer', 'min:0'],
            'maximum_stock' => ['required', 'integer', 'min:0'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'stock_number' => ['nullable', 'string', 'unique:items,stock_number'],
            'barcode' => ['nullable', 'string', 'unique:items,barcode'],
            'expiration_date' => ['nullable', 'date'],
        ]);

        // Auto-generate code
        $validated['item_code'] = $this->sequences->next('ITEM');
        $validated['unit_cost'] = 0.00;
        $validated['status'] = 'active';

        $item = Item::create($validated);

        // Audit log
        AuditLogger::log('CREATE_ITEM', $item, null, $item->toArray());

        return redirect()->back()->with('success', 'Item created successfully.');
    }

    /**
     * Show detail details of a single item and its stock transactions card ledger.
     */
    public function show(Item $item): Response
    {
        Gate::authorize('inventory.view');

        $item->load(['category', 'unit', 'location.warehouse']);

        $transactions = $item->stockTransactions()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($tx) {
                // Resolve reference human representation
                $refLabel = 'Manual Entry';
                $ref = $tx->reference;
                if ($tx->reference_type === ReceivingReport::class && $ref instanceof ReceivingReport) {
                    $refLabel = 'Receiving Report #'.$ref->iar_number;
                } elseif ($tx->reference_type === Issuance::class && $ref instanceof Issuance) {
                    $refLabel = 'Issuance Slip #'.$ref->issue_number;
                } elseif ($tx->reference_id) {
                    if ($tx->reference_type === ReceivingReport::class) {
                        $refLabel = 'Receiving Report #'.$tx->reference_id;
                    } elseif ($tx->reference_type === Issuance::class) {
                        $refLabel = 'Issuance Slip #'.$tx->reference_id;
                    }
                }

                return [
                    'id' => $tx->id,
                    'transaction_type' => $tx->transaction_type,
                    'quantity' => $tx->quantity,
                    'unit_cost' => $tx->unit_cost,
                    'reference' => $refLabel,
                    'remarks' => $tx->remarks,
                    'date' => $tx->created_at->format('Y-m-d H:i'),
                ];
            });

        return Inertia::render('inventory/items/show', [
            'item' => [
                'id' => $item->id,
                'item_code' => $item->item_code,
                'stock_number' => $item->stock_number,
                'name' => $item->name,
                'description' => $item->description,
                'category' => $item->category,
                'unit' => $item->unit,
                'unit_cost' => $item->unit_cost,
                'current_stock' => $item->current_stock,
                'reorder_level' => $item->reorder_level,
                'status' => $item->status,
                'location' => $item->location ? $item->location->warehouse->name.' - '.$item->location->code : 'None',
                'location_id' => $item->location_id,
            ],
            'transactions' => $transactions,
        ]);
    }

    /**
     * Update the specified item in storage.
     */
    public function update(Request $request, Item $item): RedirectResponse
    {
        Gate::authorize('inventory.update');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'unit_id' => ['required', 'exists:units,id'],
            'reorder_level' => ['required', 'integer', 'min:0'],
            'maximum_stock' => ['required', 'integer', 'min:0'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'stock_number' => ['nullable', 'string', 'unique:items,stock_number,'.$item->id],
            'barcode' => ['nullable', 'string', 'unique:items,barcode,'.$item->id],
            'expiration_date' => ['nullable', 'date'],
        ]);

        $item->update($validated);

        AuditLogger::log('UPDATE_ITEM', $item, null, $item->toArray());

        return redirect()->back()->with('success', 'Item updated successfully.');
    }

    /**
     * Toggle the status of the specified item.
     */
    public function toggleStatus(Item $item): RedirectResponse
    {
        Gate::authorize('inventory.update');

        $newStatus = $item->status === ItemStatus::Active 
            ? ItemStatus::Inactive 
            : ItemStatus::Active;

        $item->status = $newStatus->value;
        $item->save();

        AuditLogger::log('TOGGLE_ITEM_STATUS', $item, null, $item->toArray());

        $statusText = $newStatus === ItemStatus::Active ? 'activated' : 'deactivated';

        return redirect()->back()->with('success', "Item {$statusText} successfully.");
    }
}
