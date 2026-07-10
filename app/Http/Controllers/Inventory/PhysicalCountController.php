<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Item;
use App\Models\PhysicalCount;
use App\Models\PhysicalCountItem;
use App\Models\Property;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PhysicalCountController extends Controller
{
    public function index(): Response
    {
        $counts = PhysicalCount::with('creator')->latest()->paginate(15);
        return Inertia::render('inventory/physical-counts/index', [
            'counts' => $counts
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'type' => ['required', 'in:RPCPPE,RPCI'],
            'as_of_date' => ['required', 'date'],
        ]);

        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();
        if (!$employee) {
            return redirect()->back()->withErrors(['error' => 'Employee profile not found.']);
        }

        DB::beginTransaction();
        try {
            $count = PhysicalCount::create([
                'type' => $request->type,
                'as_of_date' => $request->as_of_date,
                'status' => 'draft',
                'created_by' => $employee->id,
            ]);

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
            return redirect()->route('inventory.physical-counts.show', $count)->with('success', 'Physical count initiated.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Failed to initiate count: ' . $e->getMessage()]);
        }
    }

    public function show(PhysicalCount $physicalCount): Response
    {
        $physicalCount->load(['creator', 'items.property.category', 'items.item.category']);
        
        return Inertia::render('inventory/physical-counts/show', [
            'physicalCount' => $physicalCount
        ]);
    }

    public function update(Request $request, PhysicalCount $physicalCount): RedirectResponse
    {
        if ($physicalCount->status !== 'draft') {
            return redirect()->back()->withErrors(['error' => 'Cannot update a finalized count.']);
        }

        $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'exists:physical_count_items,id'],
            'items.*.actual_qty' => ['nullable', 'numeric', 'min:0'],
            'items.*.remarks' => ['nullable', 'string'],
        ]);

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

            if ($request->input('action') === 'finalize') {
                $physicalCount->status = 'finalized';
                $physicalCount->save();
                DB::commit();
                return redirect()->route('inventory.physical-counts.index')->with('success', 'Physical count finalized successfully.');
            }

            DB::commit();
            return redirect()->back()->with('success', 'Physical count progress saved.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Failed to save count: ' . $e->getMessage()]);
        }
    }

    public function export(PhysicalCount $physicalCount): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $physicalCount->load(['creator', 'items.property.category', 'items.item.category', 'items.property.activeAssignment']);
        
        $fileName = $physicalCount->type . '_' . $physicalCount->as_of_date->format('Y-m-d') . '.csv';
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($physicalCount) {
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
                    'Overage Qty', 'Overage Value', 'Remarks'
                ]);

                /** @var \App\Models\PhysicalCountItem $item */
                foreach ($physicalCount->items as $item) {
                    /** @var \App\Models\Property|null $prop */
                    $prop = $item->property;
                    if (!$prop) continue;
                    
                    fputcsv($file, [
                        $prop->category->name ?? 'Unknown',
                        $prop->model . ' ' . $prop->brand,
                        $prop->property_number,
                        'Unit',
                        $prop->unit_cost,
                        $item->recorded_qty,
                        $item->actual_qty,
                        $item->shortage_qty,
                        number_format((float)$item->shortage_qty * (float)$prop->unit_cost, 2, '.', ''),
                        $item->overage_qty,
                        number_format((float)$item->overage_qty * (float)$prop->unit_cost, 2, '.', ''),
                        $item->remarks
                    ]);
                }
            } else {
                // RPCI Headers
                fputcsv($file, [
                    'Article', 'Description', 'Stock Number', 'Unit of Measure', 'Unit Value', 
                    'Quantity per Stock Card', 'Quantity per Physical Count', 'Shortage Qty', 'Shortage Value', 
                    'Overage Qty', 'Overage Value', 'Remarks'
                ]);

                /** @var \App\Models\PhysicalCountItem $i */
                foreach ($physicalCount->items as $i) {
                    /** @var \App\Models\Item|null $item */
                    $item = $i->item;
                    if (!$item) continue;
                    
                    fputcsv($file, [
                        $item->category->name ?? 'Unknown',
                        $item->name . ' - ' . $item->description,
                        $item->stock_number,
                        $item->unit->name ?? 'Unit',
                        $item->unit_cost,
                        $i->recorded_qty,
                        $i->actual_qty,
                        $i->shortage_qty,
                        number_format((float)$i->shortage_qty * (float)$item->unit_cost, 2, '.', ''),
                        $i->overage_qty,
                        number_format((float)$i->overage_qty * (float)$item->unit_cost, 2, '.', ''),
                        $i->remarks
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
}
