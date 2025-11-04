<?php

namespace Database\Seeders;

use App\Models\Content;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class ContentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pages = [
            'cat-score-calculator' => resource_path('js/content/cat-score-calculator.json'),
            'xat-score-calculator' => resource_path('js/content/xat-score-calculator.json'),
        ];

        foreach ($pages as $page => $path) {
            if (! File::exists($path)) {
                $this->command?->warn("Content file missing for [{$page}] at {$path}");

                continue;
            }

            $data = json_decode(File::get($path), true);

            if ($data === null) {
                $this->command?->warn("Content file for [{$page}] could not be decoded.");

                continue;
            }

            Content::updateOrCreate(
                ['page' => $page],
                ['content' => $data],
            );
        }
    }
}
