<?php

namespace App\Http\Controllers;

use App\Models\InterviewSlot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterviewSlotController extends Controller
{
    /**
     * List upcoming interview slots with availability details.
     */
    public function index(Request $request): JsonResponse
    {
        $now = now();

        $query = InterviewSlot::query()
            ->with('course:id,name,slug')
            ->where('is_active', true)
            ->where('starts_at', '>=', $now)
            ->whereColumn('booked_count', '<', 'capacity')
            ->orderBy('starts_at');

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->integer('course_id'));
        }

        if ($request->filled('date')) {
            $query->whereDate('slot_date', $request->date('date'));
        }

        $slots = $query->get()->map(fn (InterviewSlot $slot) => [
            'id' => $slot->id,
            'course' => $slot->course ? [
                'id' => $slot->course->id,
                'name' => $slot->course->name,
                'slug' => $slot->course->slug,
            ] : null,
            'startsAt' => $slot->starts_at?->toIso8601String(),
            'endsAt' => $slot->ends_at?->toIso8601String(),
            'timezone' => $slot->timezone,
            'capacity' => (int) $slot->capacity,
            'bookedCount' => (int) $slot->booked_count,
            'available' => max((int) $slot->capacity - (int) $slot->booked_count, 0),
            'meta' => $slot->meta,
        ]);

        return response()->json([
            'slots' => $slots,
        ]);
    }
}
