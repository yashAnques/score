<?php

namespace App\Jobs;

use App\Models\InterviewSession;
use App\Services\InterviewRecordingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class FinalizeInterviewRecording implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public int $sessionId)
    {
        $this->onQueue('recordings');
    }

    public function handle(InterviewRecordingService $recordingService): void
    {
        // $session = InterviewSession::query()->find($this->sessionId);
        // if (!$session) {
        //     return;
        // }

        // $recordingService->finalizeRecording($session);
    }
}
