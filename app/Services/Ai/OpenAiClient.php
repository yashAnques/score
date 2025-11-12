<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;

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
        $response = Http::timeout(30)
            ->withHeaders([
                'Authorization' => 'Bearer '.$this->apiKey,
            ])
            ->post('https://api.openai.com/v1/chat/completions', [
                'model' => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $options['system'] ?? 'You are an expert MBA interviewer.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => $options['temperature'] ?? $this->defaultTemperature,
                'max_tokens' => $options['max_tokens'] ?? 600,
            ]);

        if ($response->failed()) {
            return null;
        }

        return $response->json('choices.0.message.content');
    }
}
