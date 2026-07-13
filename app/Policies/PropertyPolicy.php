<?php

namespace App\Policies;

use App\Models\User;
use App\Services\Audit\AuditLogger;
use Illuminate\Auth\Access\Response;

class PropertyPolicy
{
    /**
     * Determine whether the user can issue or return MR sub-assignments.
     */
    public function subassign(User $user): Response
    {
        $allowed = $user->hasPermissionTo('property.transfer') || $user->hasRole('Department Head');

        if (! $allowed) {
            $request = request();
            if (! $request->wantsJson() && ! $request->is('inertia/*') && (! app()->runningInConsole() || app()->runningUnitTests())) {
                AuditLogger::logUnauthorized('property.subassign', 'property');
            }

            return Response::deny('Unauthorized to issue or return Memorandum Receipts.');
        }

        return Response::allow();
    }
}
