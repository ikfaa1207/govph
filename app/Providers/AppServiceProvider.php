<?php

namespace App\Providers;

use App\Models\Requisition;
use App\Models\Ticket;
use App\Models\User;
use App\Policies\PhysicalCountPolicy;
use App\Policies\PropertyPolicy;
use App\Policies\RequisitionPolicy;
use App\Policies\TicketPolicy;
use App\Services\Audit\AuditLogger;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->isProduction()) {
            URL::forceScheme('https');
        }

        $this->configureDefaults();
        $this->configureAuthorization();
    }

    /**
     * Map fine-grained GIMS permissions to Laravel Gates.
     */
    protected function configureAuthorization(): void
    {
        Gate::before(function (User $user, string $ability) {
            // Super Admin bypass
            if ($user->hasPermissionTo('admin.super')) {
                return true;
            }
        });

        // Requisition Gates
        Gate::define('requisition.viewAny', [RequisitionPolicy::class, 'viewAny']);
        Gate::define('requisition.view', [RequisitionPolicy::class, 'view']);
        Gate::define('requisition.approve', [RequisitionPolicy::class, 'approve']);
        Gate::define('requisition.issue', [RequisitionPolicy::class, 'issue']);

        // Property / Sub-Assignment Gates
        Gate::define('property.subassign', [PropertyPolicy::class, 'subassign']);

        // Physical Count Gates
        Gate::define('physical-count.viewAny', [PhysicalCountPolicy::class, 'viewAny']);
        Gate::define('physical-count.create', [PhysicalCountPolicy::class, 'create']);
        Gate::define('physical-count.view', [PhysicalCountPolicy::class, 'view']);
        Gate::define('physical-count.update', [PhysicalCountPolicy::class, 'update']);
        Gate::define('physical-count.review', [PhysicalCountPolicy::class, 'review']);
        Gate::define('physical-count.delete', [PhysicalCountPolicy::class, 'delete']);

        // Ticket / Helpdesk Gates
        Gate::define('ticket.viewAny', [TicketPolicy::class, 'viewAny']);
        Gate::define('ticket.create', [TicketPolicy::class, 'create']);
        Gate::define('ticket.update', [TicketPolicy::class, 'update']);
        Gate::define('ticket.manage', [TicketPolicy::class, 'manage']);

        // Alias for backward compatibility
        Gate::define('helpdesk.viewAny', function (User $user) {
            return $user->hasPermissionTo('helpdesk.viewAny');
        });

        Gate::after(function (User $user, string $ability, $result) {
            if ($result === null) {
                // Check if the gate name matches GIMS permission format (contains dot)
                if (str_contains($ability, '.')) {
                    $allowed = $user->hasPermissionTo($ability);

                    if (! $allowed) {
                        // Filter out noisy frontend/inertia checks and automatic validation
                        $request = request();
                        if (! $request->wantsJson() && ! $request->is('inertia/*') && (! app()->runningInConsole() || app()->runningUnitTests())) {
                            AuditLogger::logUnauthorized(
                                $ability,
                                explode('.', $ability)[0],
                            );
                        }
                    }

                    return $allowed;
                }
            }
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
