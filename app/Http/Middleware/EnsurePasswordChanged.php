<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Redirect users who must change their password on first login.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $mustChange = false;
            $warningMessage = 'You must change your password before continuing.';

            if ($user->password_change_required) {
                $mustChange = true;
            } elseif ($user->password_changed_at) {
                $daysSinceChange = (int) abs(now()->diffInDays($user->password_changed_at));
                if ($daysSinceChange >= 60) {
                    $mustChange = true;
                    $warningMessage = 'Your password has expired. You must change your password before continuing.';
                } elseif ($daysSinceChange >= 53) {
                    $daysRemaining = 60 - $daysSinceChange;
                    session()->flash('warning', "Your password will expire in {$daysRemaining} days. Please update it soon.");
                    \Inertia\Inertia::flash('toast', [
                        'type' => 'warning',
                        'message' => "Your password will expire in {$daysRemaining} days. Please update it soon."
                    ]);
                }
            } else {
                $user->update(['password_changed_at' => now()]);
            }

            if ($mustChange) {
                // Allow access to password change, logout, and security settings routes
                $allowedRoutes = [
                    'security.edit',
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

                if ($currentRoute && !in_array($currentRoute, $allowedRoutes)) {
                    $isAllowed = false;
                    foreach ($allowedPrefixes as $prefix) {
                        if (str_starts_with($currentRoute, $prefix)) {
                            $isAllowed = true;
                            break;
                        }
                    }

                    if (!$isAllowed) {
                        session()->flash('warning', $warningMessage);
                        \Inertia\Inertia::flash('toast', [
                            'type' => 'warning',
                            'message' => $warningMessage
                        ]);
                        return redirect()->route('security.edit');
                    }
                }
            }
        }

        return $next($request);
    }
}
