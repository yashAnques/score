<?php

namespace Database\Seeders;

use App\Models\CatPercentileBracket;
use Illuminate\Database\Seeder;

class CatPercentileBracketSeeder extends Seeder
{
    public function run(): void
    {
        $payload = [
            1 => [
                116 => '99.9%tile - 100%tile',
                109 => '99.8%tile - 99.9%tile',
                100 => '99.6%tile - 99.8%tile',
                94 => '99.4%tile - 99.6%tile',
                90 => '99.2%tile - 99.4%tile',
                87 => '99%tile - 99.2%tile',
                81 => '98.5%tile - 99%tile',
                76 => '98%tile - 98.5%tile',
                70 => '97%tile - 98%tile',
                65 => '96%tile - 97%tile',
                60 => '95%tile (CAP IIMs) - 96%tile',
                54 => '92%tile - 95%tile',
                47 => '89%tile - 92%tile',
                42 => '85%tile - 89%tile',
                38 => '80%tile - 85%tile',
                34 => '75%tile - 80%tile',
                30 => '70%tile - 75%tile',
                25 => '65%tile - 70%tile',
                23 => '60%tile - 65%tile',
                19 => '55%tile - 60%tile',
                15 => '50%tile - 55%tile',
                10 => '45%tile - 50%tile',
                6 => '35%tile - 45%tile',
                4 => '25%tile - 35%tile',
                2 => '15%tile - 25%tile',
                -2 => '10%tile - 15%tile',
                -INF => '0%tile - 10%tile',
            ],
            2 => [
                104 => '99.9%tile - 100%tile',
                98 => '99.8%tile - 99.9%tile',
                92 => '99.6%tile - 99.8%tile',
                86 => '99.4%tile - 99.6%tile',
                83 => '99.2%tile - 99.4%tile',
                80 => '99%tile - 99.2%tile',
                76 => '98.5%tile - 99%tile',
                71 => '98%tile - 98.5%tile',
                66 => '97%tile - 98%tile',
                61 => '96%tile - 97%tile',
                57 => '95%tile - 96%tile',
                52 => '92%tile - 95%tile',
                45 => '89%tile - 92%tile',
                39 => '85%tile - 89%tile',
                35 => '80%tile - 85%tile',
                32 => '75%tile - 80%tile',
                28 => '70%tile - 75%tile',
                24 => '65%tile - 70%tile',
                21 => '60%tile - 65%tile',
                18 => '55%tile - 60%tile',
                15 => '50%tile - 55%tile',
                12 => '45%tile - 50%tile',
                8 => '35%tile - 45%tile',
                4 => '25%tile - 35%tile',
                1 => '15%tile - 25%tile',
                -2 => '10%tile - 15%tile',
                -INF => '0%tile - 10%tile',
            ],
            3 => [
                114 => '99.9%tile - 100%tile',
                106 => '99.8%tile - 99.9%tile',
                98 => '99.6%tile - 99.8%tile',
                92 => '99.4%tile - 99.6%tile',
                86 => '99.2%tile - 99.4%tile',
                83 => '99%tile - 99.2%tile',
                78 => '98.5%tile - 99%tile',
                74 => '98%tile - 98.5%tile',
                68 => '97%tile - 98%tile',
                64 => '96%tile - 97%tile',
                59 => '95%tile - 96%tile',
                55 => '92%tile - 95%tile',
                51 => '89%tile - 92%tile',
                46 => '85%tile - 89%tile',
                41 => '80%tile - 85%tile',
                35 => '75%tile - 80%tile',
                30 => '70%tile - 75%tile',
                27 => '65%tile - 70%tile',
                24 => '60%tile - 65%tile',
                20 => '55%tile - 60%tile',
                17 => '50%tile - 55%tile',
                15 => '45%tile - 50%tile',
                10 => '35%tile - 45%tile',
                6 => '25%tile - 35%tile',
                3 => '15%tile - 25%tile',
                -2 => '10%tile - 15%tile',
                -INF => '0%tile - 10%tile',
            ],
        ];

        // Clear and reseed to keep data in sync with code defaults.
        CatPercentileBracket::query()->truncate();

        foreach ($payload as $shift => $brackets) {
            $order = 0;
            // Sort by descending score to keep natural evaluation order.
            krsort($brackets);

            foreach ($brackets as $minScore => $label) {
                CatPercentileBracket::create([
                    'shift' => $shift,
                    'min_score' => is_infinite($minScore) ? -9999 : $minScore,
                    'label' => $label,
                    'sort_order' => $order++,
                ]);
            }
        }
    }
}
