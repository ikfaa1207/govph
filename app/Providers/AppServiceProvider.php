<?php

namespace App\Providers;

use App\Models\User;
use App\Services\Audit\AuditLogger;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
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
