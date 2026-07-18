<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return response()->json(['properties' => [], 'tickets' => []]);
        }

        $properties = Property::with('category:id,name')
            ->where('property_number', 'like', "%{$query}%")
            ->orWhere('model', 'like', "%{$query}%")
            ->orWhere('brand', 'like', "%{$query}%")
            ->orWhereHas('category', function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get(['id', 'property_number', 'model', 'brand', 'category_id']);

        $tickets = Ticket::where('title', 'like', "%{$query}%")
            ->orWhere('id', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'title', 'status', 'category']);

        return response()->json([
            'properties' => $properties,
            'tickets' => $tickets,
        ]);
    }
}
