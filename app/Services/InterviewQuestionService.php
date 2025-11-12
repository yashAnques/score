<?php

namespace App\Services;

use App\Models\InterviewQuestion;
use App\Models\InterviewSession;
use App\Services\Ai\AiProviderResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class InterviewQuestionService
{
    public function __construct(
        protected AiProviderResolver $aiProviders,
    ) {
    }

    /**
     * Generate the next question for a session.
     */
    public function issueQuestion(InterviewSession $session): InterviewQuestion
    {
        $currentSequence = (int) $session->questions()->max('sequence');
        $nextSequence = $currentSequence + 1;

        if ($nextSequence > $session->question_limit) {
            throw new RuntimeException('Question limit has been reached for this interview.');
        }

        $askedQuestions = $session->questions()->orderBy('sequence')->pluck('question')->all();
        $questionPayload = $this->generateQuestionText($session, $nextSequence, $askedQuestions);

        if ($this->isDuplicateQuestion($questionPayload['text'], $askedQuestions)) {
            $questionPayload = $this->replaceWithFallbackQuestion($session, $nextSequence, $askedQuestions, $questionPayload);
        }

        $question = $session->questions()->create([
            'sequence' => $nextSequence,
            'question' => $questionPayload['text'],
            'asked_at' => now(),
            'meta' => [
                'source' => $questionPayload['source'],
                'context' => $questionPayload['context'],
            ],
        ]);

        $session->forceFill([
            'questions_asked' => $nextSequence,
        ])->save();

        return $question;
    }

    /**
     * Basic text generation placeholder until AI integration is wired.
     */
    protected function generateQuestionText(InterviewSession $session, int $sequence, array $askedQuestions = []): array
    {
        $role = $session->candidate_role ?: 'MBA aspirant';
        $promptTemplate = DB::table('ai_prompts')
            ->where('code', 'interview.question_generator')
            ->value('template');
        $askedBlock = empty($askedQuestions)
            ? 'No previous questions have been asked yet.'
            : "- " . implode("\n- ", array_map(static fn($question) => Str::limit($question, 140), $askedQuestions));
        $prompt = $promptTemplate
            ? Str::of($promptTemplate)
                ->replace('{{role}}', $role)
                ->replace('{{asked_questions}}', $askedBlock)
                ->replace('{{sequence}}', $sequence)
                ->value()
            : null;

        $fallbackQuestion = $this->fallbackQuestion($sequence, $role, $askedQuestions);

        $aiResponse = null;
        $providerMeta = ['provider' => 'fallback', 'model' => null];

        if ($prompt) {
            [$client, $provider, $model] = $this->resolveProvider();
            $raw = $client->generate($prompt, [
                'system' => 'You are an expert MBA interviewer. Provide one behavioural or situational question tailored to the candidate. Reply in JSON with keys "question" and "reasoning".',
                'model' => $model,
                'temperature' => 0.35,
                'max_tokens' => 400,
            ]);

            $parsed = $this->parseAiQuestion($raw);
            if ($parsed) {
                $aiResponse = $parsed;
                if (isset($aiResponse['question'])) {
                    $rawQuestion = trim($aiResponse['question']);
                    if (Str::startsWith($rawQuestion, '```json')) {
                        $cleanJson = preg_replace('/^```json|```$/m', '', $rawQuestion);
                        $decoded = json_decode(trim($cleanJson), true);

                        if (isset($decoded['question'])) {
                            $aiResponse['question'] = $decoded['question'];
                        }
                    }
                }

                $providerMeta = [
                    'provider' => $provider,
                    'model' => $model,
                ];
            }
        }

        return [
            'text' => $aiResponse['question'] ?? $fallbackQuestion,
            'source' => $aiResponse ? 'ai' : ($promptTemplate ? 'template' : 'fallback'),
            'context' => [
                'prompt_excerpt' => $promptTemplate ? Str::limit($promptTemplate, 120) : null,
                'ai' => $providerMeta ?? null,
                'ai_payload' => $aiResponse ?? null,
            ],
        ];
    }

    protected function resolveProvider(): array
    {
        $resolved = $this->aiProviders->resolve();

        return [$resolved['client'], $resolved['provider'], $resolved['model']];
    }

    /**
     * @return array{question: string, reasoning?: string}|null
     */
    protected function parseAiQuestion(?string $raw): ?array
    {
        if (!$raw) {
            return null;
        }

        $json = json_decode($raw, true);
        if (is_array($json) && isset($json['question']) && is_string($json['question'])) {
            return [
                'question' => trim($json['question']),
                'reasoning' => isset($json['reasoning']) ? trim((string) $json['reasoning']) : null,
            ];
        }

        // Attempt to extract using basic heuristics if not JSON
        $question = Str::of($raw)->after('Question:')->before('Reason')->trim();
        if ($question->isNotEmpty()) {
            return [
                'question' => $question->value(),
            ];
        }

        return null;
    }

    protected function fallbackQuestion(int $sequence, string $role, array $askedQuestions): string
    {
        $templates = [
            'Question %d: Share a time when you led a cross-functional team as %s. What trade-offs did you make?',
            'Question %d: As a future %s leader, how would you handle a stakeholder who disagrees with the strategy?',
            'Question %d: If you had to redo a key decision from your %s experience, what would you change and why?',
            'Question %d: Describe a failure you owned as %s and the metrics you used to measure recovery.',
        ];

        $used = collect($askedQuestions)
            ->map(fn($question) => md5($question))
            ->all();

        $template = collect($templates)
            ->reject(fn($tpl) => in_array(md5($tpl), $used, true))
            ->shuffle()
            ->first() ?? $templates[array_rand($templates)];

        return sprintf($template, $sequence, $role);
    }

    protected function isDuplicateQuestion(string $candidate, array $askedQuestions): bool
    {
        $needle = Str::lower(trim($candidate));

        return collect($askedQuestions)
            ->map(fn($question) => Str::lower(trim((string) $question)))
            ->contains($needle);
    }

    /**
     * Ensure duplicate AI responses are replaced with a unique fallback.
     */
    protected function replaceWithFallbackQuestion(
        InterviewSession $session,
        int $sequence,
        array $askedQuestions,
        array $payload,
    ): array {
        $role = $session->candidate_role ?: 'MBA aspirant';
        $questionHistory = array_merge($askedQuestions, [$payload['text']]);
        $fallback = $this->fallbackQuestion($sequence, $role, $questionHistory);

        $payload['context']['deduplicated_from'] = $payload['text'];
        $payload['context']['deduplicated_at'] = now()->toISOString();
        $payload['text'] = $fallback;
        $payload['source'] = 'fallback';

        return $payload;
    }
}
