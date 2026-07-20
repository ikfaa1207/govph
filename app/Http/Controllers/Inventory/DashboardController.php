<?php

namespace App\Http\Controllers\Inventory;

use App\Enums\ItemStatus;
use App\Enums\PhysicalCountStatus;
use App\Http\Controllers\Controller;
use App\Models\DepartmentItem;
use App\Models\Issuance;
use App\Models\Item;
use App\Models\PhysicalCount;
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

        // Determine user dashboard scope without triggering Gate::after logging
        $seesGlobalInventory = $user->hasPermissionTo('warehouse.issue') || $user->hasPermissionTo('audit.view') || $user->hasPermissionTo('property.assign');
        $isDeptHead = $user->hasPermissionTo('request.approve');

        if ($seesGlobalInventory) {
            $userScope = 'global';
        } elseif (! $employee) {
            $userScope = 'unassigned';
        } elseif ($isDeptHead) {
            $userScope = 'dept_head';
        } else {
            $userScope = 'employee';
        }

        $myProperties = [];

        if ($userScope === 'global') {
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

            $countQuery = Requisition::whereIn('status', ['pending_dept_head', 'pending_supply'])
                ->visibleTo($user, $employee);

            $feedQuery = Requisition::with(['requester.department'])
                ->whereIn('status', ['pending_dept_head', 'pending_supply'])
                ->visibleTo($user, $employee);

            $recentIssuances = Issuance::with(['receiver', 'issuer'])
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();

            $recentReceiving = ReceivingReport::with(['receiver', 'purchaseOrder.supplier'])
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();

            $pendingRequests = $feedQuery
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();

        } elseif ($userScope === 'dept_head') {
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

            $countQuery = Requisition::whereIn('status', ['pending_dept_head'])
                ->where('department_id', $employee->department_id);

            $feedQuery = Requisition::with(['requester.department'])
                ->whereIn('status', ['pending_dept_head'])
                ->where('department_id', $employee->department_id);

            $recentIssuances = Issuance::with(['receiver', 'issuer'])
                ->whereHas('receiver', function ($query) use ($employee) {
                    $query->where('department_id', $employee->department_id);
                })
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();

            $recentReceiving = [];

            $pendingRequests = $feedQuery
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();

        } elseif ($userScope === 'employee') {
            // Regular requesting employee
            $totalItems = Item::where('status', ItemStatus::Active)->count();
            $lowStocksCount = 0;
            $outOfStocksCount = 0;
            $totalValue = 0.0;

            $totalProperties = Property::whereHas('activeAssignment', function ($query) use ($employee) {
                $query->where('assigned_to', $employee->id);
            })->count();

            $totalPpeValue = (float) Property::whereHas('activeAssignment', function ($query) use ($employee) {
                $query->where('assigned_to', $employee->id);
            })->sum('unit_cost');

            $countQuery = Requisition::where('requesting_employee_id', $employee->id)
                ->whereIn('status', ['pending_dept_head', 'pending_supply']);

            $recentIssuances = [];
            $recentReceiving = [];

            $pendingRequests = Requisition::with(['requester.department'])
                ->where('requesting_employee_id', $employee->id)
                ->orderBy('id', 'desc')
                ->limit(5)
                ->get();

            $myProperties = Property::with(['category', 'activeAssignment'])
                ->whereHas('activeAssignment', function ($query) use ($employee) {
                    $query->where('assigned_to', $employee->id);
                })->get();
        } else {
            // Unassigned scope (no employee record)
            $totalItems = 0;
            $lowStocksCount = 0;
            $outOfStocksCount = 0;
            $totalValue = 0.0;
            $totalProperties = 0;
            $totalPpeValue = 0.0;

            $countQuery = Requisition::whereRaw('1 = 0');
            $recentIssuances = [];
            $recentReceiving = [];
            $pendingRequests = [];
            $myProperties = [];
        }

        $pendingRequisitionsCount = $countQuery->count();

        $complianceAlerts = [];
        $currentYear = (int) date('Y');
        $prevYearDec31 = ($currentYear - 1).'-12-31';
        $hasPrevYearCount = PhysicalCount::where('as_of_date', $prevYearDec31)
            ->where('status', PhysicalCountStatus::Finalized)
            ->exists();

        $currentMonth = (int) date('n');
        if ($userScope === 'global' && ! $hasPrevYearCount && in_array($currentMonth, [11, 12, 1, 2], true)) {
            $complianceAlerts[] = [
                'type' => 'warning',
                'title' => 'Statutory Compliance Deadline',
                'message' => 'The Annual Physical Count (RPCPPE & RPCI) as of December 31 is due for submission by January 31. No finalized count for '.($currentYear - 1).' was found.',
            ];
        }

        $pendingCountsCount = $userScope === 'global' ? PhysicalCount::whereIn('status', [
            PhysicalCountStatus::Draft,
            PhysicalCountStatus::PendingReview,
        ])->count() : 0;

        $statsData = [
            'inventoryType' => $userScope === 'global' ? 'Central Supply' : 'Department',
            'totalItems' => $totalItems,
            'lowStocks' => $lowStocksCount,
            'outOfStocks' => $outOfStocksCount,
            'totalValue' => round($totalValue, 2),
            'totalProperties' => $totalProperties,
            'totalPpeValue' => round($totalPpeValue, 2),
            'pendingRequests' => $pendingRequisitionsCount,
            'pendingCounts' => $pendingCountsCount,
        ];

        if (app()->environment('testing')) {
            return Inertia::render('inventory/dashboard', [
                'userScope' => $userScope,
                'stats' => $statsData,
                'recentIssuances' => $recentIssuances,
                'recentReceiving' => $recentReceiving,
                'pendingRequests' => $pendingRequests,
                'complianceAlerts' => $complianceAlerts,
                'myProperties' => $myProperties,
            ]);
        }

        return Inertia::render('inventory/dashboard', [
            'userScope' => $userScope,
            'stats' => $statsData,
            'recentIssuances' => $recentIssuances,
            'recentReceiving' => $recentReceiving,
            'pendingRequests' => $pendingRequests,
            'complianceAlerts' => $complianceAlerts,
            'myProperties' => $myProperties,
        ]);
    }
}
