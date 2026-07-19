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
        if (! $user->hasPermissionTo('procurement.view')) {
            return false;
        }

        $employee = $user->employee;
        if ($user->hasPermissionTo('admin.super') || $user->hasPermissionTo('warehouse.issue') || $user->hasPermissionTo('audit.view') || $user->hasPermissionTo('procurement.create') || $user->hasPermissionTo('property.assign')) {
            return true;
        }

        if ($user->hasPermissionTo('request.approve') && $employee) {
            return $purchaseRequest->department_id === $employee->department_id;
        }

        return $employee && $purchaseRequest->requested_by === $employee->id;
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
