<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#0b1220" media="(prefers-color-scheme: dark)">
        <meta name="theme-color" content="#f2f6ff" media="(prefers-color-scheme: light)">

        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        <style>
            html {
                background: radial-gradient(circle at top left, #e8f1ff 0%, #f9fbff 45%, #ffffff 100%);
                min-height: 100%;
            }

            html.dark {
                background: radial-gradient(circle at top left, #04060f 0%, #060b1b 40%, #090f1f 100%);
            }

            body {
                min-height: 100vh;
                background: transparent;
            }
        </style>

        <title inertia>{{ config('app.name', 'CAT Score Studio') }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=plus-jakarta-sans:400,500,600,700|jetbrains-mono:400,600" rel="stylesheet" />

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="min-h-screen bg-transparent font-['Plus_Jakarta_Sans'] text-slate-900 antialiased transition-colors duration-300 dark:text-slate-100">
        <script>
            window.__ADMIN_EMAILS__ = @json(config('admin.emails', []));
            window.__IS_ADMIN__ = Boolean(@json(optional(Auth::user())->is_admin));
        </script>
        @inertia
    </body>
</html>
