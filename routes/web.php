<?php

use App\Http\Controllers\Admin\AdminOverviewController;
use App\Http\Controllers\CatScoreCalculatorController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseOrderController;
use App\Http\Controllers\PhoneNumberController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\XatScoreCalculatorController;
use App\Http\Resources\CatScoreCalculationResource;
use App\Http\Resources\XatScoreCalculationResource;
use App\Models\Content;
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

    $pageContent = Content::query()
        ->where('page', 'cat-score-calculator')
        ->value('content');

    return Inertia::render('cat-score-calculator', [
        'latestCalculation' => $latestCalculation,
        'pageContent' => $pageContent,
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

    $pageContent = Content::query()
        ->where('page', 'xat-score-calculator')
        ->value('content');

    return Inertia::render('xat-score-calculator', [
        'latestCalculation' => $latestCalculation,
        'pageContent' => $pageContent,
    ]);
})->name('xat.score-calculator');

Route::middleware(['auth'])->post('/xat-score-calculator/calculate', [XatScoreCalculatorController::class, 'store'])->name('xat.score-calculator.calculate');

Route::get('/courses', [CourseController::class, 'index'])->name('courses.index');
Route::post('/courses/orders', [CourseOrderController::class, 'store'])->name('courses.orders.store');
Route::post('/courses/orders/verify', [CourseOrderController::class, 'verify'])->name('courses.orders.verify');
Route::get('/courses/purchase/success', [CourseController::class, 'success'])->name('courses.purchase.success');

Route::get('/pdfs', [PdfController::class, 'index'])->name('pdfs.index');
Route::get('/pdfs/{pdf}/download', [PdfController::class, 'download'])->name('pdfs.download');

Route::middleware(['auth'])->group(function () {
    Route::post('/profile/phone', [PhoneNumberController::class, 'store'])->name('profile.phone.store');
    Route::post('/profile/phone/send-otp', [PhoneNumberController::class, 'sendOtp'])->name('profile.phone.send-otp');
    Route::post('/profile/phone/verify-otp', [PhoneNumberController::class, 'verifyOtp'])->name('profile.phone.verify-otp');

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
