<?php

namespace Database\Seeders;

use App\Models\Course;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courses = [
            [
                'name' => 'CAT 2025 Complete Prep',
                'image_url' => 'https://bschoolbuzz.in/images/courses/cat-complete-prep.jpg',
                'cta_url' => 'https://bschoolbuzz.in/courses/cat-complete-prep',
                'original_price' => 19999,
                'sale_price' => 12999,
                'description_points' => [
                    'Live concept classes with top mentors',
                    'Weekly mock tests with detailed analytics',
                    '1:1 doubt-solving and mentorship sessions',
                ],
                'is_active' => true,
                'display_order' => 1,
            ],
            [
                'name' => 'XAT Crash Course',
                'image_url' => 'https://bschoolbuzz.in/images/courses/xat-crash-course.jpg',
                'cta_url' => 'https://bschoolbuzz.in/courses/xat-crash-course',
                'original_price' => 14999,
                'sale_price' => 9999,
                'description_points' => [
                    'Targeted XAT strategy sessions',
                    'Decision making practice sets',
                    'Interview preparation add-on',
                ],
                'is_active' => true,
                'display_order' => 2,
            ],
        ];

        foreach ($courses as $course) {
            $slug = Str::slug($course['name']);

            Course::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $course['name'],
                    'slug' => $slug,
                    'image_url' => $course['image_url'],
                    'cta_url' => $course['cta_url'],
                    'original_price' => $course['original_price'],
                    'sale_price' => $course['sale_price'],
                    'description_points' => $course['description_points'],
                    'is_active' => $course['is_active'],
                    'display_order' => $course['display_order'],
                ]
            );
        }
    }
}
