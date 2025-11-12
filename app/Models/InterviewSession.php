<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InterviewSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'course_id',
        'interview_slot_id',
        'status',
        'candidate_role',
        'question_limit',
        'questions_asked',
        'credits_debited',
        'scheduled_at',
        'started_at',
        'completed_at',
        'cancelled_at',
        'cancel_reason',
        'feedback_summary',
        'feedback_generated_at',
        'recording_manifest_path',
        'meta',
    ];

    protected $casts = [
        'question_limit' => 'integer',
        'questions_asked' => 'integer',
        'credits_debited' => 'integer',
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'feedback_generated_at' => 'datetime',
        'meta' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(InterviewSlot::class, 'interview_slot_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(InterviewQuestion::class);
    }
}
