<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $records = [
            [
                'key' => 'cat_nav_link',
                'label' => 'CAT Score Calculator',
                'text' => 'CAT Score Calculator',
                'url' => '/cat-score-calculator',
            ],
            [
                'key' => 'xat_nav_link',
                'label' => 'XAT Score Calculator',
                'text' => 'XAT Score Calculator',
                'url' => '/xat-score-calculator',
            ],
            [
                'key' => 'courses_nav_link',
                'label' => 'Courses',
                'text' => 'Courses',
                'url' => '/courses',
            ],
            [
                'key' => 'pdfs_nav_link',
                'label' => 'PDFs',
                'text' => 'PDFs',
                'url' => '/pdfs',
            ],
            [
                'key' => 'navbar_whatsapp_link',
                'label' => 'Join WhatsApp Group',
                'text' => '+91 63032 39042',
                'url' => 'https://wa.me/916303239042',
                'meta' => [
                    'cta_subtitle' => 'Join our official WhatsApp group for daily updates.',
                ],
            ],
            [
                'key' => 'otp_verification',
                'label' => 'OTP Verification Settings',
                'meta' => [
                    'enabled' => false,
                    'msg91_api_key' => '',
                    'msg91_sender_id' => '',
                    'msg91_template_id' => '',
                ],
            ],
            [
                'key' => 'navigation_layout',
                'label' => 'Marketing Navigation Layout',
                'text' => 'horizontal',
                'meta' => [
                    'options' => ['horizontal', 'vertical'],
                ],
            ],
        ];

        foreach ($records as $record) {
            $meta = $record['meta'] ?? null;

            Setting::updateOrCreate(
                ['key' => $record['key']],
                [
                    'label' => $record['label'] ?? null,
                    'text' => $record['text'] ?? null,
                    'url' => $record['url'] ?? null,
                    'meta' => $meta,
                ]
            );
        }
    }
}
