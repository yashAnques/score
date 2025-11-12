<?php

return [
    'provider' => env('INTERVIEW_AI_PROVIDER', 'openai'),

    'openai' => [
        'key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_DEFAULT_MODEL', 'gpt-4o-mini'),
        'temperature' => (float) env('OPENAI_DEFAULT_TEMPERATURE', 0.4),
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_DEFAULT_MODEL', 'gemini-1.5-flash-latest'),
        'temperature' => (float) env('GEMINI_DEFAULT_TEMPERATURE', 0.4),
    ],
];
