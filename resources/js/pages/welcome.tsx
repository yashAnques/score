import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarketingLayout from '@/layouts/marketing-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Compass, Gauge, Target } from 'lucide-react';
import { type ReactNode } from 'react';

const highlights = [
    {
        icon: Gauge,
        title: 'Predict percentiles with confidence',
        description:
            'Feed your attempts into the calculator and compare with the latest percentile curves.',
    },
    {
        icon: Target,
        title: 'Master every section',
        description:
            'Slot-wise analytics point out exactly which question types move your score fastest.',
    },
    {
        icon: Compass,
        title: 'Structured weekly planner',
        description:
            'Blend mocks, sectional tests, and revision blocks without burning out.',
    },
];

export default function Welcome() {
    return (
        <>
            <Head title="CAT Preparation Companion" />
            <section className="relative overflow-hidden bg-gradient-to-br from-[#F1F4FF] via-white to-[#FDF2FF] py-20 text-slate-900 dark:from-[#0A0B11] dark:via-[#0D1220] dark:to-[#050608] dark:text-white">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                    <div className="max-w-2xl space-y-6">
                        <Badge className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:bg-primary/15 dark:text-primary-foreground">
                            Our Prep Suite
                        </Badge>
                        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                            Everything you need to analyse, plan, and dominate CAT 2025.
                        </h1>
                        <p className="text-base text-slate-700 dark:text-slate-200 sm:text-lg">
                            Use our free score calculator, percentile predictor, and prep calendar to
                            understand exactly where you stand. Switch between light and dark mode to
                            stay focussed whether you are on your laptop or burning the midnight oil.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Button asChild size="lg" className="h-12 rounded-full">
                                <Link href="/cat-score-calculator">
                                    Try the CAT score calculator
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="h-12 rounded-full border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-white dark:hover:text-slate-900"
                            >
                                <Link href="/register">Create a free account</Link>
                            </Button>
                        </div>
                    </div>
                    <Card className="w-full max-w-md border border-primary/20 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-white/5">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                                Why aspirants choose us
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-200">
                            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 dark:border-white/10 dark:bg-white/10">
                                <span>540 students scored 99+%ile in CAT 2024</span>
                                <span className="text-sm font-semibold text-primary dark:text-emerald-300">
                                    Proven track record
                                </span>
                            </div>
                            <p>
                                Unlock sectional analytics, slot-specific scaling, and personalised
                                action plans without opening a spreadsheet. Everything is tuned for
                                serious aspirants who need clarity fast.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>
            <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                    <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                        Map your journey from response sheet to final offer.
                    </h2>
                    <p className="mt-3 text-base text-muted-foreground">
                        Get sharper after every mock with data-backed insights. Our prep workflow
                        keeps you on track till the admit arrives.
                    </p>
                </div>
                <div className="mt-10 grid gap-6 md:grid-cols-3">
                    {highlights.map((item) => (
                        <Card
                            key={item.title}
                            className="border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60"
                        >
                            <CardHeader className="flex flex-row items-center gap-3">
                                <span className="rounded-full bg-primary/10 p-2 text-primary dark:bg-primary/15 dark:text-primary-foreground">
                                    <item.icon className="h-5 w-5" />
                                </span>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                                    {item.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                {item.description}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </>
    );
}

Welcome.layout = (page: ReactNode) => <MarketingLayout>{page}</MarketingLayout>;
