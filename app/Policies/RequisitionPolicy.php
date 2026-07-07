<?php

namespace App\Policies;

use App\Enums\RequisitionStatus;
use App\Models\Employee;
use App\Models\Requisition;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * Centralizes authorization rules for Requisitions. Replaces the inline
 * checks previously living in RequisitionController.
 */
class RequisitionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): Response
    {
        return $user->hasPermissionTo('inventory.view')
            ? Response::allow()
            : Response::deny('You do not have permission to view requisitions.');
    }

    /**
     * Determine whether the user can view the model.
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
     * A user can approve a requisition only if:
     *  - they hold `request.approve`
     *  - they are NOT the requesting employee (no self-approval)
     *  - either they are the assigned department head, OR they are an admin
     *    and the requisition has no department head assigned.
     */
    public function approve(User $user, Requisition $requisition): Response
    {
        if (! $user->hasPermissionTo('request.approve')) {
            return Response::deny('You do not have permission to approve requisitions.');
        }

        $employee = $user->employee()->first();

        if ($employee && $requisition->requesting_employee_id === $employee->id) {
            return Response::deny('A creator cannot approve their own requisition request.');
        }

        if ($requisition->department_head_id === null) {
            return Response::deny('This requisition has no assigned department head and must be approved by an administrator.');
        }

        if ($employee === null || $requisition->department_head_id !== $employee->getKey()) {
            return Response::deny('You are not the designated department head for this requisition.');
        }

        if ($requisition->status !== RequisitionStatus::PendingDeptHead) {
            return Response::deny('Only pending requisitions can be approved.');
        }

        return Response::allow();
    }

    /**
     * A requisition can be issued only by users with `warehouse.issue` AND
     * only when it is in a state from which issuance is allowed.
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
}
