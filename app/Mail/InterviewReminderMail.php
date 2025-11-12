<?php

namespace App\Mail;

use App\Models\InterviewSession;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InterviewReminderMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public InterviewSession $session,
        public int $minutesBefore,
    ) {
    }

    public function build(): self
    {
        $courseName = $this->session->course?->name ?? 'your MBA mentor';

        return $this->subject("Interview reminder · {$courseName}")
            ->markdown('emails.interview.reminder', [
                'session' => $this->session,
                'minutesBefore' => $this->minutesBefore,
                'courseName' => $courseName,
                'startAt' => $this->session->slot?->starts_at ?? $this->session->scheduled_at,
                'joinUrl' => route('interviews.index'),
            ]);
    }
}
