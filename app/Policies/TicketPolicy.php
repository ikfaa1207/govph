<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    /**
     * Determine whether the user can view any tickets.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create a support ticket.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update a ticket.
     */
    public function update(User $user, Ticket $ticket): bool
    {
        return $user->hasPermissionTo('users.manage');
    }

    /**
     * Determine whether the user can manage helpdesk tickets.
     */
    public function manage(User $user): bool
    {
        return $user->hasPermissionTo('users.manage');
    }
}
