<?php

namespace App\Services;

use App\Models\Course;
use App\Models\InterviewCreditTransaction;
use App\Models\InterviewSession;
use App\Models\User;
use App\Models\UserCourseInterviewCredit;
use Illuminate\Database\DatabaseManager;
use RuntimeException;

class InterviewCreditService
{
    public function __construct(
        private readonly DatabaseManager $db
    ) {
    }

    /**
     * Grant credits when a course purchase completes.
     */
    public function creditCoursePurchase(User $user, Course $course, ?int $credits = null, array $context = []): ?InterviewCreditTransaction
    {
        $creditsToGrant = $credits ?? (int) ($course->interview_credits ?? 0);

        if ($creditsToGrant <= 0) {
            return null;
        }

        $meta = array_filter([
            'source' => 'course_purchase',
            'order_id' => $context['order_id'] ?? null,
            'order_uuid' => $context['order_uuid'] ?? null,
            'purchase_id' => $context['purchase_id'] ?? null,
        ]);

        return $this->adjustBalance(
            $user,
            $course,
            $creditsToGrant,
            $context['type'] ?? 'purchase_credit',
            $context['description'] ?? sprintf('Interview credits from %s purchase', $course->name),
            [
                'meta' => array_merge($meta, $context['meta'] ?? []),
            ]
        );
    }

    /**
     * Debit credits when creating an interview session. Throws if insufficient credits.
     */
    public function debitForSession(User $user, Course $course, int $credits, ?InterviewSession $session = null, array $context = []): InterviewCreditTransaction
    {
        if ($credits <= 0) {
            throw new RuntimeException('Debit amount must be positive.');
        }

        $meta = array_filter([
            'source' => 'interview_session',
            'session_id' => $session?->id,
            'session_uuid' => $session?->uuid,
        ]);

        return $this->adjustBalance(
            $user,
            $course,
            -1 * $credits,
            $context['type'] ?? 'session_debit',
            $context['description'] ?? 'Interview credits debited for session scheduling',
            [
                'meta' => array_merge($meta, $context['meta'] ?? []),
                'interview_session_id' => $session?->id,
            ]
        );
    }

    /**
     * Refund credits when a session fails/cancels.
     */
    public function refundForSession(User $user, Course $course, int $credits, ?InterviewSession $session = null, array $context = []): InterviewCreditTransaction
    {
        if ($credits <= 0) {
            throw new RuntimeException('Refund amount must be positive.');
        }

        $meta = array_filter([
            'source' => 'interview_session',
            'session_id' => $session?->id,
            'session_uuid' => $session?->uuid,
            'reason' => $context['reason'] ?? null,
        ]);

        return $this->adjustBalance(
            $user,
            $course,
            $credits,
            $context['type'] ?? 'session_refund',
            $context['description'] ?? 'Interview credits refunded',
            [
                'meta' => array_merge($meta, $context['meta'] ?? []),
                'interview_session_id' => $session?->id,
            ]
        );
    }

    /**
     * Core balance adjuster that records a ledger entry and updates cached totals.
     */
    protected function adjustBalance(
        User $user,
        Course $course,
        int $amount,
        string $type,
        ?string $description = null,
        array $context = []
    ): InterviewCreditTransaction {
        return $this->db->transaction(function () use ($user, $course, $amount, $type, $description, $context) {
            /** @var UserCourseInterviewCredit $balance */
            $balance = UserCourseInterviewCredit::query()
                ->where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->lockForUpdate()
                ->first();

            if (!$balance) {
                $balance = new UserCourseInterviewCredit([
                    'user_id' => $user->id,
                    'course_id' => $course->id,
                    'balance' => 0,
                    'lifetime_credited' => 0,
                    'lifetime_debited' => 0,
                ]);
            }

            $nextBalance = $balance->balance + $amount;

            if ($nextBalance < 0) {
                throw new RuntimeException('Insufficient interview credits for this operation.');
            }

            $balance->balance = $nextBalance;
            if ($amount > 0) {
                $balance->lifetime_credited += $amount;
            } elseif ($amount < 0) {
                $balance->lifetime_debited += abs($amount);
            }
            $balance->last_transaction_at = now();
            $balance->save();

            return InterviewCreditTransaction::query()->create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'interview_session_id' => $context['interview_session_id'] ?? null,
                'type' => $type,
                'amount' => $amount,
                'balance_after' => $balance->balance,
                'description' => $description,
                'meta' => $context['meta'] ?? [],
            ]);
        });
    }
}
