<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $keys = [
            'cat_nav_link',
            'xat_nav_link',
            'courses_nav_link',
            'pdfs_nav_link',
            'navbar_whatsapp_link',
            'otp_verification',
            'navigation_layout',
        ];

        $settings = Setting::query()
            ->whereIn('key', $keys)
            ->get()
            ->keyBy('key');

        $format = static function (?Setting $setting): ?array {
            if ($setting === null) {
                return null;
            }

            return [
                'label' => $setting->label,
                'text' => $setting->text,
                'url' => $setting->url,
                'meta' => $setting->meta ?? [],
            ];
        };

        $cat = $format($settings->get('cat_nav_link')) ?? [
            'label' => 'CAT Score Calculator',
            'text' => 'CAT Score Calculator',
            'url' => '/cat-score-calculator',
            'meta' => [],
        ];

        $xat = $format($settings->get('xat_nav_link')) ?? [
            'label' => 'XAT Score Calculator',
            'text' => 'XAT Score Calculator',
            'url' => '/xat-score-calculator',
            'meta' => [],
        ];

        $courses = $format($settings->get('courses_nav_link')) ?? [
            'label' => 'Courses',
            'text' => 'Courses',
            'url' => '/courses',
            'meta' => [],
        ];

        $pdfs = $format($settings->get('pdfs_nav_link')) ?? [
            'label' => 'PDFs',
            'text' => 'PDFs',
            'url' => '/pdfs',
            'meta' => [],
        ];

        $navLinks = array_values(array_filter([$cat, $xat, $courses, $pdfs], static function (?array $item) {
            return $item !== null && filled($item['url']);
        }));

        $settingsPayload = [
            'nav' => $navLinks,
            'whatsapp' => $format($settings->get('navbar_whatsapp_link')) ?? [
                'label' => 'Join CAT WhatsApp Group',
                'text' => '+91 63032 39042',
                'url' => 'https://wa.me/916303239042',
                'meta' => [
                    'cta_subtitle' => 'Join our official CAT WhatsApp group for daily updates.',
                ],
            ],
            'otp' => $settings->get('otp_verification')?->meta ?? [
                'enabled' => false,
                'msg91_api_key' => '',
                'msg91_sender_id' => '',
                'msg91_template_id' => '',
            ],
            'navigationLayout' => $settings->get('navigation_layout')?->text ?? 'horizontal',
        ];

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => !$request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'marketingLinks' => $settingsPayload,
            'otpSettings' => $settingsPayload['otp'],
        ];
    }
}
