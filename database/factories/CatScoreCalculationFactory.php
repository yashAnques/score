<?php

namespace Database\Factories;

use App\Models\CatScoreCalculation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\CatScoreCalculation>
 */
class CatScoreCalculationFactory extends Factory
{
    protected $model = CatScoreCalculation::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'response_link' => $this->faker->url(),
            'candidate_name' => $this->faker->name(),
            'slot' => $this->faker->numberBetween(1, 3),
            'test_center' => $this->faker->city(),
            'total_score' => $this->faker->randomFloat(2, 10, 200),
            'total_percentile' => null,
            'overall_percentile' => $this->faker->randomFloat(2, 50, 100),
            'result_image_url' => null,
            'payload' => [],
        ];
    }
}
