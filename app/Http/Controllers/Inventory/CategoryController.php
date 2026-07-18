<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CategoryController extends Controller
{
    /**
     * Store a newly created category.
     */
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'code' => ['required', 'string', 'max:50', 'unique:categories,code'],
            'is_ppe' => ['required', 'boolean'],
        ]);

        $category = Category::create($validated);

        return back();
    }

    /**
     * Update a category.
     */
    public function update(Request $request, Category $category): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name,'.$category->id],
            'code' => ['required', 'string', 'max:50', 'unique:categories,code,'.$category->id],
            'is_ppe' => ['required', 'boolean'],
        ]);

        $category->update($validated);

        return back();
    }

    /**
     * Toggle the active status of a category.
     */
    public function toggleStatus(Category $category): RedirectResponse
    {
        Gate::authorize('inventory.create');

        if ($category->is_active && $category->items()->exists()) {
            return back()->withErrors(['error' => 'Cannot deactivate a category that is currently assigned to items. Reassign the items first.']);
        }

        $category->is_active = ! $category->is_active;
        $category->save();

        return back();
    }
}
