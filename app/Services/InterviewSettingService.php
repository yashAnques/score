<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class InterviewSettingService
{
    protected array $cache = [];

    public function get(string $key, mixed $default = null): mixed
    {
        if (!array_key_exists($key, $this->cache)) {
            $record = DB::table('interview_settings')->where('key', $key)->first();

            if ($record) {
                $this->cache[$key] = $this->castValue($record->value, $record->type);
            } else {
                $this->cache[$key] = $default;
            }
        }

        return $this->cache[$key] ?? $default;
    }

    public function getInt(string $key, int $default = 0): int
    {
        return (int) $this->get($key, $default);
    }

    public function getBool(string $key, bool $default = false): bool
    {
        return (bool) $this->get($key, $default);
    }

    public function refresh(?string $key = null): void
    {
        if ($key) {
            unset($this->cache[$key]);
            return;
        }

        $this->cache = [];
    }

    protected function castValue(?string $value, ?string $type): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'integer', 'int' => (int) $value,
            'boolean', 'bool' => filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
            'json' => json_decode($value, true),
            default => $value,
        };
    }
}
