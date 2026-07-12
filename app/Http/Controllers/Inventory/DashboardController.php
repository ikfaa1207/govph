<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\DepartmentItem;
use App\Models\Issuance;
use App\Models\Item;
use App\Models\Property;
use App\Models\ReceivingReport;
use App\Models\Requisition;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the GIMS dashboard metrics.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('dashboard.view');

        $user = $request->user();
        $employee = $user?->employee;

        // Check if user should see global inventory (Supply Officer/Admin)
        $seesGlobalInventory = Gate::allows('warehouse.issue');

        if ($seesGlobalInventory || ! $employee) {
            $totalItems = Item::count();

            // Use an aggregate query to prevent N+1 and memory exhaustion
            $aggregates = Item::selectRaw('
                SUM(current_stock * unit_cost) as total_value,
                SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
                SUM(CASE WHEN current_stock > 0 AND current_stock <= reorder_level THEN 1 ELSE 0 END) as low_stock
            ')->first();

            $lowStocksCount = (int) ($aggregates->low_stock ?? 0);
            $outOfStocksCount = (int) ($aggregates->out_of_stock ?? 0);
            $totalValue = (float) ($aggregates->total_value ?? 0);

            $totalProperties = Property::count();
            $totalPpeValue = (float) Property::sum('unit_cost');
        } else {
            $totalItems = DepartmentItem::where('department_id', $employee->department_id)->count();

            // Aggregate from department_items joined with items
            $aggregates = DepartmentItem::where('department_id', $employee->department_id)
                ->join('items', 'department_items.item_id', '=', 'items.id')
                ->selectRaw('
                    SUM(department_items.current_stock * items.unit_cost) as total_value,
                    SUM(CASE WHEN department_items.current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
                    SUM(CASE WHEN department_items.current_stock > 0 AND department_items.current_stock <= items.reorder_level THEN 1 ELSE 0 END) as low_stock
                ')->first();

            $lowStocksCount = (int) ($aggregates->low_stock ?? 0);
            $outOfStocksCount = (int) ($aggregates->out_of_stock ?? 0);
            $totalValue = (float) ($aggregates->total_value ?? 0);

            $deptPropertiesQuery = Property::whereHas('activeAssignment.assignee', function ($query) use ($employee) {
                $query->where('department_id', $employee->department_id);
            });

            $totalProperties = $deptPropertiesQuery->count();
            $totalPpeValue = (float) $deptPropertiesQuery->sum('unit_cost');
        }

        $countQuery = Requisition::whereIn('status', ['pending_dept_head', 'pending_supply'])
            ->visibleTo($user, $employee);

        $feedQuery = Requisition::with(['requester.department'])
            ->whereIn('status', ['pending_dept_head', 'pending_supply'])
            ->visibleTo($user, $employee);

        $pendingRequisitionsCount = $countQuery->count();

        // Feeds
        if ($seesGlobalInventory || ! $employee) {
            $recentIssuances = Issuance::with(['receiver', 'issuer'])
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();

            $recentReceiving = ReceivingReport::with(['receiver', 'purchaseOrder.supplier'])
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();
        } else {
            $recentIssuances = Issuance::with(['receiver', 'issuer'])
                ->whereHas('receiver', function ($query) use ($employee) {
                    $query->where('department_id', $employee->department_id);
                })
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();

            $recentReceiving = [];
        }

        $pendingRequests = $feedQuery
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('inventory/dashboard', [
            'stats' => [
                'inventoryType' => $seesGlobalInventory || ! $employee ? 'Central Supply' : 'Department',
                'totalItems' => $totalItems,
                'lowStocks' => $lowStocksCount,
                'outOfStocks' => $outOfStocksCount,
                'totalValue' => round($totalValue, 2),
                'totalProperties' => $totalProperties,
                'totalPpeValue' => round($totalPpeValue, 2),
                'pendingRequests' => $pendingRequisitionsCount,
            ],
            'recentIssuances' => $recentIssuances,
            'recentReceiving' => $recentReceiving,
            'pendingRequests' => $pendingRequests,
        ]);
    }
}
