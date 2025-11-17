<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterviewQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'interview_session_id',
        'sequence',
        'question',
        'answer_notes',
        'answer_transcript',
        'answer_recording_path',
        'answer_duration_seconds',
        'asked_at',
        'answered_at',
        'meta',
    ];

    protected $casts = [
        'sequence' => 'integer',
        'answer_duration_seconds' => 'integer',
        'asked_at' => 'datetime',
        'answered_at' => 'datetime',
        'meta' => 'array',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(InterviewSession::class, 'interview_session_id');
    }
}
