<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class PhoneNumberController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePhone($request);
        $user = $request->user();

        $user->forceFill([
            'phone_number' => ltrim($validated, '+91'),
            'phone_verified_at' => now(),
        ])->save();

        return response()->json([
            'message' => 'Phone number updated successfully.',
        ]);
    }

    public function sendOtp(Request $request): JsonResponse
    {
        $settings = $this->otpSettings();

        if (! $settings['enabled']) {
            throw ValidationException::withMessages([
                'phone_number' => 'OTP verification is currently disabled.',
            ]);
        }

        $validated = $this->validatePhone($request);
        $otp = random_int(1000, 9999);

        Cache::put(
            $this->cacheKey($request->user()->id),
            ['otp' => (string) $otp, 'phone' => $validated],
            now()->addMinutes(10)
        );

        $this->dispatchOtp($validated, $otp, $settings);

        return response()->json([
            'message' => 'OTP sent successfully.',
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $settings = $this->otpSettings();

        if (! $settings['enabled']) {
            throw ValidationException::withMessages([
                'otp' => 'OTP verification is currently disabled.',
            ]);
        }

        $request->validate([
            'phone_number' => ['required'],
            'otp' => ['required', 'digits:4'],
        ]);

        $validatedPhone = $this->normalisePhone($request->input('phone_number'));

        $payload = Cache::get($this->cacheKey($request->user()->id));

        if (! $payload || $payload['otp'] !== $request->input('otp') || $payload['phone'] !== $validatedPhone) {
            throw ValidationException::withMessages([
                'otp' => 'The provided OTP is invalid or has expired.',
            ]);
        }

        Cache::forget($this->cacheKey($request->user()->id));

        $user = $request->user();
        $user->forceFill([
            'phone_number' => ltrim($validatedPhone, '+91'),
            'phone_verified_at' => now(),
        ])->save();

        return response()->json([
            'message' => 'Phone number verified successfully.',
        ]);
    }

    protected function validatePhone(Request $request): string
    {
        $request->validate([
            'phone_number' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    $digits = preg_replace('/\D+/', '', $value ?? '');
                    if (strlen($digits) > 10) {
                        $digits = substr($digits, -10);
                    }

                    if (strlen($digits) !== 10 || ! preg_match('/^[6-9]\d{9}$/', $digits)) {
                        $fail('Enter a valid 10-digit Indian mobile number.');
                    }
                },
            ],
        ]);

        return $this->normalisePhone($request->input('phone_number', ''));
    }

    protected function normalisePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone);
        if (strlen($digits) > 10) {
            $digits = substr($digits, -10);
        }

        return '+91'.$digits;
    }

    /**
     * @return array{enabled: bool, msg91_api_key: string, msg91_sender_id: string, msg91_template_id: string}
     */
    protected function otpSettings(): array
    {
        $settings = Setting::query()->where('key', 'otp_verification')->first();

        $defaults = [
            'enabled' => false,
            'msg91_api_key' => '',
            'msg91_sender_id' => '',
            'msg91_template_id' => '',
        ];

        if (! $settings) {
            return $defaults;
        }

        $meta = (array) ($settings->meta ?? []);

        return array_merge($defaults, $meta);
    }

    protected function dispatchOtp(string $phone, int $otp, array $settings): void
    {
        if (
            empty($settings['msg91_api_key']) ||
            empty($settings['msg91_sender_id']) ||
            empty($settings['msg91_template_id'])
        ) {
            return;
        }

        try {
            Http::withHeaders([
                'authkey' => $settings['msg91_api_key'],
                'Content-Type' => 'application/json',
            ])->post('https://control.msg91.com/api/v5/otp', [
                'template_id' => $settings['msg91_template_id'],
                'sender' => $settings['msg91_sender_id'],
                'mobile' => ltrim($phone, '+'),
                'otp' => (string) $otp,
            ])->throw();
        } catch (\Throwable $e) {
            report($e);
        }
    }

    protected function cacheKey(int $userId): string
    {
        return "phone-otp:{$userId}";
    }
}
