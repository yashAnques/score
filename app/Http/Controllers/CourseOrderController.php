<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateCourseOrderRequest;
use App\Http\Requests\VerifyCoursePaymentRequest;
use App\Mail\CoursePurchasedMail;
use App\Models\Course;
use App\Models\CoursePurchase;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CourseOrderController extends Controller
{
    /**
     * Create a Razorpay order and persist a pending order record.
     */
    public function store(CreateCourseOrderRequest $request): JsonResponse
    {
        $course = Course::query()
            ->where('is_active', true)
            ->findOrFail($request->integer('course_id'));

        $amount = $course->sale_price ?? $course->original_price;

        if ($amount === null) {
            return response()->json([
                'message' => 'This course is not currently available for purchase.',
            ], 422);
        }

        $keyId = config('services.razorpay.key_id');
        $keySecret = config('services.razorpay.key_secret');

        if (!$keyId || !$keySecret) {
            return response()->json([
                'message' => 'Payment gateway is not configured.',
            ], 503);
        }

        $amountInPaise = (int) round(((float) $amount) * 100);

        $receipt = sprintf('course-%s-%s', $course->id, Str::ulid()->toBase32());

        $response = Http::withBasicAuth($keyId, $keySecret)
            ->acceptJson()
            ->post('https://api.razorpay.com/v1/orders', [
                'amount' => $amountInPaise,
                'currency' => 'INR',
                'receipt' => $receipt,
                'payment_capture' => 1,
                'notes' => [
                    'course_id' => $course->id,
                    'course_slug' => $course->slug,
                    'customer_email' => $request->string('email')->toString(),
                ],
            ]);
        if ($response->failed()) {
            return response()->json([
                'message' => 'Unable to create payment order. Please try again in a few minutes.',
            ], 502);
        }

        $orderPayload = $response->json();

        if (!is_array($orderPayload) || empty($orderPayload['id'])) {
            return response()->json([
                'message' => 'Received an invalid response from the payment gateway.',
            ], 502);
        }

        $user = $request->user();

        if (!$user) {
            $user = User::query()->where('email', $request->string('email'))->first();
        }

        $order = Order::query()->create([
            'uuid' => Str::uuid()->toString(),
            'course_id' => $course->id,
            'user_id' => $user?->id,
            'customer_email' => $request->string('email')->toString(),
            'customer_name' => $request->input('name'),
            'customer_phone' => $request->input('phone'),
            'provider' => 'razorpay',
            'provider_order_id' => $orderPayload['id'],
            'amount' => $orderPayload['amount'],
            'currency' => $orderPayload['currency'],
            'status' => 'pending',
            'meta' => [
                'receipt' => $orderPayload['receipt'] ?? $receipt,
                'notes' => $orderPayload['notes'] ?? null,
            ],
        ]);

        return response()->json([
            'orderUuid' => $order->uuid,
            'providerOrderId' => $order->provider_order_id,
            'amount' => $order->amount,
            'currency' => $order->currency,
            'key' => $keyId,
        ], 201);
    }

    /**
     * Verify a Razorpay payment signature and activate course access.
     */
    public function verify(VerifyCoursePaymentRequest $request): JsonResponse
    {
        $order = Order::query()
            ->with('course')
            ->where('uuid', $request->string('order_uuid'))
            ->firstOrFail();

        if ($order->provider_order_id !== $request->string('provider_order_id')->toString()) {
            $order->update(['status' => 'failed']);

            return response()->json([
                'message' => 'Order mismatch detected. Please try again.',
            ], 422);
        }

        $keySecret = config('services.razorpay.key_secret');

        if (!$keySecret) {
            return response()->json([
                'message' => 'Payment gateway is not configured.',
            ], 503);
        }

        $generatedSignature = hash_hmac(
            'sha256',
            $order->provider_order_id.'|'.$request->string('provider_payment_id'),
            $keySecret,
        );

        if (!hash_equals($generatedSignature, $request->string('provider_signature')->toString())) {
            $order->update([
                'status' => 'failed',
                'provider_payment_id' => $request->string('provider_payment_id'),
                'provider_signature' => $request->string('provider_signature'),
            ]);

            return response()->json([
                'message' => 'We could not verify this payment. Please contact support.',
            ], 422);
        }

        if ($order->status !== 'paid') {
            $user = $order->user;

            if (!$user) {
                $user = User::query()->where('email', $order->customer_email)->first();
                if ($user) {
                    $order->user()->associate($user);
                }
            }

            $order->fill([
                'provider_payment_id' => $request->string('provider_payment_id'),
                'provider_signature' => $request->string('provider_signature'),
                'status' => 'paid',
                'paid_at' => Carbon::now(),
            ]);

            $meta = $order->meta ?? [];
            $meta['verified_at'] = Carbon::now()->toISOString();
            $order->meta = $meta;

            $order->save();

            $purchase = CoursePurchase::query()->updateOrCreate(
                [
                    'course_id' => $order->course_id,
                    'order_id' => $order->id,
                ],
                [
                    'user_id' => $order->user_id,
                    'email' => $order->customer_email,
                    'name' => $order->customer_name,
                    'status' => 'active',
                    'access_starts_at' => Carbon::now(),
                ],
            );

            Mail::to($order->customer_email)->send(new CoursePurchasedMail($order, $purchase));
        }

        return response()->json([
            'redirect' => route('courses.purchase.success', ['order' => $order->uuid]),
        ]);
    }
}
