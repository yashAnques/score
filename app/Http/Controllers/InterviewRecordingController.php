<?php

namespace App\Http\Controllers;

use App\Jobs\FinalizeInterviewRecording;
use App\Models\InterviewSession;
use App\Services\InterviewRecordingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class InterviewRecordingController extends Controller
{
    public function store(
        Request $request,
        InterviewSession $session,
        InterviewRecordingService $service
    ): JsonResponse {
        if ($session->user_id !== $request->user()?->id) {
            abort(403);
        }

        $validated = $request->validate([
            'chunk_index' => ['required', 'integer', 'min:0'],
            'duration_seconds' => ['required', 'integer', 'min:1'],
            'total_chunks' => ['nullable', 'integer', 'min:1'],
            'is_last_chunk' => ['nullable', 'boolean'],
            'file' => ['required', 'file', 'max:51200'],
        ]);

        $totalChunks = isset($validated['total_chunks']) ? (int) $validated['total_chunks'] : null;

        try {
            $path = $service->storeChunk(
                $session,
                $request->file('file'),
                (int) $validated['chunk_index'],
                (int) $validated['duration_seconds'],
                (bool) ($validated['is_last_chunk'] ?? false),
                $totalChunks,
            );
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        if (!empty($validated['is_last_chunk'])) {
            FinalizeInterviewRecording::dispatch($session->id);
        }

        return response()->json([
            'disk' => $service->getDisk(),
            'path' => $path,
        ]);
    }
}
