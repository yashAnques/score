@component('mail::message')
# Welcome to {{ $course->name }}

Hi {{ $purchase->name ?? 'there' }},

We’re excited to confirm your enrolment in **{{ $course->name }}**. Here’s a quick summary of your purchase:

@component('mail::panel')
- **Order ID:** {{ $order->provider_order_id }}
- **Course:** {{ $course->name }}
- **Amount Paid:** ₹{{ number_format($order->amount / 100, 2) }}
- **Status:** {{ ucfirst($order->status) }}
@endcomponent

We’ll reach out shortly with the next steps, access instructions, and mentor connects. If you used a test card, feel free to replay this flow anytime.

Need help? Reply to this email and our team will be right with you.

Thanks for choosing us!  
{{ config('app.name') }}
@endcomponent
