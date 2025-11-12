<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InterviewSetupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = now();

        $settings = [
            [
                'key' => 'interview.recording.min_seconds',
                'type' => 'integer',
                'value' => '6',
                'description' => 'Minimum seconds of recorded answer before enabling next question.',
            ],
            [
                'key' => 'interview.controls.repeat_question.visible',
                'type' => 'boolean',
                'value' => 'true',
                'description' => 'Toggle visibility for repeat question control on interview screen.',
            ],
            [
                'key' => 'interview.controls.record_answer.visible',
                'type' => 'boolean',
                'value' => 'true',
                'description' => 'Toggle visibility for record answer button on interview screen.',
            ],
            [
                'key' => 'interview.controls.next.visible',
                'type' => 'boolean',
                'value' => 'true',
                'description' => 'Toggle visibility for next question button on interview screen.',
            ],
            [
                'key' => 'interview.question.limit',
                'type' => 'integer',
                'value' => '8',
                'description' => 'Default maximum number of AI generated questions per interview.',
            ],
            [
                'key' => 'interview.ai.provider',
                'type' => 'string',
                'value' => 'openai',
                'description' => 'Preferred AI provider for interview questions and feedback (openai|gemini).',
            ],
            [
                'key' => 'interview.ai.openai.model',
                'type' => 'string',
                'value' => 'gpt-4o-mini',
                'description' => 'OpenAI model used for generating interview prompts.',
            ],
            [
                'key' => 'interview.ai.gemini.model',
                'type' => 'string',
                'value' => 'gemini-1.5-flash-latest',
                'description' => 'Gemini model used for generating interview prompts.',
            ],
            [
                'key' => 'interview.session.credit_cost',
                'type' => 'integer',
                'value' => '1',
                'description' => 'Credits required to schedule one interview session.',
            ],
            [
                'key' => 'interview.reminders.minutes',
                'type' => 'json',
                'value' => json_encode([45, 30, 15, 10]),
                'description' => 'Reminder offsets (minutes before start) to notify students.',
            ],
            [
                'key' => 'interview.cheating.cancel_on_tab_switch',
                'type' => 'boolean',
                'value' => 'true',
                'description' => 'If true, tab switch or permission loss cancels the session.',
            ],
            [
                'key' => 'interview.storage.disk',
                'type' => 'string',
                'value' => 'spaces',
                'description' => 'Storage disk for interview recordings (e.g., spaces, s3, local).',
            ],
        ];

        DB::table('interview_settings')->upsert(
            array_map(function (array $setting) use ($now) {
                return array_merge($setting, [
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }, $settings),
            ['key'],
            ['type', 'value', 'description', 'updated_at']
        );

        $prompts = [
            [
                'code' => 'interview.question_generator',
                'name' => 'Interview Question Generator',
                'template' => <<<'PROMPT'
You are an expert MBA interviewer. Generate one behavioural or situational question at a time.
Input:
- Role: {{role}}
- Asked Questions: {{asked_questions}}
Output JSON with keys: question, rationale.
PROMPT,
                'meta' => ['provider' => 'openai', 'model' => 'gpt-4o-mini'],
            ],
            [
                'code' => 'interview.feedback_generator',
                'name' => 'Interview Feedback Generator',
                'template' => <<<'PROMPT'
You are an experienced MBA panelist. Review the transcript and recordings summary to draft feedback.
Provide:
1. Overall impression (2 sentences)
2. Strengths (bulleted)
3. Improvement areas (bulleted)
4. Final recommendation (Short sentence)
Context:
- Role: {{role}}
- Q&A: {{qa_pairs}}
PROMPT,
                'meta' => ['provider' => 'openai', 'model' => 'gpt-4o-mini'],
            ],
        ];

        DB::table('ai_prompts')->upsert(
            array_map(function (array $prompt) use ($now) {
                return array_merge($prompt, [
                    'meta' => json_encode($prompt['meta'] ?? null),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }, $prompts),
            ['code'],
            ['name', 'template', 'meta', 'updated_at']
        );

        $slotBase = now()->setTimezone('Asia/Kolkata')->startOfDay()->addDays(1);

        $slots = collect([10, 12, 16])->map(function (int $hour) use ($slotBase, $now) {
            $start = $slotBase->copy()->setTime($hour, 0);
            $end = $start->copy()->addMinutes(45);
            $startUtc = $start->copy()->setTimezone('UTC');
            $endUtc = $end->copy()->setTimezone('UTC');

            return [
                'course_id' => null,
                'slot_date' => $start->toDateString(),
                'starts_at' => $startUtc,
                'ends_at' => $endUtc,
                'capacity' => 5,
                'booked_count' => 0,
                'timezone' => 'Asia/Kolkata',
                'is_active' => true,
                'meta' => json_encode([
                    'meeting_link' => 'https://meet.example.com/' . Str::random(8),
                ]),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        })->all();

        foreach ($slots as $slot) {
            DB::table('interview_slots')->updateOrInsert(
                [
                    'course_id' => $slot['course_id'],
                    'starts_at' => $slot['starts_at'],
                ],
                $slot
            );
        }
    }
}
