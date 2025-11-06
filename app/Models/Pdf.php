<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pdf extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'title',
        'slug',
        'label',
        'file_url',
        'download_count',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
