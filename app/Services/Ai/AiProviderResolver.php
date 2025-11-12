<?php

namespace App\Services\Ai;

use App\Services\InterviewSettingService;

class AiProviderResolver
{
    public function __construct(
        protected InterviewSettingService $settings
    ) {
    }

    /**
     * @return array{client: AiClientInterface, provider: string, model: ?string}
     */
    public function resolve(): array
    {
        $provider = strtolower((string) $this->settings->get('interview.ai.provider', config('ai.provider', 'openai')));
        return match ($provider) {
            'gemini' => $this->geminiClient(),
            'openai' => $this->openAiClient(),
            default => $this->nullClient($provider),
        };
    }

    protected function openAiClient(): array
    {
        $key = config('ai.openai.key');
        $model = $this->settings->get('interview.ai.openai.model', config('ai.openai.model'));
        $client = new OpenAiClient($key, $model, (float) config('ai.openai.temperature', 0.4));

        return [
            'client' => $key ? $client : new NullAiClient(),
            'provider' => 'openai',
            'model' => $model,
        ];
    }

    protected function geminiClient(): array
    {
        $key = config('ai.gemini.key');
        $model = $this->settings->get('interview.ai.gemini.model', config('ai.gemini.model'));
        $client = new GeminiClient($key, $model, (float) config('ai.gemini.temperature', 0.4));

        return [
            'client' => $key ? $client : new NullAiClient(),
            'provider' => 'gemini',
            'model' => $model,
        ];
    }

    protected function nullClient(string $provider): array
    {
        return [
            'client' => new NullAiClient(),
            'provider' => $provider,
            'model' => null,
        ];
    }
}
