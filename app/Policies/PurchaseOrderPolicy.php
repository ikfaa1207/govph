<?php

namespace App\Policies;

use App\Models\PurchaseOrder;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PurchaseOrderPolicy
{
    /**
     * Determine whether the user can view any purchase orders.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('procurement.view');
    }

    /**
     * Determine whether the user can view the purchase order.
     */
    public function view(User $user, PurchaseOrder $purchaseOrder): bool
    {
        return $user->hasPermissionTo('procurement.view');
    }

    /**
     * Determine whether the user can create purchase orders.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('procurement.create');
    }

    /**
     * Determine whether the user can update the purchase order.
     */
    public function update(User $user, PurchaseOrder $purchaseOrder): Response
    {
        if (! $user->hasPermissionTo('procurement.create')) {
            return Response::deny('You do not have permission to update purchase orders.');
        }

        if ($purchaseOrder->status !== 'draft') {
            return Response::deny('Only draft purchase orders can be edited.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the user can send the purchase order.
     */
    public function send(User $user, PurchaseOrder $purchaseOrder): Response
    {
        if (! $user->hasPermissionTo('procurement.create')) {
            return Response::deny('You do not have permission to send purchase orders.');
        }

        if ($purchaseOrder->status !== 'draft') {
            return Response::deny('Only draft purchase orders can be sent.');
        }

        return Response::allow();
    }
}
