<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Item;
use App\Models\Property;
use App\Models\StockTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Display the reports centre.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('reports.view');

        $hasRpci = Item::whereHas('category', function ($q) {
            $q->where('is_ppe', false);
        })->exists();

        $hasRpcppe = Property::exists();

        $hasStockLedger = Item::exists();

        $hasAuditTrail = AuditLog::exists();

        return Inertia::render('inventory/reports/index', [
            'reportTypes' => [
                [
                    'id' => 'rpci',
                    'name' => 'Report on the Physical Count of Inventories (RPCI)',
                    'has_data' => $hasRpci,
                ],
                [
                    'id' => 'rpcppe',
                    'name' => 'Report on Physical Count of Property, Plant, & Equipment (RPCPPE)',
                    'has_data' => $hasRpcppe,
                ],
                [
                    'id' => 'stock_ledger',
                    'name' => 'Stock Card Ledger',
                    'has_data' => $hasStockLedger,
                ],
                [
                    'id' => 'audit_trail',
                    'name' => 'Secure Audit Log Trail',
                    'has_data' => $hasAuditTrail,
                ],
            ],
        ]);
    }

    /**
     * Fetch report data dynamically.
     */
    public function generate(Request $request, string $type): JsonResponse
    {
        if ($type === 'audit_trail') {
            Gate::authorize('audit.view');
        } else {
            Gate::authorize('reports.view');
        }

        switch ($type) {
            case 'rpci':
                // Return items that are supplies/materials (<50,000 unit cost or non-PPE)
                $items = Item::with(['category', 'unit', 'location'])
                    ->whereHas('category', function ($q) {
                        $q->where('is_ppe', false);
                    })
                    ->get()
                    ->map(function ($item) {
                        $stock = $item->current_stock;

                        return [
                            'item_code' => $item->item_code,
                            'stock_number' => $item->stock_number,
                            'name' => $item->name,
                            'category' => $item->category->name,
                            'unit' => $item->unit->abbreviation,
                            'unit_cost' => $item->unit_cost,
                            'on_hand' => $stock,
                            'total_cost' => round($stock * (float) $item->unit_cost, 2),
                            'location' => $item->location->code ?? 'None',
                        ];
                    });

                return response()->json($items);

            case 'rpcppe':
                // Return properties (capitalized assets)
                $properties = Property::with(['category', 'activeAssignment.assignee'])
                    ->get()
                    ->map(function ($prop) {
                        return [
                            'property_number' => $prop->property_number,
                            'serial_number' => $prop->serial_number,
                            'description' => "{$prop->brand} {$prop->model}",
                            'category' => $prop->category->name,
                            'unit_cost' => $prop->unit_cost,
                            'condition' => ucfirst($prop->condition),
                            'status' => ucfirst($prop->status->value),
                            'accountable_officer' => $prop->activeAssignment?->assignee->name ?? 'None',
                            'date_acquired' => $prop->date_acquired,
                        ];
                    });

                return response()->json($properties);

            case 'stock_ledger':
                $itemId = $request->input('item_id');
                if (! $itemId) {
                    return response()->json([]);
                }
                $txs = StockTransaction::where('item_id', $itemId)
                    ->with('item')
                    ->orderBy('created_at', 'asc')
                    ->get()
                    ->map(function ($tx) {
                        return [
                            'date' => $tx->created_at->format('Y-m-d H:i'),
                            'type' => strtoupper($tx->transaction_type),
                            'qty' => $tx->quantity,
                            'cost' => $tx->unit_cost,
                            'remarks' => $tx->remarks,
                        ];
                    });

                return response()->json($txs);

            case 'audit_trail':
                $logs = AuditLog::with('user.roles')
                    ->orderBy('id', 'desc')
                    ->limit(200)
                    ->get()
                    ->map(function ($log) {
                        return [
                            'id' => $log->id,
                            'user_name' => $log->user->name ?? 'System',
                            'user_role' => $log->user_role ?: ($log->user ? $log->user->roles->pluck('name')->join(', ') : 'N/A'),
                            'action' => $log->action,
                            'auditable_type' => $log->model_type ?? 'N/A',
                            'auditable_id' => $log->model_id ?? 0,
                            'ip_address' => $log->ip_address,
                            'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                        ];
                    });

                return response()->json($logs);

            default:
                return response()->json(['error' => 'Invalid report type'], 400);
        }
    }
}
