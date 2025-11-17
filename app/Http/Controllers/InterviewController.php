<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\InterviewCreditTransaction;
use App\Models\InterviewSession;
use App\Models\InterviewSlot;
use App\Models\UserCourseInterviewCredit;
use App\Services\InterviewRecordingService;
use App\Services\InterviewSettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class InterviewController extends Controller
{
    public function index(Request $request, InterviewSettingService $settings): Response
    {
        $user = $request->user();

        $courses = Course::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(fn(Course $course) => [
                'id' => $course->id,
                'name' => $course->name,
                'slug' => $course->slug,
                'imageUrl' => $course->image_url,
                'interviewCredits' => (int) $course->interview_credits,
            ])
            ->values();

        $balances = UserCourseInterviewCredit::query()
            ->with('course:id,name,slug,interview_credits')
            ->where('user_id', $user->id)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn(UserCourseInterviewCredit $credit) => [
                'course' => $credit->course ? [
                    'id' => $credit->course->id,
                    'name' => $credit->course->name,
                    'slug' => $credit->course->slug,
                    'defaultCredits' => (int) $credit->course->interview_credits,
                ] : null,
                'balance' => (int) $credit->balance,
                'lifetimeCredited' => (int) $credit->lifetime_credited,
                'lifetimeDebited' => (int) $credit->lifetime_debited,
                'lastTransactionAt' => optional($credit->last_transaction_at)?->toIso8601String(),
                'updatedAt' => optional($credit->updated_at)?->toIso8601String(),
            ]);

        $transactions = InterviewCreditTransaction::query()
            ->with('course:id,name,slug')
            ->where('user_id', $user->id)
            ->latest()
            ->limit(25)
            ->get()
            ->map(fn(InterviewCreditTransaction $transaction) => [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'amount' => (int) $transaction->amount,
                'balanceAfter' => (int) $transaction->balance_after,
                'description' => $transaction->description,
                'course' => $transaction->course ? [
                    'id' => $transaction->course->id,
                    'name' => $transaction->course->name,
                    'slug' => $transaction->course->slug,
                ] : null,
                'meta' => $transaction->meta,
                'createdAt' => optional($transaction->created_at)?->toIso8601String(),
            ]);

        $slots = InterviewSlot::query()
            ->with('course:id,name,slug')
            ->where('is_active', true)
            ->where('starts_at', '>=', now())
            ->whereColumn('booked_count', '<', 'capacity')
            ->orderBy('starts_at')
            ->limit(12)
            ->get()
            ->map(fn(InterviewSlot $slot) => [
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

        $sessions = InterviewSession::query()
            ->with(['course:id,name,slug', 'slot:id,starts_at,ends_at,timezone'])
            ->where('user_id', $user->id)
            ->latest('scheduled_at')
            ->limit(8)
            ->get()
            ->map(function (InterviewSession $session) {
                $recordingUrl = null;

                // Build the recording URL if manifest exists
                if ($session->recording_manifest_path) {
                    $recordingService = app(InterviewRecordingService::class);
                    $disk = $session->meta['recording_disk'] ?? $recordingService->getDisk();

                    // Prefer the signed download route for local disk; otherwise try storage URLs with fallback.
                    if ($disk === 'local') {
                        $recordingUrl = route('interviews.sessions.recordings.download', $session);
                    } else {
                        try {
                            $storage = Storage::disk($disk);

                            if (method_exists($storage, 'temporaryUrl')) {
                                $recordingUrl = $storage->temporaryUrl(
                                    $session->recording_manifest_path,
                                    now()->addHours(6)
                                );
                            } else {
                                $recordingUrl = $storage->url($session->recording_manifest_path);
                            }
                        } catch (\Throwable $exception) {
                            $recordingUrl = null;
                        }

                        if (!$recordingUrl) {
                            $recordingUrl = route('interviews.sessions.recordings.download', $session);
                        }
                    }
                }

                return [
                    'id' => $session->id,
                    'uuid' => $session->uuid,
                    'status' => $session->status,

                    'course' => $session->course ? [
                        'id' => $session->course->id,
                        'name' => $session->course->name,
                        'slug' => $session->course->slug,
                    ] : null,

                    'slot' => $session->slot ? [
                        'id' => $session->slot->id,
                        'startsAt' => $session->slot->starts_at?->toIso8601String(),
                        'endsAt' => $session->slot->ends_at?->toIso8601String(),
                        'timezone' => $session->slot->timezone,
                    ] : null,

                    'candidateRole' => $session->candidate_role,
                    'questionLimit' => (int) $session->question_limit,
                    'questionsAsked' => (int) $session->questions_asked,
                    'creditsDebited' => (int) $session->credits_debited,
                    'scheduledAt' => $session->scheduled_at?->toIso8601String(),
                    'startedAt' => $session->started_at?->toIso8601String(),
                    'completedAt' => $session->completed_at?->toIso8601String(),
                    'cancelledAt' => $session->cancelled_at?->toIso8601String(),
                    'feedbackSummary' => $session->feedback_summary,
                    'feedbackGeneratedAt' => $session->feedback_generated_at?->toIso8601String(),
                    'recordingUrl' => $recordingUrl,
                ];
            });

        $settingsPayload = [
            'minRecordingSeconds' => $settings->getInt('interview.recording.min_seconds', 6),
            'questionLimit' => $settings->getInt('interview.question.limit', 8),
            'creditCost' => $settings->getInt('interview.session.credit_cost', 1),
            'reminderOffsets' => array_map(
                static fn($value) => (int) $value,
                $settings->get('interview.reminders.minutes', []) ?? []
            ),
            'controls' => [
                'repeatQuestion' => $settings->getBool('interview.controls.repeat_question.visible', true),
                'recordAnswer' => $settings->getBool('interview.controls.record_answer.visible', true),
                'nextButton' => $settings->getBool('interview.controls.next.visible', true),
            ],
            'restrictions' => [
                'cancelOnTabSwitch' => $settings->getBool('interview.cheating.cancel_on_tab_switch', true),
            ],
        ];

        return Inertia::render('interviews', [
            'courses' => $courses,
            'credits' => [
                'balances' => $balances,
                'transactions' => $transactions,
            ],
            'slots' => $slots,
            'sessions' => $sessions,
            'settings' => $settingsPayload,
        ]);
    }
}
