<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CategoryController extends Controller
{
    /**
     * Store a newly created category.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        Gate::authorize('inventory.create');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'code' => ['required', 'string', 'max:50', 'unique:categories,code'],
            'is_ppe' => ['required', 'boolean'],
        ]);

        $category = Category::create($validated);

        AuditLogger::log('CREATE_CATEGORY', $category, null, $category->toArray());

        if ($request->wantsJson()) {
            return response()->json($category, 201);
        }

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

        AuditLogger::log('UPDATE_CATEGORY', $category, null, $category->toArray());

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

        AuditLogger::log('TOGGLE_CATEGORY_STATUS', $category, null, ['is_active' => $category->is_active]);

        return back();
    }

    /**
     * Seed default COA categories.
     */
    public function seedDefaults(Request $request): RedirectResponse
    {
        Gate::authorize('inventory.create');

        $defaults = [
            ['name' => 'Office Supplies', 'code' => 'OFF-SUPP', 'is_ppe' => false],
            ['name' => 'Medical, Dental and Laboratory Supplies', 'code' => 'MED-SUPP', 'is_ppe' => false],
            ['name' => 'Other Supplies and Materials', 'code' => 'OTH-SUPP', 'is_ppe' => false],
            ['name' => 'Office Equipment', 'code' => 'OFF-EQPT', 'is_ppe' => true],
            ['name' => 'IT Equipment and Software', 'code' => 'IT-EQPT', 'is_ppe' => true],
            ['name' => 'Communication Equipment', 'code' => 'COMM-EQPT', 'is_ppe' => true],
            ['name' => 'Machinery and Equipment', 'code' => 'MACH-EQPT', 'is_ppe' => true],
            ['name' => 'Furniture and Fixtures', 'code' => 'FURN-FIXT', 'is_ppe' => true],
        ];

        $seededCount = 0;
        $lastSeeded = null;
        foreach ($defaults as $data) {
            $category = Category::firstOrCreate(
                ['code' => $data['code']],
                ['name' => $data['name'], 'is_ppe' => $data['is_ppe'], 'is_active' => true]
            );
            if ($category->wasRecentlyCreated) {
                $seededCount++;
                $lastSeeded = $category;
            }
        }

        if ($seededCount > 0 && $lastSeeded) {
            AuditLogger::log('SEED_DEFAULT_CATEGORIES', $lastSeeded, null, ['count' => $seededCount]);
        }

        return back();
    }
}
