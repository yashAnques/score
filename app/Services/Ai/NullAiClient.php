<?php

namespace App\Services\Ai;

class NullAiClient implements AiClientInterface
{
    public function generate(string $prompt, array $options = []): ?string
    {
        return null;
    }
}
