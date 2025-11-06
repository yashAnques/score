<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Course
 */
class CourseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'imageUrl' => $this->image_url,
            'ctaUrl' => $this->cta_url,
            'originalPrice' => $this->original_price !== null ? (float) $this->original_price : null,
            'salePrice' => $this->sale_price !== null ? (float) $this->sale_price : null,
            'descriptionPoints' => $this->description_points ?? [],
            'isActive' => (bool) $this->is_active,
        ];
    }
}
