@component('mail::message')
# Welcome to CAT/XAT Score Calculator,

Thanks for creating an account! We use your email to keep scorecards secure and to send you important updates.

Please confirm it now so you can start uploading response sheets and tracking your CAT/XAT progress.

@component('mail::button', ['url' => $actionUrl])
Verify my email
@endcomponent

If you didn’t create this account, feel free to ignore this email.

Looking forward to cheering on your prep,

{{ config('app.name', 'CAT Score Studio') }}
@endcomponent
