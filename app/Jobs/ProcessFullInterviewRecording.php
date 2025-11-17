<?php

namespace App\Jobs;

use App\Models\InterviewSession;
use App\Services\InterviewRecordingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessFullInterviewRecording implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 0;

    public function __construct(
        protected int $sessionId,
        protected string $disk,
        protected string $sourcePath,
        protected int $durationSeconds
    ) {
        $this->onQueue('recordings');
    }

    public function handle(InterviewRecordingService $recordingService): void
    {
        $session = InterviewSession::query()->find($this->sessionId);

        if (!$session) {
            return;
        }

        $recordingService->processFullRecording($session, $this->disk, $this->sourcePath, $this->durationSeconds);
    }
}
