<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CutoffContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
