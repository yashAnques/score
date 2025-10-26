<?php

namespace App\Http\Resources;

use App\Models\WhatsappLink;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class XatScoreCalculationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $payload = $this->payload ?? [];
        $sectionsMarks = $payload['sections_marks'] ?? [];
        $details = $payload['details'] ?? null;
        $percentileText = $payload['percentile'] ?? null;
        $summarySource = $payload['summary'] ?? null;
        $extracted = $payload['extractedData'] ?? null;

        if (empty($sectionsMarks) && is_array($extracted)) {
            $sectionsMarks = collect(data_get($extracted, 'sections', []))->map(function ($section) {
                $stats = data_get($section, 'stats', []);

                return [
                    'name' => data_get($section, 'section_name'),
                    'total_questions' => null,
                    'attempt_questions' => null,
                    'unattempt_questions' => null,
                    'correct_answers' => data_get($stats, 'correctCount'),
                    'wrong_answers' => data_get($stats, 'incorrectCount'),
                    'obtain_marks' => data_get($stats, 'score'),
                    'total_marks' => null,
                ];
            })->all();

            $summarySource = [
                'obtain_marks' => data_get($extracted, 'overallStats.totalScore'),
                'total_marks' => null,
                'unattempted_questions' => data_get($extracted, 'overallStats.totalUnattempted'),
                'unattempted_negative_marks' => data_get($extracted, 'overallStats.totalUnattemptedScore'),
                'percentile' => data_get($extracted, 'overallStats.percentile') ?? $percentileText,
            ];
        }

        $summary = [
            'obtain_marks' => data_get($summarySource, 'obtain_marks'),
            'total_marks' => data_get($summarySource, 'total_marks'),
            'unattempted_questions' => data_get($summarySource, 'unattempted_questions'),
            'unattempted_negative_marks' => data_get($summarySource, 'unattempted_negative_marks'),
            'percentile' => data_get($summarySource, 'percentile') ?? $percentileText,
        ];

        $whatsappLink = WhatsappLink::resolveFor(
            WhatsappLink::TYPE_XAT,
            $summary['percentile'],
            data_get($summarySource, 'percentile_numeric')
        );

        return [
            'id' => $this->id,
            'xat_id' => $this->xat_id,
            'candidate_name' => $this->candidate_name,
            'test_center' => $this->test_center,
            'response_link' => $this->response_link,
            'result_image_url' => $this->result_image_url,
            'total_score' => $this->total_score,
            'total_percentile' => $this->total_percentile,
            'overall_percentile' => $this->overall_percentile,
            'created_at' => $this->created_at?->toIso8601String(),
            'details' => $details,
            'percentile_text' => $percentileText,
            'sections_marks' => collect($sectionsMarks)->map(function ($section) {
                return [
                    'name' => data_get($section, 'name'),
                    'total_questions' => data_get($section, 'total_questions'),
                    'attempt_questions' => data_get($section, 'attempt_questions'),
                    'unattempt_questions' => data_get($section, 'unattempt_questions'),
                    'correct_answers' => data_get($section, 'correct_answers'),
                    'wrong_answers' => data_get($section, 'wrong_answers'),
                    'obtain_marks' => data_get($section, 'obtain_marks'),
                    'total_marks' => data_get($section, 'total_marks'),
                ];
            })->values()->all(),
            'summary' => $summary,
            'whatsapp_link' => $whatsappLink?->toInvitationPayload(),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ];
            }),
        ];
    }
}
