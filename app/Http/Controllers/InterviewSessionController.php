<?php

namespace App\Http\Controllers;

use App\Http\Requests\CancelInterviewSessionRequest;
use App\Http\Requests\ScheduleInterviewRequest;
use App\Http\Requests\SubmitInterviewAnswerRequest;
use App\Jobs\SendInterviewReminder;
use App\Jobs\GenerateInterviewFeedback;
use App\Jobs\FinalizeInterviewRecording;
use App\Models\Course;
use App\Models\InterviewQuestion;
use App\Models\InterviewSession;
use App\Models\InterviewSlot;
use App\Models\UserCourseInterviewCredit;
use App\Services\InterviewCreditService;
use App\Services\InterviewQuestionService;
use App\Services\InterviewRecordingService;
use App\Services\InterviewSettingService;
use App\Services\SopValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class InterviewSessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sessions = InterviewSession::query()
            ->with(['course:id,name,slug', 'slot:id,starts_at,ends_at,timezone'])
            ->where('user_id', $request->user()->id)
            ->latest('scheduled_at')
            ->limit(max(min($request->integer('limit', 25), 100), 1))
            ->get()
            ->map(fn (InterviewSession $session) => $this->serializeSession($session));

        return response()->json([
            'sessions' => $sessions,
        ]);
    }

    public function store(
        ScheduleInterviewRequest $request,
        InterviewCreditService $creditService,
        InterviewSettingService $settingService,
        SopValidationService $sopValidationService,
    ): JsonResponse {
        $user = $request->user();
        $course = $this->resolveCourse($request);

        $slotId = $request->integer('interview_slot_id');

        $questionLimit = max(1, $settingService->getInt('interview.question.limit', 8));
        $creditsRequired = max(1, $settingService->getInt('interview.session.credit_cost', 1));
        $storageDisk = $settingService->get('interview.storage.disk', config('filesystems.interview_disk', 'local')) ?: 'local';
        if (app()->environment('local')) {
            $storageDisk = 'local';
        }
        $sopFilePath = null;
        $sopOriginalName = null;

        if ($request->hasFile('sop_file')) {
            $sopFile = $request->file('sop_file');
            // try {
            //     $sopValidationService->assertValid($sopFile);
            // } catch (RuntimeException $exception) {
            //     throw ValidationException::withMessages([
            //         'sop_file' => $exception->getMessage(),
            //     ]);
            // }
            $sopFilePath = $sopFile->store(sprintf('interviews/%s/sop', $user->id), $storageDisk);
            $sopOriginalName = $sopFile->getClientOriginalName();
        }

        try {
            $session = DB::transaction(function () use ($user, $course, $slotId, $questionLimit, $creditsRequired, $request, $creditService, $sopFilePath, $sopOriginalName, $storageDisk) {
                /** @var InterviewSlot $slot */
                $slot = InterviewSlot::query()
                    ->where('id', $slotId)
                    ->lockForUpdate()
                    ->firstOrFail();

                if (!$slot->is_active) {
                    throw ValidationException::withMessages([
                        'interview_slot_id' => 'This slot is not available.',
                    ]);
                }

                if ($slot->starts_at->isPast()) {
                    throw ValidationException::withMessages([
                        'interview_slot_id' => 'Slot start time has already passed.',
                    ]);
                }

                if ($slot->course_id && $slot->course_id !== $course->id) {
                    throw ValidationException::withMessages([
                        'interview_slot_id' => 'Selected slot is not available for this course.',
                    ]);
                }

                if ($slot->booked_count >= $slot->capacity) {
                    throw ValidationException::withMessages([
                        'interview_slot_id' => 'This slot is fully booked.',
                    ]);
                }

                $slot->increment('booked_count');

                $session = InterviewSession::query()->create([
                    'uuid' => (string) Str::uuid(),
                    'user_id' => $user->id,
                    'course_id' => $course->id,
                    'interview_slot_id' => $slot->id,
                    'status' => 'scheduled',
                    'candidate_role' => $request->string('candidate_role')->toString(),
                    'question_limit' => $questionLimit,
                    'scheduled_at' => $slot->starts_at,
                    'meta' => array_filter([
                        'sop_file' => $sopFilePath ? [
                            'disk' => $storageDisk,
                            'path' => $sopFilePath,
                            'original_name' => $sopOriginalName,
                        ] : null,
                    ], static fn ($value) => $value !== null && $value !== ''),
                ]);

                $creditService->debitForSession($user, $course, $creditsRequired, $session);

                $session->update(['credits_debited' => $creditsRequired]);

                return $session;
            });
            $this->scheduleSessionReminders($session, $settingService->get('interview.reminders.minutes', []) ?? []);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages([
                'credits' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'session' => $this->serializeSession($session->loadMissing(['course:id,name,slug', 'slot:id,starts_at,ends_at,timezone'])),
        ], 201);
    }

    public function validateSop(Request $request, SopValidationService $sopValidationService): JsonResponse
    {
        $validated = $request->validate([
            'sop_file' => ['required', 'file', 'mimetypes:application/pdf', 'max:20480'],
            'college_name' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $request->file('sop_file');

        if (!$file) {
            return response()->json([
                'valid' => false,
                'message' => 'Please upload a valid SOP file.',
            ], 422);
        }

        try {
            $collegeName = $validated['college_name'] ?? null;
            $sopValidationService->assertValid($file, $collegeName ? (string) $collegeName : null);
        } catch (RuntimeException $exception) {
            return response()->json([
                'valid' => false,
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'message' => 'SOP looks good.',
        ]);
    }

    public function start(
        Request $request,
        InterviewSession $session,
        InterviewQuestionService $questionService
    ): JsonResponse {
        $this->ensureSessionOwner($request, $session);

        if (!in_array($session->status, ['scheduled', 'ready', 'in_progress'], true)) {
            throw ValidationException::withMessages([
                'session' => 'This interview cannot be started right now.',
            ]);
        }

        if (!$session->started_at) {
            $session->forceFill([
                'status' => 'in_progress',
                'started_at' => now(),
            ])->save();
        } else {
            $session->forceFill([
                'status' => 'in_progress',
            ])->save();
        }

        $latestQuestion = $session->questions()->latest('sequence')->first();
        if ($latestQuestion && !$latestQuestion->answered_at) {
            $question = $latestQuestion;
        } elseif ($session->questions_asked < $session->question_limit) {
            $question = $questionService->issueQuestion($session);
        } else {
            $question = $latestQuestion;
        }

        return response()->json([
            'session' => $this->serializeSession($session),
            'question' => $this->formatQuestion($question),
        ]);
    }

    public function nextQuestion(
        Request $request,
        InterviewSession $session,
        InterviewQuestionService $questionService
    ): JsonResponse {
        $this->ensureSessionOwner($request, $session);

        if ($session->status !== 'in_progress') {
            throw ValidationException::withMessages([
                'session' => 'You need to start the interview before requesting the next question.',
            ]);
        }

        $latest = $session->questions()->latest('sequence')->first();

        if (!$latest || !$latest->answered_at) {
            throw ValidationException::withMessages([
                'question' => 'Please record an answer before moving to the next question.',
            ]);
        }

        if ($session->questions_asked >= $session->question_limit) {
            throw ValidationException::withMessages([
                'question' => 'Question limit reached for this interview.',
            ]);
        }

        $question = $questionService->issueQuestion($session);

        return response()->json([
            'question' => $this->formatQuestion($question),
            'session' => $this->serializeSession($session),
        ]);
    }

    public function submitAnswer(
        SubmitInterviewAnswerRequest $request,
        InterviewSession $session,
        InterviewQuestion $question
    ): JsonResponse {
        $this->ensureSessionOwner($request, $session);

        if ($question->interview_session_id !== $session->id) {
            abort(404);
        }

        if ($session->status !== 'in_progress') {
            throw ValidationException::withMessages([
                'session' => 'The interview must be in progress to submit answers.',
            ]);
        }

        if ($question->answered_at) {
            throw ValidationException::withMessages([
                'question' => 'This question has already been answered.',
            ]);
        }

        $question->fill([
            'answer_notes' => $request->input('answer_notes'),
            'answer_transcript' => $request->input('answer_transcript'),
            'answer_duration_seconds' => $request->integer('answer_duration_seconds'),
            'answer_recording_path' => $request->input('answer_recording_path'),
            'answered_at' => now(),
        ])->save();

        return response()->json([
            'question' => $this->formatQuestion($question),
        ]);
    }

    public function complete(Request $request, InterviewSession $session): JsonResponse
    {
        $this->ensureSessionOwner($request, $session);

        if (!in_array($session->status, ['in_progress', 'scheduled'], true)) {
            throw ValidationException::withMessages([
                'session' => 'Only active interviews can be completed.',
            ]);
        }

        $latest = $session->questions()->latest('sequence')->first();
        if ($latest && !$latest->answered_at) {
            throw ValidationException::withMessages([
                'question' => 'Please finish answering the current question before completing.',
            ]);
        }

        $session->forceFill([
            'status' => 'completed',
            'completed_at' => now(),
        ])->save();

        if (!$session->recording_manifest_path) {
            FinalizeInterviewRecording::dispatch($session->id)->onQueue('recordings');
        }

        GenerateInterviewFeedback::dispatch($session->id);

        return response()->json([
            'session' => $this->serializeSession($session),
        ]);
    }

    public function cancel(
        CancelInterviewSessionRequest $request,
        InterviewSession $session,
        InterviewCreditService $creditService
    ): JsonResponse {
        $this->ensureSessionOwner($request, $session);

        if (in_array($session->status, ['completed', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'session' => 'This session can no longer be cancelled.',
            ]);
        }

        $session->forceFill([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancel_reason' => $request->input('reason', 'user_cancelled'),
        ])->save();

        $session->loadMissing(['course', 'user']);

        if ($session->credits_debited > 0 && $session->course && $session->user) {
            $creditService->refundForSession(
                $session->user,
                $session->course,
                $session->credits_debited,
                $session,
                [
                    'description' => 'Interview cancelled - credits refunded',
                    'reason' => $session->cancel_reason,
                ]
            );
        }

        return response()->json([
            'session' => $this->serializeSession($session),
        ]);
    }

    protected function serializeSession(InterviewSession $session): array
    {
        $session->loadMissing(['course:id,name,slug', 'slot:id,starts_at,ends_at,timezone']);

        $recordingUrl = null;
        if ($session->recording_manifest_path) {
            $recordingService = app(InterviewRecordingService::class);
            $disk = $session->meta['recording_disk'] ?? $recordingService->getDisk();

            // For local disk, prefer the signed download route so files outside public/ are reachable.
            if ($disk === 'local') {
                $recordingUrl = route('interviews.sessions.recordings.download', $session);
            } else {
                try {
                    $storage = Storage::disk($disk);
                    if (method_exists($storage, 'temporaryUrl')) {
                        $recordingUrl = $storage->temporaryUrl($session->recording_manifest_path, now()->addHours(6));
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
            'scheduledAt' => optional($session->scheduled_at)?->toIso8601String(),
            'startedAt' => optional($session->started_at)?->toIso8601String(),
            'completedAt' => optional($session->completed_at)?->toIso8601String(),
            'cancelledAt' => optional($session->cancelled_at)?->toIso8601String(),
            'feedbackSummary' => $session->feedback_summary,
            'feedbackGeneratedAt' => optional($session->feedback_generated_at)?->toIso8601String(),
            'recordingPath' => $session->recording_manifest_path,
            'recordingUrl' => $recordingUrl,
        ];
    }

    protected function formatQuestion(InterviewQuestion $question): array
    {
        return [
            'id' => $question->id,
            'sequence' => $question->sequence,
            'question' => $question->question,
            'answerNotes' => $question->answer_notes,
            'answerTranscript' => $question->answer_transcript,
            'answerRecordingPath' => $question->answer_recording_path,
            'answerDurationSeconds' => (int) $question->answer_duration_seconds,
            'askedAt' => optional($question->asked_at)?->toIso8601String(),
            'answeredAt' => optional($question->answered_at)?->toIso8601String(),
        ];
    }

    protected function ensureSessionOwner(Request $request, InterviewSession $session): void
    {
        if ($session->user_id !== $request->user()?->id) {
            abort(403);
        }
    }

    protected function scheduleSessionReminders(InterviewSession $session, array $offsets): void
    {
        if (!$session->scheduled_at) {
            return;
        }

        $uniqueOffsets = collect($offsets)
            ->filter(static fn ($value) => is_numeric($value) && (int) $value > 0)
            ->map(static fn ($value) => (int) $value)
            ->unique()
            ->all();

        foreach ($uniqueOffsets as $minutes) {
            $remindAt = $session->scheduled_at->copy()->subMinutes($minutes);
            if ($remindAt->isPast()) {
                continue;
            }

            SendInterviewReminder::dispatch($session->id, $minutes)->delay($remindAt);
        }
    }

    protected function resolveCourse(Request $request): Course
    {
        if ($request->filled('course_id')) {
            return Course::query()
                ->where('is_active', true)
                ->findOrFail($request->integer('course_id'));
        }

        $userId = $request->user()->id;
        $credit = UserCourseInterviewCredit::query()
            ->with('course')
            ->where('user_id', $userId)
            ->where('balance', '>', 0)
            ->orderByDesc('balance')
            ->first();

        if ($credit && $credit->course) {
            return $credit->course;
        }

        throw ValidationException::withMessages([
            'credits' => 'You do not have interview credits available. Please purchase a course to continue.',
        ]);
    }
}
