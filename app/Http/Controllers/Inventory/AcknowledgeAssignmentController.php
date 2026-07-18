<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\PropertyAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AcknowledgeAssignmentController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, PropertyAssignment $assignment): RedirectResponse
    {
        // Check if already acknowledged
        if ($assignment->acknowledged_at) {
            return back()->with('error', 'This assignment has already been acknowledged.');
        }

        // Must be the assignee (or for now we just verify they are authenticated)
        $userId = $request->user()->id;

        $assignment->acknowledge($userId);

        return back()->with('success', 'Property assignment acknowledged successfully with digital signature.');
    }
}
