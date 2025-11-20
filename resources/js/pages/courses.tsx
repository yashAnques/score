import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Head, router, usePage } from '@inertiajs/react';
import MarketingLayout from '@/layouts/marketing-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { SharedData } from '@/types';

type Course = {
    id: number;
    name: string;
    slug: string;
    imageUrl: string | null;
    ctaUrl: string | null;
    originalPrice: number | null;
    salePrice: number | null;
    descriptionPoints: string[];
    isActive: boolean;
};

type CoursesPageProps = {
    courses: Course[];
};

type CreateOrderResponse = {
    orderUuid: string;
    providerOrderId: string;
    amount: number;
    currency: string;
    key: string;
};

declare global {
    interface Window {
        Razorpay?: new (options: Record<string, unknown>) => {
            open: () => void;
            on: (event: string, handler: (data: Record<string, any>) => void) => void;
            close: () => void;
        };
    }
}

const createCurrencyFormatter = () =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    });

const getCsrfToken = (): string => {
    const element = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;

    return element?.content ?? '';
};

const normalizeIndianMobile = (value: string): string => {
    const digitsOnly = value.replace(/\D/g, '');

    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        return digitsOnly.slice(2);
    }

    if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
        return digitsOnly.slice(1);
    }

    return digitsOnly;
};

const isValidIndianMobile = (value: string): boolean => {
    const trimmed = value.trim();

    if (!trimmed) {
        return true;
    }

    const normalized = normalizeIndianMobile(trimmed);

    return /^[6-9]\d{9}$/.test(normalized);
};

