import { Head, Link } from '@inertiajs/react';
import MarketingLayout from '@/layouts/marketing-layout';
import { CheckCircle2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CourseSummary = {
    id: number;
    name: string;
    imageUrl: string | null;
    slug: string;
};

type OrderSummary = {
    uuid: string;
    providerOrderId: string;
    amount: number;
    currency: string;
    paidAt: string | null;
    email: string;
    status: string;
};

type CoursePurchaseSuccessProps = {
    course: CourseSummary;
    order: OrderSummary;
};

const formatAmount = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    });

    return formatter.format(amount / 100);
};

export default function CoursePurchaseSuccessPage({ course, order }: CoursePurchaseSuccessProps) {
    return (
        <MarketingLayout>
            <Head title="Purchase Successful" />
            <section className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-background to-primary/10 px-4 py-20">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/40 blur-3xl" />
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40">
                            <CheckCircle2 className="h-12 w-12 animate-in fade-in zoom-in-75" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm uppercase tracking-[0.35em] text-primary">Payment successful</p>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            You’re officially enrolled in {course.name}
                        </h1>
                        <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                            A confirmation email has been sent to <strong>{order.email}</strong>. We’ll share detailed
                            onboarding instructions, mentor connects, and access steps shortly.
                        </p>
                    </div>

                    <div className="grid w-full gap-6 rounded-2xl border border-primary/10 bg-card/60 p-6 shadow-lg shadow-primary/10 backdrop-blur">
                        <div className="grid gap-1 text-left">
                            <span className="text-xs font-semibold uppercase tracking-wide text-primary">Order ID</span>
                            <span className="text-base font-medium text-foreground">{order.providerOrderId}</span>
                        </div>
                        <div className="grid gap-1 text-left">
                            <span className="text-xs font-semibold uppercase tracking-wide text-primary">Amount Paid</span>
                            <span className="text-base font-medium text-foreground">
                                {formatAmount(order.amount, order.currency)}
                            </span>
                        </div>
                        <div className="grid gap-1 text-left">
                            <span className="text-xs font-semibold uppercase tracking-wide text-primary">Status</span>
                            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                {order.status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button asChild size="lg" className="bg-primary text-primary-foreground shadow-primary/30">
                            <Link href="/courses">Explore more courses</Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-primary/40 text-primary shadow-none"
                            asChild
                        >
                            <a href={`mailto:support@bschoolbuzz.in?subject=Course%20Purchase%20${order.providerOrderId}`}>
                                <Mail className="mr-2 h-4 w-4" />
                                Need help?
                            </a>
                        </Button>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
