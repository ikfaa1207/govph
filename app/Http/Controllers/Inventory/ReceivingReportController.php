<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\ReceivingReport;
use App\Models\ReceivingReportItem;
use App\Models\Supplier;
use App\Services\Audit\AuditLogger;
use App\Services\Valuation\ValuationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReceivingReportController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(protected ValuationService $valuationService) {}

    /**
     * Display a listing of the receiving reports.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('warehouse.receive');

        $reports = ReceivingReport::with([
            'purchaseOrder.supplier',
            'receiver',
            'inspector',
            'items.item.unit',
        ])->orderBy('id', 'desc')->paginate(15)->through(function ($report) {
            $mappedItems = [];
            foreach ($report->items as $item) {
                $mappedItems[] = [
                    'id' => $item->id,
                    'name' => $item->item?->name,
                    'unit' => $item->item?->unit?->abbreviation,
                    'quantity_received' => $item->quantity_received,
                    'quantity_accepted' => $item->quantity_accepted,
                    'quantity_rejected' => $item->quantity_rejected,
                    'unit_cost' => $item->unit_cost,
                    'batch_number' => $item->batch_number,
                    'expiration_date' => $item->expiration_date,
                    'rejection_reason' => $item->rejection_reason,
                ];
            }

            return [
                'id' => $report->id,
                'iar_number' => $report->iar_number,
                'invoice_number' => $report->invoice_number,
                'delivery_receipt_number' => $report->delivery_receipt_number,
                'received_date' => $report->received_date,
                'purchase_order' => [
                    'po_number' => $report->purchaseOrder?->po_number,
                    'supplier_name' => $report->purchaseOrder?->supplier?->name,
                ],
                'receiver_name' => $report->receiver?->name,
                'inspector_name' => $report->inspector?->name,
                'items_count' => $report->items->count(),
                'remarks' => $report->remarks,
                'items' => $mappedItems,
            ];
        });

        $stats = [
            'total_reports' => ReceivingReport::count(),
            'recent_deliveries' => ReceivingReport::where('received_date', '>=', now()->subDays(30))->count(),
            'total_items_received' => \App\Models\ReceivingReportItem::sum('quantity_received'),
            'total_items_rejected' => \App\Models\ReceivingReportItem::sum('quantity_rejected'),
        ];

        $receivers = Employee::whereHas('user.roles', function ($query) {
            $query->whereIn('name', ['Supply Officer', 'Property Custodian']);
        })->get();

        $inspectors = Employee::whereHas('user.roles', function ($query) {
            $query->where('name', 'Inspection Officer');
        })->get();

        // If no specific inspectors are set up yet in the system, we should allow any employee who is NOT a receiver as a fallback for the demo, 
        // but since we want strict enforcement, we pass the inspectors list. 
        if ($inspectors->isEmpty()) {
            // Fallback for development/testing if no one has the role yet
            $inspectors = Employee::whereNotIn('id', $receivers->pluck('id'))->get();
        }

        return Inertia::render('inventory/receiving/index', [
            'reports' => $reports,
            'stats' => $stats,
            'suppliers' => Supplier::all(),
            'receivers' => $receivers,
            'inspectors' => $inspectors,
            'items' => Item::with('unit')->where('status', 'active')->get(),
        ]);
    }

    /**
     * Store a newly created receiving report in database.
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('warehouse.receive');

        $validated = $request->validate([
            'po_number' => ['required', 'string', 'max:255'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'po_date' => ['required', 'date'],
            'iar_number' => ['required', 'string', 'max:255', 'unique:receiving_reports,iar_number'],
            'invoice_number' => ['nullable', 'string', 'max:255'],
            'delivery_receipt_number' => ['required', 'string', 'max:255'],
            'received_date' => ['required', 'date'],
            'received_by' => ['required', 'exists:employees,id'],
            'inspected_by' => ['required', 'exists:employees,id', 'different:received_by'],
            'remarks' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'exists:items,id'],
            'items.*.quantity_received' => ['required', 'integer', 'min:1'],
            'items.*.quantity_accepted' => ['required', 'integer', 'min:0'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.batch_number' => ['nullable', 'string', 'max:255'],
            'items.*.expiration_date' => ['nullable', 'date'],
            'items.*.rejection_reason' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($validated) {
            // Find or create Purchase Order
            $po = PurchaseOrder::firstOrCreate(
                ['po_number' => $validated['po_number']],
                [
                    'supplier_id' => $validated['supplier_id'],
                    'po_date' => $validated['po_date'],
                    'status' => 'received',
                ]
            );

            // Create Receiving Report
            $receivingReport = ReceivingReport::create([
                'purchase_order_id' => $po->id,
                'iar_number' => $validated['iar_number'],
                'invoice_number' => $validated['invoice_number'],
                'delivery_receipt_number' => $validated['delivery_receipt_number'],
                'received_date' => $validated['received_date'],
                'received_by' => $validated['received_by'],
                'inspected_by' => $validated['inspected_by'],
                'remarks' => $validated['remarks'],
            ]);

            // Add items and update inventory stock and moving average costs
            foreach ($validated['items'] as $itemData) {
                $itemId = $itemData['item_id'];
                $item = Item::where('id', $itemId)->firstOrFail();

                $receivedQty = (int) $itemData['quantity_received'];
                $acceptedQty = (int) $itemData['quantity_accepted'];
                $rejectedQty = max(0, $receivedQty - $acceptedQty);
                $unitCost = (float) $itemData['unit_cost'];

                // Create receiving report item line record
                ReceivingReportItem::create([
                    'receiving_report_id' => $receivingReport->id,
                    'item_id' => $itemId,
                    'quantity_received' => $receivedQty,
                    'quantity_accepted' => $acceptedQty,
                    'quantity_rejected' => $rejectedQty,
                    'unit_cost' => $unitCost,
                    'batch_number' => $itemData['batch_number'] ?? null,
                    'expiration_date' => $itemData['expiration_date'] ?? null,
                    'rejection_reason' => $itemData['rejection_reason'] ?? null,
                ]);

                // Record stock in for accepted quantities
                if ($acceptedQty > 0) {
                    $this->valuationService->recordStockIn(
                        $item,
                        $acceptedQty,
                        $unitCost,
                        ReceivingReport::class,
                        $receivingReport->id,
                        "Received via IAR #{$receivingReport->iar_number}"
                    );
                }
            }

            // Log creating receiving report in audit log
            AuditLogger::log('CREATE_RECEIVING_REPORT', $receivingReport, null, $receivingReport->toArray());
        });

        return redirect()->back()->with('success', 'Receiving report created and stock updated successfully.');
    }

    /**
     * Update an existing receiving report.
     */
    public function update(Request $request, ReceivingReport $report): RedirectResponse
    {
        Gate::authorize('warehouse.receive');

        $validated = $request->validate([
            'po_number' => ['required', 'string', 'max:255'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'po_date' => ['required', 'date'],
            'iar_number' => ['required', 'string', 'max:255', 'unique:receiving_reports,iar_number,' . $report->id],
            'invoice_number' => ['nullable', 'string', 'max:255'],
            'delivery_receipt_number' => ['required', 'string', 'max:255'],
            'received_date' => ['required', 'date'],
            'received_by' => ['required', 'exists:employees,id'],
            'inspected_by' => ['required', 'exists:employees,id', 'different:received_by'],
            'remarks' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'integer'], // track existing items
            'items.*.item_id' => ['required', 'exists:items,id'],
            'items.*.quantity_received' => ['required', 'integer', 'min:1'],
            'items.*.quantity_accepted' => ['required', 'integer', 'min:0'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.batch_number' => ['nullable', 'string', 'max:255'],
            'items.*.expiration_date' => ['nullable', 'date'],
            'items.*.rejection_reason' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($validated, $report) {
            // Load relations for accurate old state tracking
            $report->load('items');
            $oldState = $report->toArray();

            // Find or update Purchase Order (we won't overwrite existing POs fully, just ensure it exists)
            $po = PurchaseOrder::firstOrCreate(
                ['po_number' => $validated['po_number']],
                [
                    'supplier_id' => $validated['supplier_id'],
                    'po_date' => $validated['po_date'],
                    'status' => 'received',
                ]
            );

            // Update Report Details
            $report->update([
                'purchase_order_id' => $po->id,
                'iar_number' => $validated['iar_number'],
                'invoice_number' => $validated['invoice_number'],
                'delivery_receipt_number' => $validated['delivery_receipt_number'],
                'received_date' => $validated['received_date'],
                'received_by' => $validated['received_by'],
                'inspected_by' => $validated['inspected_by'],
                'remarks' => $validated['remarks'],
            ]);

            // Track IDs from the payload to delete missing items
            $payloadItemIds = collect($validated['items'])->pluck('id')->filter()->toArray();

            // Handle deleted items: reverse stock and delete
            foreach ($report->items as $existingItem) {
                if (!in_array($existingItem->id, $payloadItemIds)) {
                    if ($existingItem->quantity_accepted > 0) {
                        $item = Item::findOrFail($existingItem->item_id);
                        $this->valuationService->reverseStockIn(
                            $item,
                            $existingItem->quantity_accepted,
                            $existingItem->unit_cost,
                            ReceivingReport::class,
                            $report->id,
                            "Reversed via Edit IAR #{$report->iar_number}"
                        );
                    }
                    $existingItem->delete();
                }
            }

            // Process payload items
            foreach ($validated['items'] as $itemData) {
                $itemId = $itemData['item_id'];
                $item = Item::findOrFail($itemId);

                $receivedQty = (int) $itemData['quantity_received'];
                $acceptedQty = (int) $itemData['quantity_accepted'];
                $rejectedQty = max(0, $receivedQty - $acceptedQty);
                $unitCost = (float) $itemData['unit_cost'];

                if (isset($itemData['id'])) {
                    // Updating an existing item
                    $existingLine = ReceivingReportItem::findOrFail($itemData['id']);
                    
                    // Reverse old stock-in
                    if ($existingLine->quantity_accepted > 0) {
                        $this->valuationService->reverseStockIn(
                            $item,
                            $existingLine->quantity_accepted,
                            $existingLine->unit_cost,
                            ReceivingReport::class,
                            $report->id,
                            "Reversed (Update) via IAR #{$report->iar_number}"
                        );
                    }

                    // Update record
                    $existingLine->update([
                        'item_id' => $itemId,
                        'quantity_received' => $receivedQty,
                        'quantity_accepted' => $acceptedQty,
                        'quantity_rejected' => $rejectedQty,
                        'unit_cost' => $unitCost,
                        'batch_number' => $itemData['batch_number'] ?? null,
                        'expiration_date' => $itemData['expiration_date'] ?? null,
                        'rejection_reason' => $itemData['rejection_reason'] ?? null,
                    ]);

                } else {
                    // Creating new item line
                    ReceivingReportItem::create([
                        'receiving_report_id' => $report->id,
                        'item_id' => $itemId,
                        'quantity_received' => $receivedQty,
                        'quantity_accepted' => $acceptedQty,
                        'quantity_rejected' => $rejectedQty,
                        'unit_cost' => $unitCost,
                        'batch_number' => $itemData['batch_number'] ?? null,
                        'expiration_date' => $itemData['expiration_date'] ?? null,
                        'rejection_reason' => $itemData['rejection_reason'] ?? null,
                    ]);
                }

                // Apply new stock-in
                if ($acceptedQty > 0) {
                    $this->valuationService->recordStockIn(
                        $item,
                        $acceptedQty,
                        $unitCost,
                        ReceivingReport::class,
                        $report->id,
                        "Received via Edit IAR #{$report->iar_number}"
                    );
                }
            }

            // Refresh to get latest items for new state
            $report->refresh();
            $report->load('items');
            $newState = $report->toArray();

            // Log update
            AuditLogger::log('UPDATE_RECEIVING_REPORT', $report, $oldState, $newState);
        });

        return redirect()->back()->with('success', 'Receiving report updated successfully.');
    }

    /**
     * Get the audit history for a specific receiving report.
     */
    public function history(ReceivingReport $report)
    {
        Gate::authorize('warehouse.receive');
        
        $history = \App\Models\AuditLog::with('user')
            ->where('model_type', get_class($report))
            ->where('model_id', $report->id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($history);
    }
}
