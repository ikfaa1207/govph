<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\ReceivingReport\CreateReceivingReportAction;
use App\Actions\ReceivingReport\UpdateReceivingReportAction;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Item;
use App\Models\ReceivingReport;
use App\Models\ReceivingReportItem;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
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

        $status = $request->input('status', 'finalized');

        $validated = $request->validate([
            'status' => ['nullable', 'in:draft,finalized'],
            'po_number' => ['required', 'string', 'max:255'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'po_date' => ['required', 'date'],
            'iar_number' => [
                $status === 'finalized' ? 'required' : 'nullable',
                'string',
                'max:255',
                'unique:receiving_reports,iar_number',
            ],
            'invoice_number' => ['nullable', 'string', 'max:255'],
            'delivery_receipt_number' => [$status === 'finalized' ? 'required' : 'nullable', 'string', 'max:255'],
            'received_date' => [$status === 'finalized' ? 'required' : 'nullable', 'date'],
            'received_by' => [$status === 'finalized' ? 'required' : 'nullable', 'exists:employees,id'],
            'inspected_by' => [
                $status === 'finalized' ? 'required' : 'nullable',
                'exists:employees,id',
                $status === 'finalized' ? 'different:received_by' : '',
            ],
            'remarks' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'exists:items,id'],
            'items.*.quantity_received' => ['required', 'integer', 'min:1'],
            'items.*.quantity_accepted' => [
                $status === 'finalized' ? 'required' : 'nullable',
                'integer',
                'min:0',
                function (string $attribute, mixed $value, \Closure $fail) use ($request) {
                    preg_match('/items\.(\d+)\.quantity_accepted/', $attribute, $matches);
                    if (! isset($matches[1])) {
                        return;
                    }
                    $index = $matches[1];
                    $receivedQty = (int) $request->input("items.{$index}.quantity_received");
                    if ($value > $receivedQty) {
                        $fail("The accepted quantity cannot exceed the received quantity ({$receivedQty}).");
                    }
                },
            ],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.batch_number' => ['nullable', 'string', 'max:255'],
            'items.*.expiration_date' => ['nullable', 'date'],
            'items.*.rejection_reason' => ['nullable', 'string'],
        ]);

        try {
            $this->createAction->execute($validated);

            return redirect()->back()->with('success', $status === 'finalized' ? 'Receiving report created and stock updated successfully.' : 'Receiving report draft saved successfully.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to create receiving report: '.$e->getMessage()]);
        }
    }

    /**
     * Update an existing receiving report.
     */
    public function update(Request $request, ReceivingReport $report): RedirectResponse
    {
        Gate::authorize('warehouse.receive');

        $status = $request->input('status', 'finalized');

        if ($report->status === 'finalized' && $status === 'draft') {
            return redirect()->back()->withErrors([
                'status' => 'A finalized receiving report cannot be reverted to draft.',
            ]);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'in:draft,finalized'],
            'po_number' => ['required', 'string', 'max:255'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'po_date' => ['required', 'date'],
            'iar_number' => [
                $status === 'finalized' ? 'required' : 'nullable',
                'string',
                'max:255',
                'unique:receiving_reports,iar_number,'.$report->id,
            ],
            'invoice_number' => ['nullable', 'string', 'max:255'],
            'delivery_receipt_number' => [$status === 'finalized' ? 'required' : 'nullable', 'string', 'max:255'],
            'received_date' => [$status === 'finalized' ? 'required' : 'nullable', 'date'],
            'received_by' => [$status === 'finalized' ? 'required' : 'nullable', 'exists:employees,id'],
            'inspected_by' => [
                $status === 'finalized' ? 'required' : 'nullable',
                'exists:employees,id',
                $status === 'finalized' ? 'different:received_by' : '',
            ],
            'remarks' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['nullable', 'integer'], // track existing items
            'items.*.item_id' => ['required', 'exists:items,id'],
            'items.*.quantity_received' => ['required', 'integer', 'min:1'],
            'items.*.quantity_accepted' => [
                $status === 'finalized' ? 'required' : 'nullable',
                'integer',
                'min:0',
                function (string $attribute, mixed $value, \Closure $fail) use ($request) {
                    preg_match('/items\.(\d+)\.quantity_accepted/', $attribute, $matches);
                    if (! isset($matches[1])) {
                        return;
                    }
                    $index = $matches[1];
                    $receivedQty = (int) $request->input("items.{$index}.quantity_received");
                    if ($value > $receivedQty) {
                        $fail("The accepted quantity cannot exceed the received quantity ({$receivedQty}).");
                    }
                },
            ],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'items.*.batch_number' => ['nullable', 'string', 'max:255'],
            'items.*.expiration_date' => ['nullable', 'date'],
            'items.*.rejection_reason' => ['nullable', 'string'],
        ]);

        try {
            $this->updateAction->execute($report, $validated);

            return redirect()->back()->with('success', 'Receiving report updated successfully.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to update receiving report: '.$e->getMessage()]);
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
