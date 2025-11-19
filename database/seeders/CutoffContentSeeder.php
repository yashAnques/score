<?php

namespace Database\Seeders;

use App\Models\CutoffContent;
use Illuminate\Database\Seeder;

class CutoffContentSeeder extends Seeder
{
    public function run(): void
    {
        $catTables = include __DIR__.'/payloads/cat_cutoffs.php';
        $xatTables = include __DIR__.'/payloads/xat_cutoffs.php';

        CutoffContent::updateOrCreate(
            ['exam' => 'cat'],
            ['payload' => $catTables],
        );

        CutoffContent::updateOrCreate(
            ['exam' => 'xat'],
            ['payload' => $xatTables],
        );
    }
}