export default function CoursesPage({ courses: rawCourses }: CoursesPageProps) {
    const formatter = useMemo(() => createCurrencyFormatter(), []);
    const courses = Array.isArray(rawCourses) ? rawCourses : [];
    const {
        props: { name: siteName, auth },
    } = usePage<SharedData>();
    const authenticatedUser = auth?.user ?? null;
    const userName = authenticatedUser?.name ?? '';
    const userEmail = authenticatedUser?.email ?? '';
    const userPhone = (authenticatedUser?.phone_number as string | null) ?? '';

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogHiddenForGateway, setDialogHiddenForGateway] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [formData, setFormData] = useState(() => ({
        name: userName,
        email: userEmail,
        phone: userPhone,
    }));
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [razorpayReady, setRazorpayReady] = useState(false);
    const [lastEmail, setLastEmail] = useState(userEmail);
    const [redirecting, setRedirecting] = useState(false);

    const phoneError = useMemo(() => {
        const trimmed = formData.phone.trim();

        if (!trimmed) {
            return null;
        }

        if (isValidIndianMobile(trimmed)) {
            return null;
        }

        return 'Please enter a valid Indian mobile number (10 digits starting with 6-9).';
    }, [formData.phone]);

    useEffect(() => {
        if (window.Razorpay) {
            setRazorpayReady(true);

            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setRazorpayReady(true);
        script.onerror = () =>
            setError('Unable to load Razorpay checkout. Please check your connection and try again.');
        document.body.appendChild(script);
    }, []);

    useEffect(() => {
        setFormData((prev) => {
            const next = {
                name: prev.name || userName,
                email: prev.email || userEmail || lastEmail,
                phone: prev.phone || userPhone,
            };

            if (next.name === prev.name && next.email === prev.email && next.phone === prev.phone) {
                return prev;
            }

            return next;
        });

        setLastEmail((prev) => prev || userEmail);
    }, [userName, userEmail, userPhone, lastEmail]);

    const closeDialog = useCallback((options?: { keepRedirecting?: boolean }) => {
        setDialogOpen(false);
        setDialogHiddenForGateway(false);
        setSelectedCourse(null);
        setLoading(false);
        setError(null);
        if (!options?.keepRedirecting) {
            setRedirecting(false);
        }
    }, []);

    const handleBuyNow = useCallback(
        (course: Course) => {
            setSelectedCourse(course);
            setDialogOpen(true);
            setDialogHiddenForGateway(false);
            setError(null);
            setRedirecting(false);

            setFormData((prev) => ({
                name: prev.name || userName,
                email: prev.email || userEmail || lastEmail,
                phone: prev.phone || userPhone,
            }));
        },
        [lastEmail, userEmail, userName, userPhone],
    );

    const handleFieldChange = (field: 'name' | 'email' | 'phone') => (event: ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: event.target.value }));
        setError(null);
    };

    const verifyPayment = useCallback(
        async (payload: {
            orderUuid: string;
            providerOrderId: string;
            providerPaymentId: string;
            providerSignature: string;
        }) => {
            try {
                const response = await fetch('/courses/orders/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        order_uuid: payload.orderUuid,
                        provider_order_id: payload.providerOrderId,
                        provider_payment_id: payload.providerPaymentId,
                        provider_signature: payload.providerSignature,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(
                        data?.message ??
                            'We were unable to verify your payment. Please contact support with your payment details.',
                    );
                    setLoading(false);
                    setRedirecting(false);

                    return;
                }

                closeDialog({ keepRedirecting: true });
                router.visit(data.redirect, {
                    replace: true,
                    onCancel: () => {
                        setLoading(false);
                        setRedirecting(false);
                    },
                    onError: () => {
                        setLoading(false);
                        setRedirecting(false);
                    },
                    onFinish: () => {
                        setRedirecting(false);
                    },
                });
            } catch (err) {
                console.error(err);
                setError('Unexpected error while verifying payment. Please try again.');
                setLoading(false);
                setRedirecting(false);
            }
        },
        [closeDialog],
    );

    const handleCheckout = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!selectedCourse) {
                setError('Please select a course to continue.');

                return;
            }

            if (!razorpayReady || !window.Razorpay) {
                setError('Payment gateway is still loading. Please wait a moment and try again.');

                return;
            }

            if (phoneError) {
                setError(phoneError);

                return;
            }

            const trimmedPhone = formData.phone.trim();
            const sanitizedPhone = trimmedPhone ? normalizeIndianMobile(trimmedPhone) : null;

            setLoading(true);
            setError(null);
            setRedirecting(false);
            setDialogHiddenForGateway(false);

            try {
                const response = await fetch('/courses/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({
                        course_id: selectedCourse.id,
                        email: formData.email.trim(),
                        name: formData.name.trim() || null,
                        phone: sanitizedPhone ?? null,
                    }),
                });

                const data: CreateOrderResponse | { message?: string; errors?: Record<string, string[]> } =
                    await response.json();

                if (!response.ok) {
                    if ('errors' in data && data.errors) {
                        const firstError = Object.values(data.errors)?.[0]?.[0] ?? 'Please check the details and retry.';
                        setError(firstError);
                    } else {
                        setError(
                            'We could not start the checkout. Please verify your details or try again in a moment.',
                        );
                    }
                    setLoading(false);
                    setRedirecting(false);

                    return;
                }

                const orderResponse = data as CreateOrderResponse;
                const razorpay = new window.Razorpay({
                    key: orderResponse.key,
                    amount: orderResponse.amount,
                    currency: orderResponse.currency,
                    name: siteName ?? 'BschoolBuzz',
                    description: selectedCourse.name,
                    order_id: orderResponse.providerOrderId,
                    prefill: {
                        name: formData.name,
                        email: formData.email,
                        contact: sanitizedPhone ?? undefined,
                    },
                    notes: {
                        course_id: selectedCourse.id,
                        course_slug: selectedCourse.slug,
                    },
                    theme: {
                        color: '#0f172a',
                    },
                    modal: {
                        ondismiss: () => {
                            setLoading(false);
                            if (!redirecting) {
                                setDialogHiddenForGateway(false);
                                setDialogOpen(true);
                                setRedirecting(false);
                            }
                        },
                    },
                    handler: (paymentResponse: Record<string, string>) => {
                        setLoading(true);
                        setRedirecting(true);
                        setDialogHiddenForGateway(false);
                        setLastEmail(formData.email);
                        verifyPayment({
                            orderUuid: orderResponse.orderUuid,
                            providerOrderId: paymentResponse.razorpay_order_id,
                            providerPaymentId: paymentResponse.razorpay_payment_id,
                            providerSignature: paymentResponse.razorpay_signature,
                        });
                    },
                });

                razorpay.on('payment.failed', (failureResponse) => {
                    console.error('Razorpay payment failed', failureResponse);
                    setError(
                        failureResponse?.error?.description ??
                            'Payment failed. No money was deducted. Please try again or use a different method.',
                    );
                    setLoading(false);
                    setDialogHiddenForGateway(false);
                    setRedirecting(false);
                    setDialogOpen(true);
                });

                setDialogHiddenForGateway(true);
                setDialogOpen(false);
                razorpay.open();
            } catch (err) {
                console.error(err);
                setError('Unexpected error while initiating payment. Please try again.');
                setLoading(false);
                setDialogHiddenForGateway(false);
                setRedirecting(false);
            }
        },
        [
            formData.email,
            formData.name,
            formData.phone,
            phoneError,
            razorpayReady,
            redirecting,
            selectedCourse,
            siteName,
            verifyPayment,
        ],
    );

    useEffect(() => {
        const hash = window.location.hash.replace(/^#/, '');

        if (!hash) {
            return;
        }

        const decodedHash = decodeURIComponent(hash);

        const timeout = window.setTimeout(() => {
            const targetElement =
                decodedHash === 'courses'
                    ? document.getElementById('courses')
                    : document.querySelector(`[data-course-slug="${decodedHash}"]`) ||
                        document.getElementById(decodedHash);

            if (!targetElement) {
                return;
            }

            const y = targetElement.getBoundingClientRect().top + window.scrollY - 230;
            window.scrollTo({ top: y < 0 ? 0 : y, behavior: 'smooth' });
        }, 200);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [courses.length]);

    return (
        <MarketingLayout>
            <Head title="Courses" />
            <div className="flex flex-col gap-16 pb-20">
                <section id="courses" className="bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#172554] py-16 text-white">
                    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-center">
                        <span className="mx-auto inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 shadow-sm">
                            Premium Programs
                        </span>
                        <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                            Learn with BschoolBuzz Courses
                        </h1>
                        <p className="mx-auto max-w-3xl text-base leading-relaxed text-white/80 sm:text-lg">
                            Curated live programs and self-paced tracks to help you ace CAT, XAT, and every round of
                            your B-school journey. Explore the course that fits your goals and start learning today.
                        </p>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-6xl px-4">
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => {
                            const hasDiscount =
                                course.salePrice !== null &&
                                course.originalPrice !== null &&
                                course.salePrice < course.originalPrice;

                            return (
                                <Card
                                    key={course.id}
                                    id={course.slug}
                                    data-course-slug={course.slug}
                                    className="group flex h-full flex-col overflow-hidden border border-primary/10 bg-gradient-to-b from-background via-background to-primary/5 py-0 shadow-lg shadow-primary/10 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/20 sm:py-0"
                                >
                                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                                        {course.imageUrl ? (
                                            <img
                                                src={course.imageUrl}
                                                alt={course.name}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-sm font-semibold text-primary">
                                                {course.name}
                                            </div>
                                        )}
                                    </div>

                                    <CardHeader className="flex flex-1 flex-col gap-3">
                                        <CardTitle className="text-xl font-semibold text-foreground">
                                            {course.name}
                                        </CardTitle>
                                        <div className="flex items-baseline gap-3">
                                            {course.salePrice !== null ? (
                                                <span className="text-2xl font-bold text-primary">
                                                    {formatter.format(course.salePrice)}
                                                </span>
                                            ) : null}
                                            {hasDiscount && course.originalPrice !== null ? (
                                                <span className="text-sm font-medium text-muted-foreground line-through">
                                                    {formatter.format(course.originalPrice)}
                                                </span>
                                            ) : null}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="flex flex-1 flex-col gap-6 pb-6">
                                        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                                            {course.descriptionPoints.map((point, index) => (
                                                <li key={`${course.slug}-${index}`} className="flex items-center gap-2">
                                                    <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-primary" />
                                                    <span className='font-bold text-[#000000] dark:text-[#ffffff]'>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Button
                                            type="button"
                                            className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-sky-500 bg-[length:220%_220%] py-6 text-base font-semibold tracking-wide text-white shadow-[0_20px_45px_rgba(251,191,36,0.35)] transition-all duration-500 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400 disabled:opacity-70 cursor-pointer"
                                            size="lg"
                                            onClick={() => handleBuyNow(course)}
                                            disabled={!razorpayReady}
                                        >
                                            {razorpayReady ? 'Buy Now' : 'Preparing Checkout…'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {!courses.length ? (
                        <div className="mt-10 rounded-lg border border-dashed border-primary/20 bg-primary/5 p-10 text-center text-muted-foreground">
                            New courses are launching soon. Stay tuned!
                        </div>
                    ) : null}
                </section>
            </div>

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        if (dialogHiddenForGateway) {
                            setDialogHiddenForGateway(false);

                            return;
                        }

                        closeDialog();
                    } else {
                        setDialogHiddenForGateway(false);
                        setDialogOpen(true);
                    }
                }}
            >
                <DialogContent className="max-w-xl rounded-3xl border border-slate-100 bg-white/95 p-0 shadow-[0_30px_120px_rgba(15,23,42,0.18)]">
                    <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#e11d48] px-6 py-5 text-white">
                        <div className="absolute -right-6 top-3 h-20 w-20 rounded-full bg-white/10 blur-3xl" />
                        <div className="flex items-center justify-between mt-4">
                            <div>
                                <p className="text-sm uppercase tracking-[0.3em] text-white/70">Secure checkout</p>
                                <h3 className="text-2xl font-semibold leading-tight">Complete your purchase</h3>
                            </div>
                            {selectedCourse ? (
                                <div className="rounded-2xl bg-white/15 px-3 py-2 text-sm font-semibold text-white backdrop-blur">
                                    {formatter.format(selectedCourse.salePrice ?? selectedCourse.originalPrice ?? 0)}
                                </div>
                            ) : null}
                        </div>
                        <p className="mt-2 text-sm text-white/80">
                            Secure your access to <strong>{selectedCourse?.name}</strong>. You can use Razorpay test
                            cards to try the flow.
                        </p>
                    </div>
                    
                    {/* <DialogHeader>
                        <DialogTitle className="sr-only">Complete your purchase</DialogTitle>
                        <DialogDescription className="sr-only">Fill your payment details</DialogDescription>
                    </DialogHeader> */}

                    {error ? (
                        <Alert variant="destructive">
                            <AlertTitle>Heads up</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : null}

                    <form className="flex flex-col gap-5 px-6 pb-3 pt-4" onSubmit={handleCheckout}>
                        <div className="space-y-2">
                            <Label htmlFor="buyer-name" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Full name
                            </Label>
                            <Input
                                id="buyer-name"
                                placeholder="Jane Doe"
                                value={formData.name}
                                onChange={handleFieldChange('name')}
                                autoComplete="name"
                                className="p-5 border border-slate-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="buyer-email" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Email address
                            </Label>
                            <Input
                                id="buyer-email"
                                type="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleFieldChange('email')}
                                autoComplete="email"
                                required
                                className="p-5 border border-slate-300"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="buyer-phone" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Contact number (optional)
                            </Label>
                            <Input
                                id="buyer-phone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={formData.phone}
                                onChange={handleFieldChange('phone')}
                                autoComplete="tel"
                                aria-invalid={phoneError ? 'true' : 'false'}
                                className="p-5 border border-slate-300"
                            />
                            {phoneError ? <p className="text-xs font-medium text-destructive">{phoneError}</p> : null}
                        </div>

                        <DialogFooter className="flex flex-col gap-3 pt-2 sm:flex-row">
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full border border-slate-500 cursor-pointer text-base font-semibold text-slate-600 transition py-5 px-6 hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                                onClick={() => closeDialog()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r cursor-pointer from-amber-600 via-yellow-500 to-sky-500 bg-[length:200%_200%] py-5 px-6 text-base font-semibold tracking-wide text-white transition focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-70 sm:w-auto"
                                disabled={
                                    loading ||
                                    !formData.email.trim() ||
                                    !selectedCourse ||
                                    !razorpayReady ||
                                    Boolean(phoneError)
                                }
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing
                                    </>
                                ) : (
                                    'Proceed to Pay'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>

                    <p className="px-6 pb-6 text-[13px] text-muted-foreground">
                        Payments are securely processed by Razorpay. By continuing you agree to our terms and privacy
                        policy.
                    </p>
                </DialogContent>
            </Dialog>

            {redirecting ? (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3 rounded-lg bg-background px-6 py-4 shadow-lg shadow-primary/20">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">Finishing your payment…</span>
                    </div>
                </div>
            ) : null}
        </MarketingLayout>
    );
}
