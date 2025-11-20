<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiLog extends Model
{
    protected $fillable = [
        'provider',
        'model',
        'endpoint',
        'status_code',
        'request_payload',
        'response_body',
        'usage_prompt_tokens',
        'usage_completion_tokens',
    ];

    protected $casts = [
        'request_payload' => 'array',
        'response_body' => 'array',
    ];
}
