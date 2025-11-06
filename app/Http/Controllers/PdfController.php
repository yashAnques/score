<?php

namespace App\Http\Controllers;

use App\Http\Resources\PdfResource;
use App\Models\CoursePurchase;
use App\Models\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class PdfController extends Controller
{
    /**
     * Display a listing of PDFs.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $pdfCollection = Pdf::query()
            ->with('course')
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('title')
            ->get();

        $userCourseAccess = collect();

        if ($user) {
            $courseIds = $pdfCollection->pluck('course_id')->filter()->unique();

            if ($courseIds->isNotEmpty()) {
                $userCourseAccess = CoursePurchase::query()
                    ->whereIn('course_id', $courseIds)
                    ->where(function ($query) use ($user) {
                        $query->where('user_id', $user->id);

                        if ($user->email) {
                            $query->orWhere('email', $user->email);
                        }
                    })
                    ->pluck('course_id')
                    ->unique();
            }
        }

        $pdfs = $pdfCollection
            ->map(function (Pdf $pdf) use ($userCourseAccess) {
                $isPaid = ($pdf->course_id !== null) || strtolower($pdf->label) === 'paid';
                $isUnlocked = !$isPaid;

                if ($isPaid) {
                    $isUnlocked = $pdf->course_id
                        ? $userCourseAccess->contains($pdf->course_id)
                        : false;
                }

                return [
                    ...PdfResource::make($pdf)->resolve(),
                    'isPaid' => $isPaid,
                    'isUnlocked' => (bool) $isUnlocked,
                    'courseUrl' => $pdf->course ? route('courses.index').'#'.$pdf->course->slug : route('courses.index'),
                ];
            })
            ->values();

        return Inertia::render('pdfs', [
            'pdfs' => $pdfs,
            'canManage' => $user !== null,
        ]);
    }

    /**
     * Handle a download request and track counts.
     */
    public function download(Request $request, Pdf $pdf): RedirectResponse
    {
        if (!$pdf->is_active) {
            abort(404);
        }

        $user = $request->user();
        $isPaid = ($pdf->course_id !== null) || strtolower($pdf->label) === 'paid';

        if ($isPaid) {
            if (!$user) {
                return Redirect::route('courses.index')->with('flash.banner', 'Please purchase the course to unlock this PDF.');
            }

            $hasAccess = $pdf->course_id
                ? CoursePurchase::query()
                    ->where('course_id', $pdf->course_id)
                    ->where(function ($query) use ($user) {
                        $query->where('user_id', $user->id);

                        if ($user->email) {
                            $query->orWhere('email', $user->email);
                        }
                    })
                    ->exists()
                : false;

            if (!$hasAccess) {
                return Redirect::route('courses.index')->with('flash.banner', 'Enroll in the course to access this PDF.');
            }
        }

        $pdf->increment('download_count');

        return Redirect::away($pdf->file_url);
    }
}
