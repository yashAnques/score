<?php

use App\Http\Controllers\Admin\AdminOverviewController;
use App\Http\Controllers\CatScoreCalculatorController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseOrderController;
use App\Http\Controllers\InterviewController;
use App\Http\Controllers\PhoneNumberController;
use App\Http\Controllers\PdfController;
use App\Http\Controllers\XatScoreCalculatorController;
use App\Models\CutoffContent;
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

    $cutoffTables = CutoffContent::query()
        ->where('exam', 'cat')
        ->value('payload') ?? [];

    return Inertia::render('cat-score-calculator', [
        'latestCalculation' => $latestCalculation,
        'pageContent' => $pageContent,
        'resultDelayMinutes' => (int) config('services.cat_score_result_delay_minutes', 0),
        'cutoffTables' => $cutoffTables,
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

    $cutoffTables = CutoffContent::query()
        ->where('exam', 'xat')
        ->value('payload') ?? [];

    return Inertia::render('xat-score-calculator', [
        'latestCalculation' => $latestCalculation,
        'pageContent' => $pageContent,
        'resultDelayMinutes' => (int) config('services.xat_score_result_delay_minutes', 0),
        'cutoffTables' => $cutoffTables,
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

    Route::get('/interviews', [InterviewController::class, 'index'])->name('interviews.index');
    Route::get('/interviews/credits', [\App\Http\Controllers\InterviewCreditController::class, 'index'])->name('interviews.credits.index');
    Route::get('/interviews/slots', [\App\Http\Controllers\InterviewSlotController::class, 'index'])->name('interviews.slots.index');
    Route::get('/interviews/sessions', [\App\Http\Controllers\InterviewSessionController::class, 'index'])->name('interviews.sessions.index');
    Route::post('/interviews/sessions', [\App\Http\Controllers\InterviewSessionController::class, 'store'])->name('interviews.sessions.store');
    Route::post('/interviews/sessions/{session}/start', [\App\Http\Controllers\InterviewSessionController::class, 'start'])->name('interviews.sessions.start');
    Route::post('/interviews/sessions/{session}/questions/next', [\App\Http\Controllers\InterviewSessionController::class, 'nextQuestion'])->name('interviews.sessions.questions.next');
    Route::post('/interviews/sessions/{session}/questions/{question}/answer', [\App\Http\Controllers\InterviewSessionController::class, 'submitAnswer'])->name('interviews.sessions.questions.answer');
    Route::post('/interviews/sessions/{session}/complete', [\App\Http\Controllers\InterviewSessionController::class, 'complete'])->name('interviews.sessions.complete');
    Route::post('/interviews/sessions/{session}/cancel', [\App\Http\Controllers\InterviewSessionController::class, 'cancel'])->name('interviews.sessions.cancel');
    Route::post('/interviews/sessions/{session}/recordings/chunks', [\App\Http\Controllers\InterviewRecordingController::class, 'store'])->name('interviews.sessions.recordings.store');
    Route::get('/interviews/sessions/{session}/recordings/download', [\App\Http\Controllers\InterviewRecordingController::class, 'download'])->name('interviews.sessions.recordings.download');
    Route::post('/interviews/sop/validate', [\App\Http\Controllers\InterviewSessionController::class, 'validateSop'])->name('interviews.sop.validate');

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

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
