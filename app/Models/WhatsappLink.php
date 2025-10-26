<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;

class WhatsappLink extends Model
{
    use HasFactory;

    public const TYPE_CAT = 'cat';
    public const TYPE_XAT = 'xat';

    protected $fillable = [
        'type',
        'min_percentile',
        'max_percentile',
        'label',
        'cta_text',
        'description',
        'url',
        'is_active',
        'meta',
    ];

    protected $casts = [
        'min_percentile' => 'float',
        'max_percentile' => 'float',
        'is_active' => 'boolean',
        'meta' => 'array',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Attempt to resolve a WhatsApp link for the given percentile context.
     *
     * @param  string  $type
     * @param  mixed  $primary Percentile information (string or numeric)
     * @param  mixed|null  $fallback Fallback percentile value
     */
    public static function resolveFor(string $type, $primary, $fallback = null): ?self
    {
        $range = self::extractRange($primary) ?: self::extractRange($fallback);

        if ($range === null) {
            return null;
        }

        $value = $range['value'];

        return self::query()
            ->active()
            ->where('type', $type)
            ->where(function ($query) use ($value) {
                $query
                    ->whereNull('min_percentile')
                    ->orWhere('min_percentile', '<=', $value);
            })
            ->where(function ($query) use ($value) {
                $query
                    ->whereNull('max_percentile')
                    ->orWhere('max_percentile', '>=', $value);
            })
            ->orderByRaw('min_percentile IS NULL')
            ->orderBy('min_percentile')
            ->first();
    }

    /**
     * Extract a percentile range structure from the supplied value.
     *
     * @param  mixed  $value
     * @return array{min: float, max: float, value: float}|null
     */
    public static function extractRange($value): ?array
    {
        if ($value === null) {
            return null;
        }

        if (is_array($value)) {
            $min = Arr::get($value, 'min') ?? Arr::first($value);
            $max = Arr::get($value, 'max') ?? Arr::last($value);
            if (is_numeric($min) || is_numeric($max)) {
                $min = is_numeric($min) ? (float) $min : null;
                $max = is_numeric($max) ? (float) $max : $min;
                $representative = ($min !== null && $max !== null)
                    ? ($min + $max) / 2
                    : ($min ?? $max);

                if ($representative !== null) {
                    return [
                        'min' => $min ?? $representative,
                        'max' => $max ?? $representative,
                        'value' => $representative,
                    ];
                }
            }

            return null;
        }

        if (is_numeric($value)) {
            $numeric = (float) $value;

            return [
                'min' => $numeric,
                'max' => $numeric,
                'value' => $numeric,
            ];
        }

        if (is_string($value)) {
            $cleaned = trim($value);

            if ($cleaned === '' || in_array($cleaned, ['—', '-', 'NA', 'N/A'], true)) {
                return null;
            }

            if (is_numeric($cleaned)) {
                $numeric = (float) $cleaned;

                return [
                    'min' => $numeric,
                    'max' => $numeric,
                    'value' => $numeric,
                ];
            }

            preg_match_all('/(\d+(?:\.\d+)?)\s*(?:%tile|%ile|%)/i', $cleaned, $matches);

            if (! empty($matches[1])) {
                $numbers = array_map('floatval', $matches[1]);

                $min = $numbers[0];
                $max = $numbers[1] ?? $min;
                $representative = ($min + $max) / 2;

                return [
                    'min' => $min,
                    'max' => $max,
                    'value' => $representative,
                ];
            }
        }

        return null;
    }

    public function toInvitationPayload(): array
    {
        return [
            'type' => $this->type,
            'label' => $this->label,
            'cta_text' => $this->cta_text,
            'description' => $this->description,
            'url' => $this->url,
            'min_percentile' => $this->min_percentile,
            'max_percentile' => $this->max_percentile,
            'meta' => $this->meta ?? [],
        ];
    }
}
