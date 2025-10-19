<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CatScoreCalculation;
use App\Models\User;
use App\Models\XatScoreCalculation;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminOverviewController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        abort_if(! $user || ! $user->isAdmin(), 403);

        $startDate = $request->date('start_date');
        $endDate = $request->date('end_date');

        if ($startDate && $endDate && $startDate->gt($endDate)) {
            [$startDate, $endDate] = [$endDate, $startDate];
        }

        $thisMonthRange = [
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth(),
        ];

        $stats = [
            'users' => [
                'total' => User::count(),
                'this_month' => User::whereBetween('created_at', $thisMonthRange)->count(),
            ],
            'cat' => [
                'total' => CatScoreCalculation::count(),
                'this_month' => CatScoreCalculation::whereBetween('created_at', $thisMonthRange)->count(),
            ],
            'xat' => [
                'total' => XatScoreCalculation::count(),
                'this_month' => XatScoreCalculation::whereBetween('created_at', $thisMonthRange)->count(),
            ],
        ];

        $rangeStats = null;

        if ($startDate && $endDate) {
            $start = $startDate->copy()->startOfDay();
            $end = $endDate->copy()->endOfDay();

            $rangeStats = [
                'from' => $start->toDateString(),
                'to' => $end->toDateString(),
                'users' => User::whereBetween('created_at', [$start, $end])->count(),
                'cat' => CatScoreCalculation::whereBetween('created_at', [$start, $end])->count(),
                'xat' => XatScoreCalculation::whereBetween('created_at', [$start, $end])->count(),
            ];
        }

        return Inertia::render('admin/overview', [
            'stats' => $stats,
            'range' => $rangeStats,
            'filters' => [
                'start_date' => $startDate?->toDateString(),
                'end_date' => $endDate?->toDateString(),
            ],
        ]);
    }
}
