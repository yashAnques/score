<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScheduleInterviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'interview_slot_id' => ['required', 'integer', 'exists:interview_slots,id'],
            'candidate_role' => ['required', 'string', 'max:120'],
            'sop_file' => ['nullable', 'file', 'mimes:pdf', 'max:5120'],
        ];
    }
}
