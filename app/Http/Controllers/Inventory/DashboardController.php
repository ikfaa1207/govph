<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\Requisition;
use App\Models\ReceivingReport;
use App\Models\Issuance;
use App\Models\Property;
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

        $totalItems = Item::count();
        
        // Load items to compute stock levels
        $items = Item::all();
        $lowStocksCount = 0;
        $outOfStocksCount = 0;
        $totalValue = 0.0;

        foreach ($items as $item) {
            $stock = $item->current_stock;
            if ($stock === 0) {
                $outOfStocksCount++;
            } elseif ($stock <= $item->reorder_level) {
                $lowStocksCount++;
            }
            $totalValue += $stock * (float) $item->unit_cost;
        }

        $totalProperties = Property::count();
        $pendingRequisitionsCount = Requisition::whereIn('status', ['pending_dept_head', 'pending_supply'])->count();

        // Feeds
        $recentIssuances = Issuance::with(['receiver', 'issuer'])
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        $recentReceiving = ReceivingReport::with(['receiver', 'purchaseOrder.supplier'])
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        $pendingRequests = Requisition::with(['requester.department'])
            ->whereIn('status', ['pending_dept_head', 'pending_supply'])
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('inventory/dashboard', [
            'stats' => [
                'totalItems' => $totalItems,
                'lowStocks' => $lowStocksCount,
                'outOfStocks' => $outOfStocksCount,
                'totalValue' => round($totalValue, 2),
                'totalProperties' => $totalProperties,
                'pendingRequests' => $pendingRequisitionsCount,
            ],
            'recentIssuances' => $recentIssuances,
            'recentReceiving' => $recentReceiving,
            'pendingRequests' => $pendingRequests,
        ]);
    }
}
