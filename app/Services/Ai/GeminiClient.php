<?php

namespace App\Services\Ai;

use App\Models\ApiLog;
use Illuminate\Support\Facades\Http;
use Throwable;

class GeminiClient implements AiClientInterface
{
    public function __construct(
        protected ?string $apiKey,
        protected ?string $defaultModel = null,
        protected float $defaultTemperature = 0.4,
    ) {
    }

    public function generate(string $prompt, array $options = []): ?string
    {
        if (!$this->apiKey) {
            return null;
        }

        $model = $options['model'] ?? $this->defaultModel ?? 'gemini-1.5-flash-latest';
        $systemInstruction = $options['system'] ?? 'You are an expert MBA interviewer.';

        $endpoint = sprintf(
            'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s',
            $model,
            $this->apiKey
        );

        $parts = [
            ['text' => $prompt],
        ];

        if (!empty($options['inline_data']) && is_array($options['inline_data'])) {
            $inline = $options['inline_data'];
            $parts[] = [
                'inlineData' => [
                    'mimeType' => $inline['mime_type'] ?? 'application/pdf',
                    'data' => $inline['data'] ?? '',
                ],
            ];
        }

        $payload = [
            'systemInstruction' => [
                'parts' => [
                    ['text' => $systemInstruction],
                ],
            ],
            'contents' => [
                [
                    'parts' => $parts,
                ],
            ],
            'generationConfig' => [
                'temperature' => $options['temperature'] ?? $this->defaultTemperature,
                'maxOutputTokens' => $options['max_tokens'] ?? 800,
            ],
        ];

        $response = Http::timeout(45)->post($endpoint, $payload);

        $this->logCall('gemini', $model, $endpoint, $payload, $response);

        if ($response->failed()) {
            return null;
        }

        $data = $response->json();

        return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
    }

    protected function logCall(string $provider, ?string $model, string $endpoint, array $payload, $response): void
    {
        try {
            ApiLog::create([
                'provider' => $provider,
                'model' => $model,
                'endpoint' => $endpoint,
                'status_code' => $response?->status(),
                'request_payload' => $payload,
                'response_body' => json_decode($response?->body() ?? '', true),
                'usage_prompt_tokens' => $response?->json('usage.prompt_tokens'),
                'usage_completion_tokens' => $response?->json('usage.completion_tokens'),
            ]);
        } catch (Throwable) {
            // Ignore logging failures
        }
    }
}
