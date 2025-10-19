<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScoreSubmissionVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unverified_users_cannot_submit_cat_scores(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this
            ->actingAs($user)
            ->post('/cat-score-calculator/calculate', [
                 'link' => 'https://example.com/response.html',
             ]);

        $response->assertRedirect(route('verification.notice'));
    }

    public function test_unverified_users_cannot_submit_xat_scores(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this
            ->actingAs($user)
            ->post('/xat-score-calculator/calculate', [
                 'link' => 'https://example.com/response.html',
             ]);

        $response->assertRedirect(route('verification.notice'));
    }
}
