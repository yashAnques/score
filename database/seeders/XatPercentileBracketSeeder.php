<?php

namespace Database\Seeders;

use App\Models\XatPercentileBracket;
use Illuminate\Database\Seeder;

class XatPercentileBracketSeeder extends Seeder
{
    public function run(): void
    {
        $brackets = [
            45.0 => '99%tile - 100%tile',
            36.0 => '99.5%tile - 99.9%tile',
            32.01 => '98.5%tile - 99.4%tile',
            31.01 => '98%tile - 98.5%tile',
            30.60 => '97.5%tile - 98%tile',
            29.25 => '97%tile - 97.5%tile',
            27.00 => '96.5%tile - 97%tile',
            25.25 => '90%tile - 93%tile',
            24.00 => '88%tile - 90%tile',
            23.00 => '85%tile - 88%tile',
            22.00 => '83%tile - 85%tile',
            21.25 => '80%tile - 83%tile',
            20.75 => '77%tile - 80%tile',
            20.25 => '75%tile - 77%tile',
            20.00 => '73%tile - 75%tile',
            19.75 => '70%tile - 73%tile',
            19.25 => '68%tile - 70%tile',
            18.50 => '65%tile - 68%tile',
            17.00 => '60%tile - 65%tile',
            15.50 => '55%tile - 60%tile',
            13.75 => '50%tile - 55%tile',
            12.25 => '45%tile - 50%tile',
            10.75 => '40%tile - 45%tile',
            9.25 => '35%tile - 40%tile',
            7.75 => '30%tile - 35%tile',
            6.25 => '25%tile - 30%tile',
            4.75 => '20%tile - 25%tile',
            3.25 => '15%tile - 20%tile',
            1.75 => '10%tile - 15%tile',
            0.25 => '5%tile - 10%tile',
            -INF => '0%tile - 5%tile',
        ];

        XatPercentileBracket::query()->truncate();

        $order = 0;
        krsort($brackets);

        foreach ($brackets as $minScore => $label) {
            XatPercentileBracket::create([
                'min_score' => is_infinite($minScore) ? -9999 : $minScore,
                'label' => $label,
                'sort_order' => $order++,
            ]);
        }
    }
}
