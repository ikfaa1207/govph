<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  Request  $request
     * @return Response
     */
    public function toResponse($request)
    {
        // If the request wants JSON, return a 200 OK
        if ($request->wantsJson()) {
            return response()->json(['two_factor' => false]);
        }

        // Dynamically redirect based on permissions
        if (Gate::allows('dashboard.view')) {
            return redirect()->intended(config('fortify.home'));
        }

        if (Gate::allows('requisition.viewAny') || Gate::allows('request.viewAny')) {
            return redirect()->intended('/inventory/requisitions');
        }

        if (Gate::allows('helpdesk.viewAny')) {
            return redirect()->intended('/inventory/helpdesk');
        }

        // Fallback for users with extremely limited permissions
        return redirect()->intended('/');
    }
}
