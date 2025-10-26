<?php

namespace App\Http\Resources;

use App\Models\WhatsappLink;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CatScoreCalculationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $payload = $this->payload ?? [];
        $extracted = $payload['extractedData'] ?? [];

        $sectionsSource = $extracted['sections'] ?? $payload['sections'] ?? [];
        $overallSource = $extracted['overallStats'] ?? $payload['overallStats'] ?? [];
        $details = $payload['details'] ?? $extracted['details'] ?? null;
        $percentileText = $payload['percentile'] ?? null;

        $percentileString = $percentileText
            ?? data_get($overallSource, 'percentile')
            ?? data_get($overallSource, 'totalPercentile')
            ?? data_get($overallSource, 'total_percentile');

        $numericFallback = data_get($overallSource, 'totalPercentile')
            ?? data_get($overallSource, 'total_percentile');

        $whatsappLink = WhatsappLink::resolveFor(WhatsappLink::TYPE_CAT, $percentileString, $numericFallback);

        return [
            'id' => $this->id,
            'candidate_name' => $this->candidate_name,
            'slot' => $this->slot,
            'test_center' => $this->test_center,
            'response_link' => $this->response_link,
            'result_image_url' => $this->result_image_url,
            'total_score' => $this->total_score,
            'total_percentile' => $this->total_percentile,
            'overall_percentile' => $this->overall_percentile,
            'created_at' => $this->created_at?->toIso8601String(),
            'details' => $details,
            'percentile_text' => $percentileText,
            'sections' => collect($sectionsSource)->map(function ($section) {
                $stats = $section['stats'] ?? [];

                return [
                    'name' => $section['section_name'] ?? $section['name'] ?? 'Section',
                    'correct' => data_get($stats, 'correctCount'),
                    'incorrect' => data_get($stats, 'incorrectCount'),
                    'sa_incorrect' => data_get($stats, 'saIncorrectCount'),
                    'unattempted' => data_get($stats, 'unattemptedCount'),
                    'score' => data_get($stats, 'score'),
                    'percentile' => data_get($stats, 'percentile'),
                ];
            })->values()->all(),
            'overall' => [
                'total_correct' => data_get($overallSource, 'totalCorrect'),
                'total_incorrect' => data_get($overallSource, 'totalIncorrect'),
                'total_sa_incorrect' => data_get($overallSource, 'totalSaIncorrect'),
                'total_unattempted' => data_get($overallSource, 'totalUnattempted'),
                'total_unattempted_score' => data_get($overallSource, 'totalUnattemptedScore'),
                'total_score' => data_get($overallSource, 'totalScore'),
                'total_percentile' => data_get($overallSource, 'totalPercentile'),
                'percentile' => data_get($overallSource, 'percentile') ?? $percentileText,
            ],
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
