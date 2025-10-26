<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'label',
        'text',
        'url',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    protected static function booted(): void
    {
        $flushCache = static function (): void {
            Cache::forget('shared_settings_links');
        };

        static::saved($flushCache);
        static::deleted($flushCache);
    }
}
