<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\ReceivingReport\CreateReceivingReportAction;
use App\Actions\ReceivingReport\UpdateReceivingReportAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReceivingReportRequest;
use App\Http\Requests\UpdateReceivingReportRequest;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Item;
use App\Models\PurchaseOrder;
use App\Models\ReceivingReport;
use App\Models\ReceivingReportItem;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ReceivingReportController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected CreateReceivingReportAction $createAction,
        protected UpdateReceivingReportAction $updateAction
    ) {}

    /**
     * Display a listing of the receiving reports.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('warehouse.receive');

        $query = ReceivingReport::with([
            'purchaseOrder.supplier',
            'receiver',
            'inspector',
            'items.item.unit',
        ]);

        // Search filtering
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('iar_number', 'like', "%{$search}%")
                    ->orWhere('invoice_number', 'like', "%{$search}%")
                    ->orWhere('delivery_receipt_number', 'like', "%{$search}%")
                    ->orWhereHas('purchaseOrder', function ($sub) use ($search) {
                        $sub->where('po_number', 'like', "%{$search}%")
                            ->orWhereHas('supplier', function ($sup) use ($search) {
                                $sup->where('name', 'like', "%{$search}%");
                            });
                    });
            });
        }

        // Status filtering
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Supplier filtering
        if ($request->filled('supplier_id')) {
            $query->whereHas('purchaseOrder', function ($q) use ($request) {
                $q->where('supplier_id', $request->input('supplier_id'));
            });
        }

        $reports = $query->orderBy('id', 'desc')->paginate(15)->through(function ($report) {
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
                'status' => $report->status,
                'items' => $mappedItems,
            ];
        });

        $stats = [
            'total_reports' => ReceivingReport::count(),
            'recent_deliveries' => ReceivingReport::where('received_date', '>=', now()->subDays(30))->count(),
            'total_items_received' => ReceivingReportItem::sum('quantity_received'),
            'total_items_rejected' => ReceivingReportItem::sum('quantity_rejected'),
        ];

        $receivers = Employee::whereHas('user.roles', function ($query) {
            $query->whereIn('name', ['Supply Officer', 'Property Custodian']);
        })->get();

        $inspectors = Employee::whereHas('user.roles', function ($query) {
            $query->where('name', 'Inspection Officer');
        })->get();

        // If no specific inspectors are set up yet in the system, we should allow any employee who is NOT a receiver as a fallback for the demo,
        // but since we want strict enforcement, we pass the inspectors list.
        if ($inspectors->isEmpty() && app()->environment('local', 'testing')) {
            // Fallback for development/testing if no one has the role yet
            $inspectors = Employee::whereNotIn('id', $receivers->pluck('id'))->get();
        }

        $pendingPOs = PurchaseOrder::with(['supplier', 'items.item.unit'])
            ->whereIn('status', ['sent', 'partially_received'])
            ->get()
            ->map(function ($po) {
                return [
                    'id' => $po->id,
                    'po_number' => $po->po_number,
                    'supplier_id' => $po->supplier_id,
                    'po_date' => $po->po_date,
                    'items' => array_values(array_filter($po->items->map(function ($item) use ($po) {
                        $totalAccepted = ReceivingReportItem::whereHas('receivingReport', function ($q) use ($po) {
                            $q->where('purchase_order_id', $po->id)->where('status', 'finalized');
                        })->where('item_id', $item->item_id)->sum('quantity_accepted');

                        return [
                            'item_id' => $item->item_id,
                            'quantity_ordered' => $item->quantity,
                            'quantity_accepted' => $totalAccepted,
                            'quantity_remaining' => max(0, $item->quantity - $totalAccepted),
                            'unit_cost' => $item->unit_cost,
                            'item' => [
                                'id' => $item->item->id,
                                'name' => $item->item->name,
                                'unit' => $item->item->unit ? $item->item->unit->abbreviation : null,
                            ],
                        ];
                    })->toArray(), function (array $item) {
                        return $item['quantity_remaining'] > 0;
                    })),
                ];
            });

        return Inertia::render('inventory/receiving/index', [
            'reports' => $reports,
            'stats' => $stats,
            'suppliers' => Supplier::all(),
            'receivers' => $receivers,
            'inspectors' => $inspectors,
            'items' => Item::with('unit')->where('status', 'active')->get(),
            'filters' => $request->only(['search', 'status', 'supplier_id']),
            'pending_purchase_orders' => $pendingPOs,
        ]);
    }

    /**
     * Store a newly created receiving report in database.
     */
    public function store(StoreReceivingReportRequest $request): RedirectResponse
    {
        $status = $request->input('status', 'finalized');
        $validated = $request->validated();

        try {
            $this->createAction->execute($validated);

            return redirect()->back()->with('success', $status === 'finalized' ? 'Receiving report created and stock updated successfully.' : 'Receiving report draft saved successfully.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to create receiving report: '.$e->getMessage(), ['exception' => $e]);

            return redirect()->back()->withErrors(['error' => 'An unexpected error occurred while creating the receiving report. Please try again.']);
        }
    }

    /**
     * Update an existing receiving report.
     */
    public function update(UpdateReceivingReportRequest $request, ReceivingReport $report): RedirectResponse
    {
        $status = $request->input('status', 'finalized');

        if ($report->status === 'finalized' && $status === 'draft') {
            return redirect()->back()->withErrors([
                'status' => 'A finalized receiving report cannot be reverted to draft.',
            ]);
        }

        $validated = $request->validated();

        try {
            $this->updateAction->execute($report, $validated);

            return redirect()->back()->with('success', 'Receiving report updated successfully.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to update receiving report: '.$e->getMessage(), ['exception' => $e]);

            return redirect()->back()->withErrors(['error' => 'An unexpected error occurred while updating the receiving report. Please try again.']);
        }
    }

    /**
     * Get the audit history for a specific receiving report.
     */
    public function history(ReceivingReport $report): JsonResponse
    {
        Gate::authorize('warehouse.receive');

        $history = AuditLog::with('user')
            ->where('model_type', get_class($report))
            ->where('model_id', $report->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($history);
    }
}
