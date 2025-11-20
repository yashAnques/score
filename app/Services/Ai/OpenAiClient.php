<?php

namespace App\Services\Ai;

use App\Models\ApiLog;
use Illuminate\Support\Facades\Http;
use Throwable;

class OpenAiClient implements AiClientInterface
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

        $model = $options['model'] ?? $this->defaultModel ?? 'gpt-4o-mini';
        $endpoint = 'https://api.openai.com/v1/chat/completions';
        $payload = [
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => $options['system'] ?? 'You are an expert MBA interviewer.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => $options['temperature'] ?? $this->defaultTemperature,
            'max_tokens' => $options['max_tokens'] ?? 600,
        ];

        $response = Http::timeout(30)
            ->withHeaders([
                'Authorization' => 'Bearer '.$this->apiKey,
            ])
            ->post($endpoint, $payload);

        $this->logCall('openai', $model, $endpoint, $payload, $response);

        if ($response->failed()) {
            return null;
        }

        return $response->json('choices.0.message.content');
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
            // Logging should never block API responses.
        }
    }
}
