<?php

namespace App\Mail;

use App\Models\CoursePurchase;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CoursePurchasedMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public Order $order,
        public CoursePurchase $purchase,
    ) {
    }

    /**
     * Build the message.
     */
    public function build(): self
    {
        $course = $this->order->course;

        return $this->subject("You're enrolled in {$course->name}")
            ->markdown('emails.course-purchased', [
                'order' => $this->order,
                'purchase' => $this->purchase,
                'course' => $course,
            ]);
    }
}
