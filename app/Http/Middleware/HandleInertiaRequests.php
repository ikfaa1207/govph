<?php

namespace App\Http\Middleware;

use App\Models\PhysicalCount;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $hasPhysicalCounts = false;

        if ($user) {
            $employee = $user->employee;
            if ($employee) {
                $hasPhysicalCounts = PhysicalCount::where('created_by', $employee->id)
                    ->orWhereHas('committees', function ($q) use ($employee) {
                        $q->where('employee_id', $employee->id);
                    })->exists();
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'roles' => $user->roles->pluck('name')->toArray(),
                    'permissions' => array_values(array_unique(array_merge(
                        $user->permissions->pluck('name')->toArray(),
                        $user->roles->flatMap(fn ($r) => $r->permissions->pluck('name'))->toArray()
                    ))),
                    'has_physical_counts' => $hasPhysicalCounts,
                ]) : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
