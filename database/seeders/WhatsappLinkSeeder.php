<?php

namespace Database\Seeders;

use App\Models\WhatsappLink;
use Illuminate\Database\Seeder;

class WhatsappLinkSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $records = [
            [
                'type' => WhatsappLink::TYPE_CAT,
                'min_percentile' => 0,
                'max_percentile' => 70,
                'label' => 'CAT percentile under 70? Focus on fundamentals together.',
                'cta_text' => 'Join CAT < 70%tile Group',
                'description' => 'Daily quant & VARC drills curated for a fresh restart.',
                'url' => 'https://chat.whatsapp.com/cat-under-70',
            ],
            [
                'type' => WhatsappLink::TYPE_CAT,
                'min_percentile' => 70,
                'max_percentile' => 90,
                'label' => 'You are in the competitive zone — sharpen it with peers.',
                'cta_text' => 'Join CAT 70-90%tile Group',
                'description' => 'Strategy nudges, mocks, and GDPI prep for serious contenders.',
                'url' => 'https://chat.whatsapp.com/cat-70-90',
            ],
            [
                'type' => WhatsappLink::TYPE_CAT,
                'min_percentile' => 90,
                'max_percentile' => 100,
                'label' => 'Almost there! Stay ahead with high-percentile aspirants.',
                'cta_text' => 'Join CAT 90%tile+ Group',
                'description' => 'Interview prep, CAP forms, and last-mile guidance from mentors.',
                'url' => 'https://chat.whatsapp.com/cat-90-plus',
            ],
            [
                'type' => WhatsappLink::TYPE_XAT,
                'min_percentile' => 0,
                'max_percentile' => 85,
                'label' => 'Build momentum for XLRI and allied institutes.',
                'cta_text' => 'Join XAT Prep Group',
                'description' => 'Quant refreshers, DM practice sets, and essay reviews.',
                'url' => 'https://chat.whatsapp.com/xat-prep',
            ],
            [
                'type' => WhatsappLink::TYPE_XAT,
                'min_percentile' => 85,
                'max_percentile' => 100,
                'label' => 'Interview season is here — stay updated with shortlists.',
                'cta_text' => 'Join XAT GDPI Group',
                'description' => 'Daily WAT/GD prompts, interview experiences, and mentor live sessions.',
                'url' => 'https://chat.whatsapp.com/xat-gdpi',
            ],
        ];

        foreach ($records as $record) {
            WhatsappLink::updateOrCreate(
                [
                    'type' => $record['type'],
                    'min_percentile' => $record['min_percentile'],
                    'max_percentile' => $record['max_percentile'],
                ],
                [
                    'label' => $record['label'],
                    'cta_text' => $record['cta_text'],
                    'description' => $record['description'],
                    'url' => $record['url'],
                    'is_active' => true,
                ]
            );
        }
    }
}
