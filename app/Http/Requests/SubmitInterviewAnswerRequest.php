<?php

namespace App\Http\Requests;

use App\Services\InterviewSettingService;
use Illuminate\Foundation\Http\FormRequest;

class SubmitInterviewAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $settings = app(InterviewSettingService::class);
        $minSeconds = max(1, $settings->getInt('interview.recording.min_seconds', 6));

        return [
            'answer_notes' => ['nullable', 'string', 'max:2000'],
            'answer_transcript' => ['nullable', 'string'],
            'answer_duration_seconds' => ['required', 'integer', 'min:'.$minSeconds],
            'answer_recording_path' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
