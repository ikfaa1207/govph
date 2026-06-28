<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
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
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();

        Fortify::authenticateUsing(function (Request $request) {
            $user = \App\Models\User::where('email', $request->email)->first();

            if ($user) {
                // Check if account is locked
                if ($user->locked_until && $user->locked_until->isFuture()) {
                    $diffInMinutes = ceil(now()->diffInMinutes($user->locked_until));
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        Fortify::username() => [__("This account is temporarily locked due to too many failed login attempts. Please try again in {$diffInMinutes} minutes or contact an administrator.")],
                    ]);
                }

                // Check password
                if (\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
                    if (!$user->is_active) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            Fortify::username() => __('This account has been deactivated. Please contact your system administrator.'),
                        ]);
                    }

                    // Reset failed attempts on success
                    $user->update([
                        'failed_login_attempts' => 0,
                        'locked_until' => null,
                    ]);

                    // Single active session policy: terminate other sessions
                    \Illuminate\Support\Facades\DB::table('sessions')
                        ->where('user_id', $user->id)
                        ->delete();

                    return $user;
                } else {
                    // Password incorrect: increment failed attempts
                    $newAttempts = $user->failed_login_attempts + 1;
                    $updateData = ['failed_login_attempts' => $newAttempts];

                    if ($newAttempts >= 5) {
                        $updateData['locked_until'] = now()->addMinutes(30);
                        $updateData['failed_login_attempts'] = 0; // Reset counter for next cycle

                        $user->update($updateData);

                        \App\Services\Audit\AuditLogger::log(
                            'ACCOUNT_LOCKED_OUT',
                            $user,
                            null,
                            ['reason' => '5 failed login attempts', 'locked_until' => $updateData['locked_until']->toDateTimeString()],
                            'administration'
                        );

                        throw \Illuminate\Validation\ValidationException::withMessages([
                            Fortify::username() => [__('Too many failed login attempts. Your account has been locked for 30 minutes.')],
                        ]);
                    } else {
                        $user->update($updateData);
                    }
                }
            }

            return null;
        });
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('passkeys', function (Request $request) {
            return Limit::perMinute(10)->by(
                ($request->input('credential.id') ?: $request->session()->getId()).'|'.$request->ip(),
            );
        });
    }
}
