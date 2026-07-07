<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
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
        Gate::authorize('viewAny', Ticket::class);

        $user = $request->user();

        // Determine if user has admin privileges
        $isAdmin = $user->can('users.manage');

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
    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', Ticket::class);

        if ($request->has('attachment') && ! $request->hasFile('attachment')) {
            $request->request->remove('attachment');
            $request->files->remove('attachment');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:technical,discrepancy,request,other'],
            'priority' => ['required', 'string', 'in:low,medium,high'],
            'description' => ['required', 'string', 'max:5000'],
            'attachment' => ['nullable', 'file', 'mimes:jpeg,png,jpg,gif,pdf', 'max:5120'],
        ]);

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
    public function update(Request $request, Ticket $ticket): RedirectResponse
    {
        Gate::authorize('update', $ticket);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:open,in_progress,resolved'],
            'admin_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $ticket->update($validated);

        return redirect()->back()->with('success', 'Ticket updated successfully.');
    }
}
