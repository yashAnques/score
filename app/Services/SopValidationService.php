<?php

namespace App\Services;

use App\Services\Ai\AiClientInterface;
use App\Services\Ai\AiProviderResolver;
use Illuminate\Http\UploadedFile;
use RuntimeException;
use Throwable;

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
    public function assertValid(UploadedFile $file, ?string $collegeName = null): void
    {
        if ($file->getSize() < 15_000) {
            throw new RuntimeException('Your SOP PDF appears too small. Upload the full document.');
        }

        $text = $this->extractPdfText($file);
        if (mb_strlen(trim($text)) < 100) {
            throw new RuntimeException('Uploaded file is empty or invalid.');
        }

        $resolved = $this->aiProviders->resolve();
        $client = $resolved['client'];
        $model = $resolved['model'];
        $provider = $resolved['provider'] ?? null;

        $collegeLine = $collegeName ? "College: {$collegeName}\n\n" : '';
        $prompt = <<<PROMPT
Niche wale text analyze kar aur bata ki yeh SOP hai ya nahi jyada check karne ki koi need nahi hai but simple sop honi chahiye yeh bs uska answer niche wale format me de.
Respond only with JSON like: {"valid": true|false, "reason": "short reason"}.

{$collegeLine}Text:
{$this->truncateText($text, 3000)}
PROMPT;

        $response = $client->generate($prompt, [
            'system' => 'You validate whether documents are authentic Statements of Purpose for MBA candidates.',
            'model' => $model,
            'temperature' => 0.1,
            'max_tokens' => 300,
        ]);

        if (!$response) {
            throw new RuntimeException('Unable to validate SOP right now. Please try again.');
        }

        $data = $this->decodeJsonResponse($response);
        if (is_array($data) && array_key_exists('valid', $data)) {
            if (filter_var($data['valid'], FILTER_VALIDATE_BOOLEAN)) {
                return;
            }

            throw new RuntimeException('Uploaded SOP does not look valid. Please upload the complete statement of purpose.');
        }

        throw new RuntimeException('Unable to validate SOP right now. Please try again.');
    }

    /**
     * Attempt to decode JSON responses even when wrapped inside extra text/code fences.
     */
    protected function decodeJsonResponse(?string $response): ?array
    {
        if (!$response) {
            return null;
        }

        $decoded = json_decode(trim($response), true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        if (preg_match('/\{.*\}/s', $response, $matches)) {
            $decoded = json_decode($matches[0], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }
        }

        return null;
    }

    protected function extractPdfText(UploadedFile $file): string
    {
        $path = $file->getRealPath();
        if (!$path || !is_readable($path)) {
            return '';
        }

        if (class_exists(\Smalot\PdfParser\Parser::class)) {
            try {
                $parser = new \Smalot\PdfParser\Parser();
                $pdf = $parser->parseFile($path);
                $text = $pdf->getText();
                if (trim($text) !== '') {
                    return $text;
                }
            } catch (Throwable) {
                // Ignore and fallback to other strategies
            }
        }

        if (function_exists('shell_exec')) {
            $binary = trim((string) shell_exec('command -v pdftotext'));
            if ($binary) {
                $tmp = tempnam(sys_get_temp_dir(), 'sop_txt_');
                if ($tmp !== false) {
                    $command = escapeshellcmd($binary) . ' -layout ' . escapeshellarg($path) . ' ' . escapeshellarg($tmp) . ' 2>&1';
                    shell_exec($command);
                    $text = @file_get_contents($tmp) ?: '';
                    @unlink($tmp);
                    if (trim($text) !== '') {
                        return $text;
                    }
                }
            }
        }

        return '';
    }

    protected function truncateText(string $text, int $limit): string
    {
        if (mb_strlen($text) <= $limit) {
            return $text;
        }

        return mb_substr($text, 0, $limit);
    }
}
