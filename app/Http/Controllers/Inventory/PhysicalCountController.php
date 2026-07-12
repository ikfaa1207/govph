<?php

namespace App\Http\Controllers\Inventory;

use App\Enums\PhysicalCountStatus;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Item;
use App\Models\PhysicalCount;
use App\Models\PhysicalCountCommittee;
use App\Models\PhysicalCountItem;
use App\Models\Property;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PhysicalCountController extends Controller
{
    public function index(): Response
    {
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
        $request->validate([
            'type' => ['required', 'in:RPCPPE,RPCI'],
            'as_of_date' => ['required', 'date'],
            'chairperson_id' => ['required', 'exists:employees,id'],
            'head_of_agency_id' => ['required', 'exists:employees,id'],
            'member_ids' => ['required', 'array', 'min:1'],
            'member_ids.*' => ['exists:employees,id'],
        ]);

        $user = Auth::user();
        $employee = $user->getEmployeeOrAbort('Employee profile not found.');

        DB::beginTransaction();
        try {
            $count = PhysicalCount::create([
                'type' => $request->type,
                'as_of_date' => $request->as_of_date,
                'status' => PhysicalCountStatus::Draft,
                'created_by' => $employee->id,
            ]);

            $count->committees()->create([
                'employee_id' => $request->input('chairperson_id'),
                'role' => 'chairperson',
            ]);

            $count->committees()->create([
                'employee_id' => $request->input('head_of_agency_id'),
                'role' => 'head_of_agency',
            ]);

            foreach ($request->input('member_ids') as $memberId) {
                $count->committees()->create([
                    'employee_id' => $memberId,
                    'role' => 'member',
                ]);
            }

            if ($count->type === 'RPCPPE') {
                $properties = Property::where('status', '!=', 'disposed')->get();
                $itemsToInsert = [];
                foreach ($properties as $property) {
                    $itemsToInsert[] = [
                        'physical_count_id' => $count->id,
                        'property_id' => $property->id,
                        'item_id' => null,
                        'recorded_qty' => 1,
                        'actual_qty' => null,
                        'shortage_qty' => null,
                        'overage_qty' => null,
                        'remarks' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                PhysicalCountItem::insert($itemsToInsert);
            } else {
                $items = Item::all();
                // For RPCI, the quantity is the sum of stock across departments, or just a 0 if we don't track total stock easily in one column. Let's assume we sum current_stock from department_items.
                // Wait, govph uses `department_items` for consumable stock per department, and maybe `StockTransaction` for central.
                // For simplicity, let's just create an entry per Item.
                $itemsToInsert = [];
                foreach ($items as $item) {
                    $totalStock = DB::table('department_items')->where('item_id', $item->id)->sum('current_stock') ?: 0;
                    $itemsToInsert[] = [
                        'physical_count_id' => $count->id,
                        'property_id' => null,
                        'item_id' => $item->id,
                        'recorded_qty' => $totalStock,
                        'actual_qty' => null,
                        'shortage_qty' => null,
                        'overage_qty' => null,
                        'remarks' => null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                PhysicalCountItem::insert($itemsToInsert);
            }

            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Physical count initiated.']);

            return redirect()->route('inventory.physical-counts.show', $count);
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()->withErrors(['error' => 'Failed to initiate count: '.$e->getMessage()]);
        }
    }

    public function show(PhysicalCount $physicalCount): Response
    {
        $user = Auth::user();
        $employee = $user?->employee;

        if (! $user->hasPermissionTo('reports.view')) {
            $isCreator = $employee && $physicalCount->created_by === $employee->id;
            $isCommitteeMember = $employee &&
                                 in_array($physicalCount->status, [PhysicalCountStatus::PendingReview, PhysicalCountStatus::Finalized]) &&
                                 $physicalCount->committees()->where('employee_id', $employee->id)->exists();

            if (! $isCreator && ! $isCommitteeMember) {
                abort(403, 'Unauthorized action.');
            }
        }

        $physicalCount->load(['creator', 'items.property.category', 'items.item.category', 'committees.employee']);

        $employees = Employee::orderBy('name')->get(['id', 'name', 'position', 'user_id']);

        return Inertia::render('inventory/physical-counts/show', [
            'physicalCount' => $physicalCount,
            'employees' => $employees,
        ]);
    }

    public function update(Request $request, PhysicalCount $physicalCount): RedirectResponse
    {
        $user = Auth::user();
        $employee = $user?->employee;

        if (! $user->hasPermissionTo('reports.view')) {
            $isCreator = $employee && $physicalCount->created_by === $employee->id;
            if (! $isCreator) {
                abort(403, 'Unauthorized action.');
            }
        }

        if ($physicalCount->status !== PhysicalCountStatus::Draft) {
            return redirect()->back()->withErrors(['error' => 'Cannot update a finalized count.']);
        }

        $request->validate([
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

        DB::beginTransaction();
        try {
            foreach ($request->input('items') as $itemData) {
                $countItem = PhysicalCountItem::where('id', $itemData['id'])
                    ->where('physical_count_id', $physicalCount->id)
                    ->first();

                if ($countItem) {
                    $actualQty = $itemData['actual_qty'];
                    if ($actualQty !== null && $actualQty !== '') {
                        $actualQty = (float) $actualQty;
                        $recordedQty = (float) $countItem->recorded_qty;

                        $countItem->actual_qty = $actualQty;
                        if ($actualQty < $recordedQty) {
                            $countItem->shortage_qty = $recordedQty - $actualQty;
                            $countItem->overage_qty = 0;
                        } elseif ($actualQty > $recordedQty) {
                            $countItem->overage_qty = $actualQty - $recordedQty;
                            $countItem->shortage_qty = 0;
                        } else {
                            $countItem->shortage_qty = 0;
                            $countItem->overage_qty = 0;
                        }
                    } else {
                        $countItem->actual_qty = null;
                        $countItem->shortage_qty = null;
                        $countItem->overage_qty = null;
                    }

                    $countItem->remarks = $itemData['remarks'] ?? null;
                    $countItem->save();
                }
            }

            if ($request->input('action') === 'submit_for_review') {
                $physicalCount->status = PhysicalCountStatus::PendingReview;
                $physicalCount->save();

                // Reset committee approval statuses for the new review cycle
                $physicalCount->committees()->update([
                    'status' => 'pending',
                    'remarks' => null,
                    'approved_at' => null,
                ]);

                DB::commit();
                Inertia::flash('toast', ['type' => 'success', 'message' => 'Physical count submitted for committee review.']);

                return redirect()->route('inventory.physical-counts.index');
            }

            DB::commit();
            Inertia::flash('toast', ['type' => 'success', 'message' => 'Physical count progress saved.']);

            return redirect()->back();
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()->withErrors(['error' => 'Failed to save count: '.$e->getMessage()]);
        }
    }

    public function approve(Request $request, PhysicalCount $physicalCount): RedirectResponse
    {
        if ($physicalCount->status !== PhysicalCountStatus::PendingReview) {
            return redirect()->back()->withErrors(['error' => 'This count is not pending review.']);
        }

        $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'remarks' => ['nullable', 'string'],
        ]);

        $user = Auth::user();
        $employee = $user->getEmployeeOrAbort('Employee profile not found.');

        /** @var PhysicalCountCommittee|null $committee */
        $committee = $physicalCount->committees()->where('employee_id', $employee->id)->first();

        if (! $committee) {
            return redirect()->back()->withErrors(['error' => 'You are not assigned to this committee.']);
        }

        $committee->update([
            'status' => $request->input('status'),
            'remarks' => $request->input('remarks'),
            'approved_at' => now(),
        ]);

        if ($request->input('status') === 'approved') {
            $allApproved = $physicalCount->committees()->where('status', '!=', 'approved')->doesntExist();
            if ($allApproved) {
                $physicalCount->update(['status' => PhysicalCountStatus::Finalized]);
            }
        } else {
            // If rejected, return to draft so creator can fix it
            $physicalCount->update(['status' => PhysicalCountStatus::Draft]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your review has been submitted.']);

        return redirect()->back();
    }

    public function export(PhysicalCount $physicalCount): StreamedResponse
    {
        $user = Auth::user();
        $employee = $user?->employee;

        if (! $user->hasPermissionTo('reports.view')) {
            $isCreator = $employee && $physicalCount->created_by === $employee->id;
            $isCommitteeMember = $employee &&
                                 in_array($physicalCount->status, [PhysicalCountStatus::PendingReview, PhysicalCountStatus::Finalized]) &&
                                 $physicalCount->committees()->where('employee_id', $employee->id)->exists();

            if (! $isCreator && ! $isCommitteeMember) {
                abort(403, 'Unauthorized action.');
            }
        }

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
                        $item->remarks,
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
        $user = Auth::user();
        $employee = $user?->employee;

        if ($physicalCount->status !== PhysicalCountStatus::Draft) {
            return redirect()->back()->withErrors(['error' => 'Only draft physical counts can be deleted.']);
        }

        $isCreator = $employee && $physicalCount->created_by === $employee->id;
        $isAuthorized = $user->hasPermissionTo('reports.view') || $isCreator;

        if (! $isAuthorized) {
            abort(403, 'Unauthorized action.');
        }

        $physicalCount->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Physical count deleted successfully.']);

        return redirect()->route('inventory.physical-counts.index');
    }
}
