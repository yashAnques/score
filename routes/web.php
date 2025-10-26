<?php

use App\Http\Controllers\Admin\AdminOverviewController;
use App\Http\Controllers\CatScoreCalculatorController;
use App\Http\Controllers\XatScoreCalculatorController;
use App\Http\Resources\CatScoreCalculationResource;
use App\Http\Resources\XatScoreCalculationResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('cat.score-calculator');
})->name('home');

Route::get('/cat-score-calculator', function (Request $request) {
    $latestCalculation = null;

    if ($request->user()) {
        $latest = $request->user()->catScoreCalculations()->latest()->first();

        if ($latest) {
            $latestCalculation = (new CatScoreCalculationResource($latest))->toArray($request);
        }
    }

    return Inertia::render('cat-score-calculator', [
        'latestCalculation' => $latestCalculation,
    ]);
})->name('cat.score-calculator');

Route::middleware(['auth'])->post('/cat-score-calculator/calculate', [CatScoreCalculatorController::class, 'store'])->name('cat.score-calculator.calculate');

Route::get('/xat-score-calculator', function (Request $request) {
    $latestCalculation = null;

    if ($request->user()) {
        $latest = $request->user()->xatScoreCalculations()->latest()->first();

        if ($latest) {
            $latestCalculation = (new XatScoreCalculationResource($latest))->toArray($request);
        }
    }

    return Inertia::render('xat-score-calculator', [
        'latestCalculation' => $latestCalculation,
    ]);
})->name('xat.score-calculator');

Route::middleware(['auth'])->post('/xat-score-calculator/calculate', [XatScoreCalculatorController::class, 'store'])->name('xat.score-calculator.calculate');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::middleware(['auth'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('overview', AdminOverviewController::class)->name('overview');
    });

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
