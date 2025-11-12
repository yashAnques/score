<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InterviewSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'slot_date',
        'starts_at',
        'ends_at',
        'capacity',
        'booked_count',
        'timezone',
        'is_active',
        'meta',
    ];

    protected $casts = [
        'slot_date' => 'date',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'capacity' => 'integer',
        'booked_count' => 'integer',
        'is_active' => 'boolean',
        'meta' => 'array',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(InterviewSession::class);
    }
}
