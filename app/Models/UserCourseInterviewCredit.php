<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCourseInterviewCredit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'balance',
        'lifetime_credited',
        'lifetime_debited',
        'last_transaction_at',
    ];

    protected $casts = [
        'balance' => 'integer',
        'lifetime_credited' => 'integer',
        'lifetime_debited' => 'integer',
        'last_transaction_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
