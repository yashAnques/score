<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Pdf
 */
class PdfResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $course = $this->whenLoaded('course');

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'label' => $this->label,
            'fileUrl' => $this->file_url,
            'downloadCount' => $this->download_count,
            'course' => $course ? [
                'id' => $course->id,
                'name' => $course->name,
                'slug' => $course->slug,
            ] : null,
        ];
    }
}
