<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HelpdeskController extends Controller
{
    /**
     * Display the Helpdesk page with relevant tickets.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        
        // Determine if user has admin privileges
        $isAdmin = $user->hasRole('System Administrator') || $user->hasPermissionTo('users.manage');

        if ($isAdmin) {
            $tickets = Ticket::with('user.employee')
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            $tickets = Ticket::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();
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
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:technical,discrepancy,request,other'],
            'priority' => ['required', 'string', 'in:low,medium,high'],
            'description' => ['required', 'string', 'max:5000'],
        ]);

        $request->user()->tickets()->create($validated);

        return redirect()->back()->with('success', 'Support ticket submitted successfully.');
    }

    /**
     * Update the status and admin notes of a support ticket (Admin only).
     */
    public function update(Request $request, Ticket $ticket): RedirectResponse
    {
        $user = $request->user();
        $isAdmin = $user->hasRole('System Administrator') || $user->hasPermissionTo('users.manage');

        if (!$isAdmin) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:open,in_progress,resolved'],
            'admin_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $ticket->update($validated);

        return redirect()->back()->with('success', 'Ticket updated successfully.');
    }
}
