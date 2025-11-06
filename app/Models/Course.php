<?php

namespace App\Models;

use App\Models\CoursePurchase;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'image_url',
        'cta_url',
        'original_price',
        'sale_price',
        'description_points',
        'is_active',
        'display_order',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'description_points' => 'array',
        'is_active' => 'boolean',
        'original_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'display_order' => 'integer',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(CoursePurchase::class);
    }
}
