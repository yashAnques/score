<?php

namespace App\Services\Ai;

interface AiClientInterface
{
    /**
     * @param  string  $prompt  The user/content prompt
     * @param  array<string, mixed>  $options  Additional options including system message, model, temperature, etc.
     */
    public function generate(string $prompt, array $options = []): ?string;
}
