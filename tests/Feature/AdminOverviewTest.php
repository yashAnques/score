<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\CatScoreCalculation;
use App\Models\User;
use App\Models\XatScoreCalculation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminOverviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admins_are_forbidden(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->actingAs($user)
            ->get('/admin/overview')
            ->assertForbidden();
    }

    public function test_admin_can_view_overview_with_stats(): void
    {
        $admin = User::factory()->create([
            'is_admin' => true,
            'email_verified_at' => now(),
        ]);

        $userPool = User::factory()->count(3)->create();
        CatScoreCalculation::factory()
            ->count(2)
            ->for($userPool->first(), 'user')
            ->create();
        XatScoreCalculation::factory()
            ->count(4)
            ->for($userPool->last(), 'user')
            ->create();

        $this->actingAs($admin)
            ->get('/admin/overview')
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/overview')
                ->where('stats.users.total', 4) // includes admin + 3 users
                ->where('stats.cat.total', 2)
                ->where('stats.xat.total', 4)
            );
    }

    public function test_admin_can_filter_by_date_range(): void
    {
        $admin = User::factory()->create([
            'is_admin' => true,
            'email_verified_at' => now(),
        ]);

        $start = Carbon::parse('2024-01-01');
        $end = Carbon::parse('2024-01-31');

        User::factory()->create(['created_at' => $start->copy()->addDays(1)]);
        CatScoreCalculation::factory()->create(['created_at' => $start->copy()->addDays(2)]);
        XatScoreCalculation::factory()->create(['created_at' => $start->copy()->addDays(3)]);

        $this->actingAs($admin)
            ->get('/admin/overview?start_date=2024-01-01&end_date=2024-01-31')
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/overview')
                ->where('range.users', 1)
                ->where('range.cat', 1)
                ->where('range.xat', 1)
                ->where('range.from', '2024-01-01')
                ->where('range.to', '2024-01-31')
            );
    }
}
