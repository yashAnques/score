@component('mail::message')
# Your AI interview starts soon

Hi {{ $session->user?->name ?? 'there' }},

This is a friendly reminder that your MBA interview with **{{ $courseName }}** starts in **{{ $minutesBefore }} minutes**.

@php
    $startDisplay = optional($startAt)
        ? optional($startAt->copy())->timezone($session->slot->timezone ?? config('app.timezone'))->format('d M Y · h:i A T')
        : 'TBA';
@endphp

@component('mail::panel')
**Scheduled at:** {{ $startDisplay }}

**Role:** {{ $session->candidate_role ?? 'MBA aspirant' }}

**Question limit:** {{ $session->question_limit }} prompts
@endcomponent

@component('mail::button', ['url' => $joinUrl])
Open Interview Room
@endcomponent

Make sure your camera and microphone are ready. Switching tabs or windows during the interview will automatically cancel the attempt for security reasons.

See you in the room!  
— {{ config('app.name') }}
@endcomponent
