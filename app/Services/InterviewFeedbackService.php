<?php

namespace App\Services;

use App\Models\InterviewQuestion;
use App\Models\InterviewSession;
use App\Services\Ai\AiProviderResolver;
use App\Services\InterviewSettingService;
use Illuminate\Container\Attributes\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Str;

class InterviewFeedbackService
{
    public function __construct(
        protected InterviewSettingService $settings,
        protected AiProviderResolver $aiProviders
    ) {
    }

    public function generateFeedback(InterviewSession $session): string
    {
        $questions = $session->questions()->orderBy('sequence')->get();
        $questionSnippets = $questions
            ->map(fn (InterviewQuestion $question) => sprintf(
                '%d. %s — answered in %ss%s',
                $question->sequence,
                Str::limit($question->question, 140),
                $question->answer_duration_seconds ?: '0',
                $question->answer_notes ? ' (notes: '.Str::limit($question->answer_notes, 80).')' : ''
            ))
            ->implode("\n");

        $prompt = DB::table('ai_prompts')->where('code', 'interview.feedback_generator')->value('template');

        $candidateRole = $session->candidate_role ?: 'MBA aspirant';
        $questionCount = $questions->count();
        $questionLimit = $session->question_limit;

        $baseSummary = <<<TEXT
Interview completed for {$candidateRole}.
Total questions answered: {$questionCount} / {$questionLimit}.

Highlights:
{$questionSnippets}
TEXT;

        if (!$prompt) {
            return $baseSummary;
        }
        FacadesLog::info('Generating interview feedback for session ID '.$session->id);
        $compiledPrompt = Str::of($prompt)
            ->replace('{{role}}', $session->candidate_role ?? 'MBA aspirant')
            ->replace('{{qa_pairs}}', $questionSnippets ?: 'No answers were recorded.')
            ->value();

        $resolved = $this->aiProviders->resolve();
        $client = $resolved['client'];
        $model = $resolved['model'] ?? null;
        $aiSummary = $client->generate($compiledPrompt, [
            'system' => 'You are an experienced MBA interview panelist. Provide concise, actionable feedback in bullet points.',
            'model' => $model,
            'temperature' => 0.3,
            'max_tokens' => 900,
        ]);

        if (!$aiSummary) {
            return $baseSummary;
        }

        return trim($aiSummary);
    }
}
