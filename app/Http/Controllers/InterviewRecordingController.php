<?php

namespace App\Http\Controllers;

use App\Jobs\FinalizeInterviewRecording;
use App\Jobs\ProcessFullInterviewRecording;
use App\Models\InterviewSession;
use App\Services\InterviewRecordingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'full_recording' => ['sometimes', 'boolean'],
            'chunk_index' => ['required_without:full_recording', 'integer', 'min:0'],
            'duration_seconds' => ['required', 'integer', 'min:1'],
            'total_chunks' => ['nullable', 'integer', 'min:1'],
            'is_last_chunk' => ['nullable', 'boolean'],
            'file' => ['required', 'file', 'max:512000'],
        ]);

        if (!empty($validated['full_recording'])) {
            $disk = $service->getDisk();
            $file = $request->file('file');
            $extension = $file->getClientOriginalExtension() ?: 'webm';
            $storedPath = $file->storeAs(
                sprintf('interviews/%s/%s/full-uploads', $session->user_id, $session->uuid),
                'raw-' . now()->format('YmdHis') . '.' . $extension,
                $disk
            );

            ProcessFullInterviewRecording::dispatch(
                $session->id,
                $disk,
                $storedPath,
                (int) $validated['duration_seconds']
            );

            return response()->json([
                'disk' => $disk,
                'path' => $storedPath,
                'status' => 'processing',
            ], 202);
        }

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

    public function download(InterviewSession $session)
    {
        $this->authorizeSession($session);

        if (!$session->recording_manifest_path) {
            abort(404);
        }

        $disk = $session->meta['recording_disk'] ?? app(InterviewRecordingService::class)->getDisk();

        if (!Storage::disk($disk)->exists($session->recording_manifest_path)) {
            abort(404);
        }

        return Storage::disk($disk)->download($session->recording_manifest_path);
    }

    protected function authorizeSession(InterviewSession $session): void
    {
        if ($session->user_id !== request()->user()?->id) {
            abort(403);
        }
    }
}
