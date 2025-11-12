<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterviewRecording extends Model
{
    use HasFactory;

    protected $fillable = [
        'interview_session_id',
        'storage_disk',
        'storage_path',
        'chunk_index',
        'size_bytes',
        'duration_seconds',
        'stored_at',
        'meta',
    ];

    protected $casts = [
        'chunk_index' => 'integer',
        'size_bytes' => 'integer',
        'duration_seconds' => 'integer',
        'stored_at' => 'datetime',
        'meta' => 'array',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(InterviewSession::class, 'interview_session_id');
    }
}
