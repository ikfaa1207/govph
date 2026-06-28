<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CategoryController extends Controller
{
    /**
     * Store a newly created category.
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'code' => ['required', 'string', 'max:50', 'unique:categories,code'],
            'is_ppe' => ['required', 'boolean'],
        ]);

        $category = Category::create($validated);

        return response()->json($category);
    }
}
