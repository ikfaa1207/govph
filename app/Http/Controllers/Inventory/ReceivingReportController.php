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

        $reports = [];
        foreach (ReceivingReport::with([
            'purchaseOrder.supplier',
            'receiver',
            'inspector',
            'items.item.unit',
        ])->orderBy('id', 'desc')->get() as $report) {
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

            $reports[] = [
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
        }

        return Inertia::render('inventory/receiving/index', [
            'reports' => $reports,
            'suppliers' => Supplier::all(),
            'employees' => Employee::all(),
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
            'inspected_by' => ['required', 'exists:employees,id'],
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
}
