<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class XatScoreCalculation extends Model
{
    protected $fillable = [
        'user_id',
        'response_link',
        'xat_id',
        'candidate_name',
        'test_center',
        'total_score',
        'total_percentile',
        'overall_percentile',
        'result_image_url',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
