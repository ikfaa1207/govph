<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TourController extends Controller
{
    /**
     * Mark a tour as completed for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tour_id' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $completedTours = $user->completed_tours ?? [];

        if (! in_array($validated['tour_id'], $completedTours, true)) {
            $completedTours[] = $validated['tour_id'];
            $user->completed_tours = array_values($completedTours);
            $user->save();
        }

        return response()->json([
            'success' => true,
            'completed_tours' => $user->completed_tours,
        ]);
    }

    /**
     * Reset all completed tours for the authenticated user.
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->completed_tours = [];
        $user->save();

        return response()->json([
            'success' => true,
            'completed_tours' => [],
        ]);
    }
}
