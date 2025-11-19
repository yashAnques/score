<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class XatPercentileBracket extends Model
{
    use HasFactory;

    protected $fillable = [
        'min_score',
        'label',
        'sort_order',
    ];

    protected $casts = [
        'min_score' => 'float',
        'sort_order' => 'integer',
    ];
}
