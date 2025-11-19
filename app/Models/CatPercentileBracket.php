<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CatPercentileBracket extends Model
{
    use HasFactory;

    protected $fillable = [
        'shift',
        'min_score',
        'label',
        'sort_order',
    ];

    protected $casts = [
        'shift' => 'integer',
        'min_score' => 'float',
        'sort_order' => 'integer',
    ];
}
