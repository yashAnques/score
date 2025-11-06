import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

const phonePattern = /^(?:\+?91)?[6-9]\d{9}$/;

const getCsrfToken = () =>
    document
        .querySelector<HTMLMetaElement>("meta[name='csrf-token']")
        ?.getAttribute('content') ?? '';

type FieldErrors = {
    phone_number?: string;
    otp?: string;
    general?: string;
};

export function PhoneNumberDialog() {
    const { props } = usePage<SharedData>();
    const user = props.auth?.user;
    const otpSettings =
        props.otpSettings ??
        props.marketingLinks?.otp ?? {
            enabled: false,
            msg91_api_key: '',
            msg91_template_id: '',
            msg91_sender_id: '',
        };

    const requiresOtp = Boolean(otpSettings?.enabled);

    const [open, setOpen] = useState<boolean>(
        Boolean(user && !user.phone_number),
    );
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpValue, setOtpValue] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCountdown, setOtpCountdown] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const phoneFilled = phoneNumber.trim().length > 0;

    useEffect(() => {
        setOpen(Boolean(user && !user.phone_number));
    }, [user?.phone_number]);

    useEffect(() => {
        if (!otpSent) {
            return;
        }

        setOtpCountdown(60);
        const interval = window.setInterval(() => {
            setOtpCountdown((prev) => {
                if (prev <= 1) {
                    window.clearInterval(interval);
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(interval);
    }, [otpSent]);

    const disabled = useMemo(() => {
        if (!phoneNumber.trim()) {
            return true;
        }

        return !phonePattern.test(normalisePhone(phoneNumber));
    }, [phoneNumber]);

    if (!user) {
        return null;
    }

    const normalisedPhone = normalisePhone(phoneNumber);
    const localPhone = normalisedPhone.slice(-10);

    async function handleSendOtp() {
        if (disabled || otpCountdown > 0) {
            return;
        }

        setFieldErrors({});

        if (!phonePattern.test(normalisedPhone)) {
            setFieldErrors({
                phone_number: 'Enter a valid 10-digit Indian mobile number.',
            });
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/profile/phone/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    phone_number: normalisedPhone,
                }),
            });

            const payload = await response.json();

            if (!response.ok) {
                handleErrorResponse(payload);
                return;
            }

            setOtpSent(true);
            setFieldErrors({});
        } catch (error) {
            setFieldErrors({
                general: 'Unable to send OTP right now. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setFieldErrors({});

        if (!phonePattern.test(normalisedPhone)) {
            setFieldErrors({
                phone_number: 'Enter a valid 10-digit Indian mobile number.',
            });
            return;
        }

        if (requiresOtp) {
            if (!otpSent) {
                setFieldErrors({
                    general: 'Please request an OTP before submitting.',
                });
                return;
            }

            if (otpValue.trim().length !== 4) {
                setFieldErrors({
                    otp: 'Enter the 4-digit OTP sent to your phone.',
                });
                return;
            }
        }

        setLoading(true);

        const endpoint = requiresOtp
            ? '/profile/phone/verify-otp'
            : '/profile/phone';

        const payload: Record<string, string> = {
            phone_number: localPhone,
        };

        if (requiresOtp) {
            payload.otp = otpValue;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                handleErrorResponse(data);
                return;
            }

            setFieldErrors({});
            setOpen(false);
            router.reload({ only: ['auth'] });
        } catch (error) {
            setFieldErrors({
                general:
                    'Something went wrong while saving your phone number. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    }

    function handleErrorResponse(data: any) {
        if (data?.errors) {
            setFieldErrors({
                phone_number: data.errors.phone_number?.[0],
                otp: data.errors.otp?.[0],
                general: data.errors.general?.[0],
            });
        } else if (data?.message) {
            setFieldErrors({ general: data.message });
        } else {
            setFieldErrors({
                general: 'An unexpected error occurred. Please try again.',
            });
        }
    }

    return (
        <Dialog open={open}>
            <DialogContent className="mx-auto w-[92vw] max-w-md rounded-2xl border-0 p-5 bg-white text-slate-900 dark:bg-slate-950 dark:text-white sm:w-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        Verify your mobile number
                    </DialogTitle>
                    <DialogDescription className="space-y-2 text-sm text-slate-500 dark:text-slate-300">
                        <p>
                            We use your number for secure login alerts and quick
                            updates. Enter a 10-digit Indian mobile number to continue.
                        </p>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
                            <span className="inline-flex size-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-500 dark:bg-yellow-400/20 dark:text-yellow-300">
                                📲
                            </span>
                            <span>
                                You’ll receive important notifications and personalised
                                tips once your number is verified.
                            </span>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 px-1">
                    <div className="space-y-2">
                        <label
                            htmlFor="phone_number"
                            className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300"
                        >
                            Mobile number
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 dark:text-slate-500">
                                +91
                            </div>
                            <Input
                                id="phone_number"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="98765 43210"
                                value={phoneNumber}
                                onChange={(event) => {
                                    const onlyDigits = event.target.value.replace(/\D+/g, '');
                                    const trimmed = onlyDigits.slice(-10);
                                    setPhoneNumber(trimmed);
                                }}
                                maxLength={10}
                                className={`h-12 w-full rounded-xl border border-transparent bg-slate-50 pl-14 text-base text-slate-900 shadow-inner shadow-black/5 transition-all focus-visible:ring-2 focus-visible:ring-yellow-400/70 dark:bg-slate-900/60 dark:text-white dark:shadow-black/20 ${fieldErrors.phone_number ? 'border-red-500/70 focus-visible:ring-red-500/80' : 'hover:border-yellow-400/40 dark:hover:border-yellow-400/40'} sm:text-lg`}
                            />
                            {phoneFilled && (
                                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                                    {phonePattern.test(normalisedPhone)
                                        ? 'Looks good'
                                        : 'Invalid number'}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Enter the mobile number you use on WhatsApp for faster support.
                        </p>
                        {fieldErrors.phone_number && (
                            <p className="text-xs font-medium text-red-400">
                                {fieldErrors.phone_number}
                            </p>
                        )}
                    </div>

                    {requiresOtp && (
                        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        OTP verification
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        A 4-digit OTP will be sent via MSG91 to verify ownership.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSendOtp}
                                    disabled={disabled || loading || otpCountdown > 0}
                                    className="border-yellow-400/70 bg-yellow-400/10 text-yellow-600 transition hover:bg-yellow-400/20 hover:text-yellow-700 dark:border-yellow-400/60 dark:bg-transparent dark:text-yellow-300 dark:hover:bg-yellow-400/20 dark:hover:text-white cursor-pointer"
                                >
                                    {otpCountdown > 0
                                        ? `Resend in ${otpCountdown}s`
                                        : otpSent
                                            ? 'Resend OTP'
                                            : 'Send OTP'}
                                </Button>
                            </div>
                            <InputOTP
                                maxLength={4}
                                value={otpValue}
                                onChange={setOtpValue}
                                containerClassName="w-full justify-center"
                                disabled={!otpSent}
                            >
                                <InputOTPGroup className="flex w-full max-w-[240px] flex-wrap justify-center gap-3 sm:flex-nowrap">
                                    {[0, 1, 2, 3].map((slot) => (
                                        <InputOTPSlot
                                            key={slot}
                                            index={slot}
                                            className={cn(
                                                'h-12 w-12 rounded-xl border border-slate-300 bg-white text-xl font-semibold text-slate-900 shadow-sm shadow-black/5 transition-colors dark:border-slate-700 dark:bg-slate-900/70 dark:text-white dark:shadow-black/20 sm:h-14 sm:w-14 sm:text-2xl',
                                                otpSent
                                                    ? 'focus:border-yellow-400/70'
                                                    : 'opacity-40',
                                            )}
                                        />
                                    ))}
                                </InputOTPGroup>
                            </InputOTP>
                            {!otpSent && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Tap “Send OTP” to receive a verification code on your phone.
                                </p>
                            )}
                            {fieldErrors.otp && (
                            <p className="text-xs font-medium text-red-500 dark:text-red-400">
                                    {fieldErrors.otp}
                                </p>
                            )}
                        </div>
                    )}

                    {fieldErrors.general && (
                        <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:border-red-500/50 dark:text-red-200">
                            <span className="text-lg">⚠️</span>
                            <span>{fieldErrors.general}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="h-12 w-full rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-sm font-semibold text-slate-900 shadow-lg shadow-yellow-500/30 transition-all hover:scale-[1.01] hover:from-yellow-300 hover:to-orange-300 focus:ring focus:ring-yellow-400/40 disabled:pointer-events-none disabled:opacity-50 dark:text-slate-900 cursor-pointer"
                        disabled={
                            loading ||
                            disabled ||
                            (requiresOtp && (!otpSent || otpValue.trim().length !== 4))
                        }
                    >
                        {requiresOtp ? 'Verify & Continue' : 'Save number'}
                    </Button>

                    {!requiresOtp && (
                        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                            We respect your privacy. Your number will never be shared.
                        </p>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}

function normalisePhone(phone: string): string {
    const digits = (phone ?? '').replace(/\D+/g, '');
    const lastTen = digits.length > 10 ? digits.slice(-10) : digits;

    return `+91${lastTen}`;
}
