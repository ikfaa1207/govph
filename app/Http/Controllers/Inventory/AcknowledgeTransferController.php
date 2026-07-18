<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\PropertyTransfer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AcknowledgeTransferController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request, PropertyTransfer $transfer): RedirectResponse
    {
        // Check if already acknowledged
        if ($transfer->acknowledged_at) {
            return back()->with('error', 'This transfer has already been acknowledged.');
        }

        $userId = $request->user()->id;

        $transfer->acknowledge($userId);

        return back()->with('success', 'Property transfer acknowledged successfully with digital signature.');
    }
}
