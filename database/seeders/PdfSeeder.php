<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Pdf;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PdfSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $catCourse = Course::query()->where('slug', 'cat-2025-complete-prep')->first();
        $xatCourse = Course::query()->where('slug', 'xat-crash-course')->first();

        $pdfs = [
            [
                'title' => 'CAT 2025 Strategy Blueprint',
                'label' => 'Paid',
                'file_url' => 'https://bschoolbuzz.in/assets/pdfs/cat-strategy-blueprint.pdf',
                'course' => $catCourse,
                'display_order' => 1,
            ],
            [
                'title' => 'XAT Decision Making Playbook',
                'label' => 'Paid',
                'file_url' => 'https://bschoolbuzz.in/assets/pdfs/xat-decision-playbook.pdf',
                'course' => $xatCourse,
                'display_order' => 2,
            ],
            [
                'title' => 'MBA Interview Checklist',
                'label' => 'Free',
                'file_url' => 'https://bschoolbuzz.in/assets/pdfs/mba-interview-checklist.pdf',
                'course' => null,
                'display_order' => 3,
            ],
            [
                'title' => 'Quant Formula Sheet',
                'label' => 'Free',
                'file_url' => 'https://bschoolbuzz.in/assets/pdfs/quant-formula-sheet.pdf',
                'course' => null,
                'display_order' => 4,
            ],
        ];

        foreach ($pdfs as $pdfData) {
            $slug = Str::slug($pdfData['title']);

            Pdf::updateOrCreate(
                ['slug' => $slug],
                [
                    'course_id' => $pdfData['course']?->id,
                    'title' => $pdfData['title'],
                    'slug' => $slug,
                    'label' => $pdfData['label'],
                    'file_url' => $pdfData['file_url'],
                    'display_order' => $pdfData['display_order'],
                    'is_active' => true,
                ],
            );
        }
    }
}
