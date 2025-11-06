<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyCoursePaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'order_uuid' => ['required', 'uuid', 'exists:orders,uuid'],
            'provider_order_id' => ['required', 'string'],
            'provider_payment_id' => ['required', 'string'],
            'provider_signature' => ['required', 'string'],
        ];
    }
}
