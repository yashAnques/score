<?php

namespace App\Jobs;

use App\Mail\InterviewReminderMail;
use App\Models\InterviewSession;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendInterviewReminder implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        protected int $sessionId,
        protected int $minutesBefore
    ) {
    }

    public function handle(): void
    {
        $session = InterviewSession::query()
            ->with(['user', 'course', 'slot'])
            ->find($this->sessionId);

        if (!$session || !$session->user || !$session->user->email) {
            return;
        }

        if (!in_array($session->status, ['scheduled', 'ready', 'in_progress'], true)) {
            return;
        }

        Mail::to($session->user->email)->send(new InterviewReminderMail($session, $this->minutesBefore));
    }
}
