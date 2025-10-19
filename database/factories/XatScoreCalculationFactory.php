<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\XatScoreCalculation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\XatScoreCalculation>
 */
class XatScoreCalculationFactory extends Factory
{
    protected $model = XatScoreCalculation::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'response_link' => $this->faker->url(),
            'xat_id' => $this->faker->bothify('XAT####'),
            'candidate_name' => $this->faker->name(),
            'test_center' => $this->faker->city(),
            'total_score' => $this->faker->randomFloat(2, 10, 150),
            'total_percentile' => $this->faker->randomFloat(2, 50, 100),
            'overall_percentile' => $this->faker->randomFloat(2, 50, 100),
            'result_image_url' => null,
            'payload' => [],
        ];
    }
}
