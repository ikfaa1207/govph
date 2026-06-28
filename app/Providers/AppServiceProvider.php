<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
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
        \Illuminate\Support\Facades\Gate::before(function (\App\Models\User $user, string $ability) {
            // Super Admin bypass
            if ($user->hasPermissionTo('admin.super')) {
                return true;
            }
        });

        \Illuminate\Support\Facades\Gate::after(function (\App\Models\User $user, string $ability, $result) {
            if ($result === null) {
                // Check if the gate name matches GIMS permission format (contains dot)
                if (str_contains($ability, '.')) {
                    $allowed = $user->hasPermissionTo($ability);

                    if (!$allowed) {
                        \App\Services\Audit\AuditLogger::logUnauthorized(
                            $ability,
                            explode('.', $ability)[0],
                        );
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
