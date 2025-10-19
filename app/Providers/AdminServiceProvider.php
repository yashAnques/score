<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AdminServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $emails = config('admin.emails', []);

        \App\Models\User::macro('isAdmin', function () use ($emails) {
            /** @var \App\Models\User $this */
            if (! empty($emails)) {
                return in_array($this->email, $emails, true);
            }

            return (bool) ($this->is_admin ?? false);
        });
    }
}
