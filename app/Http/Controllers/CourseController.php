<?php

namespace App\Http\Controllers;

use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    /**
     * Display a listing of the courses.
     */
    public function index(): Response
    {
        $courses = Course::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();

        return Inertia::render('courses', [
            'courses' => CourseResource::collection($courses)->resolve(),
        ]);
    }

    /**
     * Show the success screen after a completed purchase.
     */
    public function success(Request $request): Response
    {
        $orderUuid = $request->string('order');

        abort_if($orderUuid->isEmpty(), 404);

        $order = Order::query()
            ->with('course')
            ->where('uuid', $orderUuid)
            ->where('status', 'paid')
            ->firstOrFail();

        return Inertia::render('course-purchase-success', [
            'course' => CourseResource::make($order->course)->resolve(),
            'order' => [
                'uuid' => $order->uuid,
                'providerOrderId' => $order->provider_order_id,
                'amount' => (int) $order->amount,
                'currency' => $order->currency,
                'paidAt' => optional($order->paid_at)?->toIso8601String(),
                'email' => $order->customer_email,
                'status' => $order->status,
            ],
        ]);
    }
}
