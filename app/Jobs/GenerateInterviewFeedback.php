<?php

namespace App\Jobs;

use App\Models\InterviewSession;
use App\Services\InterviewFeedbackService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateInterviewFeedback implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        protected int $sessionId
    ) {
    }

    public function handle(InterviewFeedbackService $service): void
    {
        $session = InterviewSession::query()
            ->with(['questions' => fn($query) => $query->orderBy('sequence')])
            ->find($this->sessionId);

        if (!$session || $session->status !== 'completed') {
            return;
        }

        $summary = $service->generateFeedback($session);

        $session->forceFill([
            'feedback_summary' => $summary,
            'feedback_generated_at' => now(),
        ])->save();
    }
}
