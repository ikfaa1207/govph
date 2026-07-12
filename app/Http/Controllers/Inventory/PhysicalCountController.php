<?php

namespace App\Http\Controllers\Inventory;

use App\Actions\PhysicalCount\ApprovePhysicalCountAction;
use App\Actions\PhysicalCount\CreatePhysicalCountAction;
use App\Actions\PhysicalCount\UpdatePhysicalCountAction;
use App\Enums\PhysicalCountStatus;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Item;
use App\Models\PhysicalCount;
use App\Models\PhysicalCountItem;
use App\Models\Property;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PhysicalCountController extends Controller
{
    public function __construct(
        protected CreatePhysicalCountAction $createAction,
        protected UpdatePhysicalCountAction $updateAction,
        protected ApprovePhysicalCountAction $approveAction
    ) {}

    public function index(): Response
    {
        Gate::authorize('physical-count.viewAny');

        $user = Auth::user();
        $employee = $user?->employee;

        $query = PhysicalCount::with('creator');

        if (! $user->hasPermissionTo('reports.view') && $employee) {
            $query->where(function ($q) use ($employee) {
                $q->where('created_by', $employee->id)
                    ->orWhere(function ($q2) use ($employee) {
                        $q2->whereIn('status', [PhysicalCountStatus::PendingReview, PhysicalCountStatus::Finalized])
                            ->whereHas('committees', function ($sub) use ($employee) {
                                $sub->where('employee_id', $employee->id);
                            });
                    });
            });
        }

        $counts = $query->latest()->paginate(15);
        $employees = Employee::orderBy('name')->get(['id', 'name', 'position', 'user_id']);

        return Inertia::render('inventory/physical-counts/index', [
            'counts' => $counts,
            'employees' => $employees,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('physical-count.create');

        $validated = $request->validate([
            'type' => ['required', 'in:RPCPPE,RPCI'],
            'as_of_date' => ['required', 'date'],
            'chairperson_id' => ['required', 'exists:employees,id'],
            'head_of_agency_id' => ['required', 'exists:employees,id'],
            'member_ids' => ['required', 'array', 'min:1'],
            'member_ids.*' => ['exists:employees,id'],
            'coa_representative_id' => ['nullable', 'exists:employees,id'],
            'coa_representative_absent_reason' => ['nullable', 'string', 'max:500'],
        ]);

        if (empty($validated['coa_representative_id']) && empty($validated['coa_representative_absent_reason'])) {
            return redirect()->back()->withErrors([
                'coa_representative_absent_reason' => 'A COA Representative is required, or a documented reason for their absence must be provided.',
            ])->withInput();
        }

        $user = Auth::user();
        $employee = $user->getEmployeeOrAbort('Employee profile not found.');

        try {
            $count = $this->createAction->execute($employee, $validated);
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Physical count initiated.']);

            return redirect()->route('inventory.physical-counts.show', $count);
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to initiate count: '.$e->getMessage()]);
        }
    }

    public function show(PhysicalCount $physicalCount): Response
    {
        Gate::authorize('physical-count.view', $physicalCount);

        $physicalCount->load(['creator', 'items.property.category', 'items.item.category', 'committees.employee']);

        $employees = Employee::orderBy('name')->get(['id', 'name', 'position', 'user_id']);

        return Inertia::render('inventory/physical-counts/show', [
            'physicalCount' => $physicalCount,
            'employees' => $employees,
        ]);
    }

    public function update(Request $request, PhysicalCount $physicalCount): RedirectResponse
    {
        Gate::authorize('physical-count.update', $physicalCount);

        if ($physicalCount->status !== PhysicalCountStatus::Draft) {
            return redirect()->back()->withErrors(['error' => 'Cannot update a finalized count.']);
        }

        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'exists:physical_count_items,id'],
            'items.*.actual_qty' => ['nullable', 'numeric', 'min:0'],
            'items.*.remarks' => ['nullable', 'string'],
        ]);

        if ($request->input('action') === 'submit_for_review') {
            $items = $request->input('items', []);
            if (empty($items)) {
                return redirect()->back()->withErrors(['error' => 'Cannot submit a physical count with no items.']);
            }

            $hasQty = false;
            foreach ($items as $item) {
                if (isset($item['actual_qty']) && $item['actual_qty'] !== '') {
                    $hasQty = true;
                    break;
                }
            }

            if (! $hasQty) {
                return redirect()->back()->withErrors(['error' => 'Cannot submit for review when all actual quantities are blank. Please encode at least one quantity.']);
            }
        }

        try {
            $this->updateAction->execute($physicalCount, [
                'items' => $validated['items'],
                'action' => $request->input('action'),
            ]);

            if ($request->input('action') === 'submit_for_review') {
                Inertia::flash('toast', ['type' => 'success', 'message' => 'Physical count submitted for committee review.']);

                return redirect()->route('inventory.physical-counts.index');
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Physical count progress saved.']);

            return redirect()->back();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to save count: '.$e->getMessage()]);
        }
    }

    public function approve(Request $request, PhysicalCount $physicalCount): RedirectResponse
    {
        Gate::authorize('physical-count.review', $physicalCount);

        if ($physicalCount->status !== PhysicalCountStatus::PendingReview) {
            return redirect()->back()->withErrors(['error' => 'This count is not pending review.']);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'remarks' => ['nullable', 'string'],
        ]);

        $user = Auth::user();
        $employee = $user->getEmployeeOrAbort('Employee profile not found.');

        try {
            $this->approveAction->execute($physicalCount, $employee, $validated);
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Your review has been submitted.']);

            return redirect()->back();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function export(PhysicalCount $physicalCount): StreamedResponse
    {
        Gate::authorize('physical-count.view', $physicalCount);

        $physicalCount->load(['creator', 'items.property.category', 'items.item.category', 'items.property.activeAssignment']);

        $fileName = $physicalCount->type.'_'.$physicalCount->as_of_date->format('Y-m-d').'.csv';
        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=$fileName",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($physicalCount) {
            $file = fopen('php://output', 'w');
            if ($file === false) {
                return;
            }

            // Title
            if ($physicalCount->type === 'RPCPPE') {
                fputcsv($file, ['REPORT ON THE PHYSICAL COUNT OF PROPERTY, PLANT AND EQUIPMENT']);
            } else {
                fputcsv($file, ['REPORT ON THE PHYSICAL COUNT OF INVENTORIES']);
            }
            fputcsv($file, ['As of', $physicalCount->as_of_date->format('F d, Y')]);
            fputcsv($file, []);

            if ($physicalCount->type === 'RPCPPE') {
                // RPCPPE Headers
                fputcsv($file, [
                    'Article', 'Description', 'Property Number', 'Unit of Measure', 'Unit Value',
                    'Quantity per Property Card', 'Quantity per Physical Count', 'Shortage Qty', 'Shortage Value',
                    'Overage Qty', 'Overage Value', 'Remarks',
                ]);

                /** @var PhysicalCountItem $item */
                foreach ($physicalCount->items as $item) {
                    /** @var Property|null $prop */
                    $prop = $item->property;
                    if (! $prop) {
                        continue;
                    }

                    $remarks = $item->remarks;
                    $classification = $prop->semi_expendable_classification;
                    if ($classification) {
                        $remarks = trim(($remarks ? $remarks.' ' : '').'['.$classification.']');
                    }

                    fputcsv($file, [
                        $prop->category->name ?? 'Unknown',
                        $prop->model.' '.$prop->brand,
                        $prop->property_number,
                        'Unit',
                        $prop->unit_cost,
                        $item->recorded_qty,
                        $item->actual_qty,
                        $item->shortage_qty,
                        number_format((float) $item->shortage_qty * (float) $prop->unit_cost, 2, '.', ''),
                        $item->overage_qty,
                        number_format((float) $item->overage_qty * (float) $prop->unit_cost, 2, '.', ''),
                        $remarks,
                    ]);
                }
            } else {
                // RPCI Headers
                fputcsv($file, [
                    'Article', 'Description', 'Stock Number', 'Unit of Measure', 'Unit Value',
                    'Quantity per Stock Card', 'Quantity per Physical Count', 'Shortage Qty', 'Shortage Value',
                    'Overage Qty', 'Overage Value', 'Remarks',
                ]);

                /** @var PhysicalCountItem $i */
                foreach ($physicalCount->items as $i) {
                    /** @var Item|null $item */
                    $item = $i->item;
                    if (! $item) {
                        continue;
                    }

                    fputcsv($file, [
                        $item->category->name ?? 'Unknown',
                        $item->name.' - '.$item->description,
                        $item->stock_number,
                        $item->unit->name ?? 'Unit',
                        $item->unit_cost,
                        $i->recorded_qty,
                        $i->actual_qty,
                        $i->shortage_qty,
                        number_format((float) $i->shortage_qty * (float) $item->unit_cost, 2, '.', ''),
                        $i->overage_qty,
                        number_format((float) $i->overage_qty * (float) $item->unit_cost, 2, '.', ''),
                        $i->remarks,
                    ]);
                }
            }

            fputcsv($file, []);
            fputcsv($file, ['Certified Correct by:', '', 'Approved by:', '']);
            fputcsv($file, [$physicalCount->creator->name ?? 'Inventory Committee', '', 'Head of Agency/Authorized Rep', '']);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function destroy(PhysicalCount $physicalCount): RedirectResponse
    {
        Gate::authorize('physical-count.delete', $physicalCount);

        if ($physicalCount->status !== PhysicalCountStatus::Draft) {
            return redirect()->back()->withErrors(['error' => 'Only draft physical counts can be deleted.']);
        }

        $physicalCount->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Physical count deleted successfully.']);

        return redirect()->route('inventory.physical-counts.index');
    }
}
