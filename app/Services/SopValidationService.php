<?php

namespace App\Services;

use App\Services\Ai\AiClientInterface;
use App\Services\Ai\AiProviderResolver;
use Illuminate\Http\UploadedFile;
use RuntimeException;

class SopValidationService
{
    public function __construct(
        protected AiProviderResolver $aiProviders
    ) {
    }

    /**
     * Validate the uploaded SOP using AI heuristics.
     *
     * @throws RuntimeException
     */
    public function assertValid(UploadedFile $file): void
    {
        if ($file->getSize() < 15_000) {
            throw new RuntimeException('Your SOP PDF appears too small. Upload the full document.');
        }

        $resolved = $this->aiProviders->resolve();
        $client = $resolved['client'];
        $model = $resolved['model'];
        $provider = $resolved['provider'] ?? null;

        if ($provider === 'gemini') {
            $this->validateUsingGemini($client, $model, $file);

            return;
        }

        if ($provider === 'openai') {
            $this->validateUsingOpenAi($client, $model, $file);

            return;
        }

        throw new RuntimeException('SOP validation requires Gemini or OpenAI provider. Please contact support.');
    }

    protected function validateUsingGemini(AiClientInterface $client, ?string $model, UploadedFile $file): void
    {
        $contents = @file_get_contents($file->getRealPath());
        if ($contents === false) {
            throw new RuntimeException('Unable to read the uploaded SOP file.');
        }

        $prompt = <<<PROMPT
You are an MBA admissions reviewer. The candidate's SOP PDF is attached.
Return ONLY JSON with keys:
- valid (boolean)
- reason (string)
Mark invalid if the attachment is not a detailed personal statement outlining goals, achievements, motivators, and fit for the MBA journey.
PROMPT;

        $response = $client->generate($prompt, [
            'system' => 'You validate whether documents are authentic Statements of Purpose for MBA candidates.',
            'model' => $model,
            'inline_data' => [
                'mime_type' => $file->getMimeType() ?? 'application/pdf',
                'data' => base64_encode($contents),
            ],
            'temperature' => 0.1,
            'max_tokens' => 200,
        ]);

        if (!$response) {
            throw new RuntimeException('Unable to validate SOP right now. Please try again.');
        }

        $data = json_decode($response, true);
        if (is_array($data) && array_key_exists('valid', $data)) {
            if (filter_var($data['valid'], FILTER_VALIDATE_BOOLEAN)) {
                return;
            }

            throw new RuntimeException(
                $data['reason'] ?? 'Uploaded SOP does not look valid. Please upload the complete statement of purpose.',
            );
        }

        throw new RuntimeException('Unable to validate SOP right now. Please try again.');
    }

    protected function validateUsingOpenAi(AiClientInterface $client, ?string $model, UploadedFile $file): void
    {
        $contents = @file_get_contents($file->getRealPath());
        if ($contents === false) {
            throw new RuntimeException('Unable to read the uploaded SOP file.');
        }

        $base64 = base64_encode($contents);

        $prompt = <<<PROMPT
You are an MBA admissions reviewer. The candidate's SOP PDF is provided below as a base64 encoded string. Decode it and determine if it is a legitimate Statement of Purpose (SOP) for MBA or Masters admissions.
Return ONLY JSON with keys:
- valid (boolean)
- reason (string)
Mark invalid if the attachment is not a detailed personal statement outlining goals, achievements, motivators, and fit for the MBA journey.

BASE64 PDF:
{$base64}
PROMPT;

        $response = $client->generate($prompt, [
            'system' => 'You validate whether documents are authentic Statements of Purpose for MBA candidates.',
            'model' => $model,
            'temperature' => 0.1,
            'max_tokens' => 200,
        ]);

        if (!$response) {
            throw new RuntimeException('Unable to validate SOP right now. Please try again.');
        }

        $data = json_decode($response, true);
        if (is_array($data) && array_key_exists('valid', $data)) {
            if (filter_var($data['valid'], FILTER_VALIDATE_BOOLEAN)) {
                return;
            }

            throw new RuntimeException(
                $data['reason'] ?? 'Uploaded SOP does not look valid. Please upload the complete statement of purpose.',
            );
        }

        throw new RuntimeException('Unable to validate SOP right now. Please try again.');
    }
}
