<?php

namespace App\Policies;

use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PurchaseRequestPolicy
{
    /**
     * Determine whether the user can view any purchase requests.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('procurement.view');
    }

    /**
     * Determine whether the user can view the purchase request.
     */
    public function view(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->hasPermissionTo('procurement.view');
    }

    /**
     * Determine whether the user can create purchase requests.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('procurement.create');
    }

    /**
     * Determine whether the user can approve a purchase request.
     */
    public function approve(User $user, PurchaseRequest $purchaseRequest): Response
    {
        if (! $user->hasPermissionTo('procurement.approve')) {
            return Response::deny('You do not have permission to approve purchase requests.');
        }

        if ($purchaseRequest->status !== 'pending') {
            return Response::deny('Only pending purchase requests can be approved.');
        }

        $employee = $user->employee;
        if ($employee && $purchaseRequest->requested_by === $employee->id) {
            return Response::deny('You cannot approve your own purchase request.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the user can reject a purchase request.
     */
    public function reject(User $user, PurchaseRequest $purchaseRequest): Response
    {
        if (! $user->hasPermissionTo('procurement.approve')) {
            return Response::deny('You do not have permission to reject purchase requests.');
        }

        if ($purchaseRequest->status !== 'pending') {
            return Response::deny('Only pending purchase requests can be rejected.');
        }

        $employee = $user->employee;
        if ($employee && $purchaseRequest->requested_by === $employee->id) {
            return Response::deny('You cannot reject your own purchase request.');
        }

        return Response::allow();
    }
}
