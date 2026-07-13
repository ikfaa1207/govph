<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Models\Ticket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class HelpdeskController extends Controller
{
    /**
     * Display the Helpdesk page with relevant tickets.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('ticket.viewAny');

        $user = $request->user();

        // Determine if user has admin privileges
        $isAdmin = Gate::allows('ticket.manage');

        if ($isAdmin) {
            $tickets = Inertia::scroll(fn () => Ticket::with('user.employee')
                ->orderBy('created_at', 'desc')
                ->paginate(10));
        } else {
            $tickets = Inertia::scroll(fn () => Ticket::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate(10));
        }

        return Inertia::render('inventory/helpdesk/index', [
            'tickets' => $tickets,
            'isAdmin' => $isAdmin,
        ]);
    }

    /**
     * Store a newly created support ticket in database.
     */
    public function store(StoreTicketRequest $request): RedirectResponse
    {
        Gate::authorize('ticket.create');

        $validated = $request->validated();

        if ($request->hasFile('attachment')) {
            $validated['attachment_path'] = $request->file('attachment')->store('attachments', 'public');
        }

        unset($validated['attachment']);

        $request->user()->tickets()->create($validated);

        return redirect()->back()->with('success', 'Support ticket submitted successfully.');
    }

    /**
     * Update the status and admin notes of a support ticket (Admin only).
     */
    public function update(UpdateTicketRequest $request, Ticket $ticket): RedirectResponse
    {
        Gate::authorize('ticket.update', $ticket);

        $validated = $request->validated();

        $ticket->update($validated);

        return redirect()->back()->with('success', 'Ticket updated successfully.');
    }
}
