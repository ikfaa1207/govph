<?php

namespace App\Policies;

use App\Enums\PhysicalCountStatus;
use App\Models\PhysicalCount;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PhysicalCountPolicy
{
    /**
     * Determine whether the user can view any physical counts.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can initiate a physical count.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('reports.view');
    }

    /**
     * Determine whether the user can view a specific physical count.
     */
    public function view(User $user, PhysicalCount $physicalCount): Response
    {
        if ($user->hasPermissionTo('reports.view')) {
            return Response::allow();
        }

        $employee = $user->employee;
        if (! $employee) {
            return Response::deny('You must have an employee profile to view physical counts.');
        }

        if ($physicalCount->created_by === $employee->id) {
            return Response::allow();
        }

        $isCommitteeMember = in_array($physicalCount->status, [PhysicalCountStatus::PendingReview, PhysicalCountStatus::Finalized], true)
            && $physicalCount->committees()->where('employee_id', $employee->id)->exists();

        if ($isCommitteeMember) {
            return Response::allow();
        }

        return Response::deny('You are not authorized to view this physical count.');
    }

    /**
     * Determine whether the user can update a specific physical count.
     */
    public function update(User $user, PhysicalCount $physicalCount): Response
    {
        if ($user->hasPermissionTo('reports.view')) {
            return Response::allow();
        }

        $employee = $user->employee;
        if (! $employee) {
            return Response::deny('You must have an employee profile to update physical counts.');
        }

        if ($physicalCount->created_by === $employee->id) {
            return Response::allow();
        }

        return Response::deny('You are not authorized to update this physical count.');
    }

    /**
     * Determine whether the user can review a specific physical count.
     */
    public function review(User $user, PhysicalCount $physicalCount): Response
    {
        $employee = $user->employee;
        if (! $employee) {
            return Response::deny('You must have an employee profile to review physical counts.');
        }

        $isCommitteeMember = $physicalCount->committees()->where('employee_id', $employee->id)->exists();
        if ($isCommitteeMember) {
            return Response::allow();
        }

        return Response::deny('You are not assigned to the committee for this physical count.');
    }

    /**
     * Determine whether the user can delete a specific physical count.
     */
    public function delete(User $user, PhysicalCount $physicalCount): Response
    {
        $employee = $user->employee;
        if (! $employee) {
            return Response::deny('You must have an employee profile to delete physical counts.');
        }

        if ($physicalCount->created_by === $employee->id) {
            return Response::allow();
        }

        return Response::deny('Only the creator of the physical count can delete it.');
    }
}
