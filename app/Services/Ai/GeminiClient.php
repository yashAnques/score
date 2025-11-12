<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;

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

        $response = Http::timeout(45)->post($endpoint, [
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
        ]);

        if ($response->failed()) {
            return null;
        }

        $data = $response->json();

        return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
    }
}
