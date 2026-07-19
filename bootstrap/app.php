<?php

use App\Exceptions\EmployeeProfileNotFoundException;
use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Middleware\EnsureTwoFactorEnabled;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            EnsurePasswordChanged::class,
            EnsureTwoFactorEnabled::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (EmployeeProfileNotFoundException $e, Request $request) {
            if ($request->wantsJson() || $request->expectsJson() || $request->is('inertia/*')) {
                return response()->json(['error' => $e->getMessage()], 422);
            }

            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        });

        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->wantsJson() || $request->expectsJson() || $request->is('api/*')) {
                return null;
            }

            $response = match (true) {
                $e instanceof AuthorizationException => [
                    'status' => 403,
                    'message' => 'Unauthorized action.',
                ],
                $e instanceof HttpException => [
                    'status' => $e->getStatusCode(),
                    'message' => $e->getMessage(),
                ],
                default => null,
            };

            if ($response && in_array($response['status'], [403, 404, 500, 503])) {
                return Inertia\Inertia::render('error', [
                    'status' => $response['status'],
                ])->toResponse($request)->setStatusCode($response['status']);
            }
        });
    })->create();
