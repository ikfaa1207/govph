<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureTwoFactorEnabled
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Check if 2FA enforcement is enabled
        $isEnforced = config('fortify.two_factor_enforced', false);

        // If in test environment, allow passing enforce_2fa parameter or header to force the check
        if (app()->environment('testing')) {
            if ($request->has('enforce_2fa') || $request->header('X-Enforce-2FA')) {
                $isEnforced = true;
            }
        }

        if (! $isEnforced) {
            return $next($request);
        }

        if ($user) {
            // Check if 2FA is enabled (and confirmed, if confirm is required)
            // Fortify's default check: two_factor_secret is not null, and if confirm is enabled, two_factor_confirmed_at is not null.
            $hasTwoFactor = $user->two_factor_secret !== null;
            if (config('fortify.features') && in_array('two-factor-authentication', config('fortify.features'))) {
                // If 2FA confirmation is required, ensure two_factor_confirmed_at is set
                $features = config('fortify.features');
                $twoFactorFeature = null;
                if (is_array($features)) {
                    foreach ($features as $feature) {
                        if (is_array($feature) && isset($feature['confirm'])) {
                            $twoFactorFeature = $feature;
                            break;
                        }
                    }
                }
                if ($twoFactorFeature && $twoFactorFeature['confirm']) {
                    $hasTwoFactor = $user->two_factor_confirmed_at !== null;
                }
            }

            if (! $hasTwoFactor) {
                // Allow access to security page, 2FA confirmation routes, and logout
                $allowedRoutes = [
                    'security.edit',
                    'two-factor.enable',
                    'two-factor.disable',
                    'two-factor.qr-code',
                    'two-factor.secret-key',
                    'two-factor.recovery-codes',
                    'two-factor.confirm',
                    'user-password.update',
                    'password.update',
                    'logout',
                    'password.confirm',
                    'password.confirm.store',
                    'password.confirmation',
                    'passkey.confirm',
                    'passkey.confirm-options',
                ];
                $allowedPrefixes = ['security', 'appearance'];

                $currentRoute = $request->route()?->getName();

                if ($currentRoute && ! in_array($currentRoute, $allowedRoutes)) {
                    $isAllowed = false;
                    foreach ($allowedPrefixes as $prefix) {
                        if (str_starts_with($currentRoute, $prefix)) {
                            $isAllowed = true;
                            break;
                        }
                    }

                    if (! $isAllowed) {
                        session()->flash('warning', 'Two-factor authentication is required. Please set it up to continue.');
                        Inertia::flash('toast', [
                            'type' => 'warning',
                            'message' => 'Two-factor authentication is required. Please set it up to continue.',
                        ]);

                        return redirect()->route('security.edit');
                    }
                }
            }
        }

        return $next($request);
    }
}
