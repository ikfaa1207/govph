<?php

namespace App\Policies;

use App\Enums\RequisitionStatus;
use App\Models\Requisition;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class RequisitionPolicy
{
    /**
     * Determine whether the user can view any requisitions.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('request.create')
            || $user->hasPermissionTo('request.approve')
            || $user->hasPermissionTo('warehouse.issue');
    }

    /**
     * Determine whether the user can create a requisition.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('request.create');
    }

    /**
     * Determine whether the user can view a specific requisition.
     */
    public function view(User $user, Requisition $requisition): Response
    {
        if (! $user->hasPermissionTo('inventory.view')) {
            return Response::deny('You do not have permission to view this requisition.');
        }

        if ($user->hasPermissionTo('warehouse.issue') || $user->hasPermissionTo('audit.view')) {
            return Response::allow();
        }

        $employee = $user->employee;
        if (! $employee) {
            return Response::deny('You must have an employee profile to view requisitions.');
        }

        if ($user->hasPermissionTo('request.approve')) {
            return $requisition->department_id === $employee->department_id
                ? Response::allow()
                : Response::deny('You can only view requisitions from your department.');
        }

        return $requisition->requesting_employee_id === $employee->id
            ? Response::allow()
            : Response::deny('You can only view your own requisitions.');
    }

    /**
     * Determine whether the user can approve a requisition.
     */
    public function approve(User $user, Requisition $requisition): Response
    {
        if (! $user->hasPermissionTo('request.approve')) {
            return Response::deny('You do not have permission to approve requisitions.');
        }

        $employee = $user->employee;

        if ($employee && $requisition->requesting_employee_id === $employee->id) {
            return Response::deny('A creator cannot approve their own requisition request.');
        }

        $isAdmin = $user->hasRole('System Administrator') || $user->hasPermissionTo('admin.super');

        if ($requisition->department_head_id === null) {
            if ($isAdmin) {
                if ($requisition->status !== RequisitionStatus::PendingDeptHead) {
                    return Response::deny('Only pending requisitions can be approved.');
                }

                return Response::allow();
            }

            return Response::deny('This requisition has no assigned department head and must be approved by an administrator.');
        }

        if ($employee === null || $requisition->department_head_id !== $employee->getKey()) {
            if ($isAdmin) {
                if ($requisition->status !== RequisitionStatus::PendingDeptHead) {
                    return Response::deny('Only pending requisitions can be approved.');
                }

                return Response::allow();
            }

            return Response::deny('You are not the designated department head for this requisition.');
        }

        if ($requisition->status !== RequisitionStatus::PendingDeptHead) {
            return Response::deny('Only pending requisitions can be approved.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the user can issue items for a requisition.
     */
    public function issue(User $user, Requisition $requisition): Response
    {
        if (! $user->hasPermissionTo('warehouse.issue')) {
            return Response::deny('You do not have permission to issue items.');
        }

        if (! in_array($requisition->status, [RequisitionStatus::PendingSupply, RequisitionStatus::PartiallyIssued], true)) {
            return Response::deny('Requisition is not in a state that can be issued.');
        }

        return Response::allow();
    }

    /**
     * Determine whether the user can reject a requisition.
     */
    public function reject(User $user, Requisition $requisition): Response
    {
        if (! $user->hasPermissionTo('request.approve')) {
            return Response::deny('You do not have permission to reject requisitions.');
        }

        $employee = $user->employee;

        if ($employee && $requisition->requesting_employee_id === $employee->id) {
            return Response::deny('A creator cannot reject their own requisition request.');
        }

        $isAdmin = $user->hasRole('System Administrator') || $user->hasPermissionTo('admin.super');

        if ($requisition->department_head_id === null) {
            if ($isAdmin) {
                if ($requisition->status !== RequisitionStatus::PendingDeptHead) {
                    return Response::deny('Only pending requisitions can be rejected.');
                }

                return Response::allow();
            }

            return Response::deny('This requisition has no assigned department head and must be rejected by an administrator.');
        }

        if ($employee === null || $requisition->department_head_id !== $employee->getKey()) {
            if ($isAdmin) {
                if ($requisition->status !== RequisitionStatus::PendingDeptHead) {
                    return Response::deny('Only pending requisitions can be rejected.');
                }

                return Response::allow();
            }

            return Response::deny('You are not the designated department head for this requisition.');
        }

        if ($requisition->status !== RequisitionStatus::PendingDeptHead) {
            return Response::deny('Only pending requisitions can be rejected.');
        }

        return Response::allow();
    }
}
