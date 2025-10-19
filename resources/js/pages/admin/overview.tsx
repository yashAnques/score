import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { DateRangePicker, type DateRangeValue } from '@/components/date-range-picker';
import { dashboard as dashboardRoute } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { addDays, endOfDay, parseISO, startOfDay } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

type MetricTotals = {
    total: number;
    this_month: number;
};

type OverviewStats = {
    users: MetricTotals;
    cat: MetricTotals;
    xat: MetricTotals;
};

type RangeStats = {
    from: string;
    to: string;
    users: number;
    cat: number;
    xat: number;
} | null;

type PageProps = {
    stats: OverviewStats;
    range: RangeStats;
    filters: {
        start_date: string | null;
        end_date: string | null;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Overview',
        href: '/admin/overview',
    },
];

const formatNumber = (value: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
        value,
    );

export default function AdminOverview() {
    const {
        props: { stats, range, filters },
    } = usePage<PageProps>();

    const initialRange: DateRangeValue = useMemo(() => {
        if (filters.start_date && filters.end_date) {
            return {
                from: parseISO(filters.start_date),
                to: parseISO(filters.end_date),
            };
        }

        return undefined;
    }, [filters.end_date, filters.start_date]);

    const [pendingRange, setPendingRange] = useState<DateRangeValue>(
        initialRange,
    );

    useEffect(() => {
        setPendingRange(initialRange);
    }, [filters.start_date, filters.end_date, initialRange?.from, initialRange?.to]);

    const applyRange = (rangeValue: DateRangeValue) => {
        if (!rangeValue?.from || !rangeValue?.to) {
            setPendingRange(undefined);
            router.get('/admin/overview', {}, {
                preserveState: true,
                replace: true,
            });

            return;
        }

        const from = startOfDay(rangeValue.from);
        const to = endOfDay(rangeValue.to);

        const normalised = from.getTime() <= to.getTime()
            ? { from, to }
            : { from: to, to: from };

        setPendingRange(normalised);

        router.get(
            '/admin/overview',
            {
                start_date: normalised.from.toISOString().slice(0, 10),
                end_date: normalised.to.toISOString().slice(0, 10),
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const cards = [
        {
            label: 'Total users',
            value: stats.users.total,
            accent: 'bg-sky-100 text-sky-900 dark:bg-sky-500/10 dark:text-sky-200',
        },
        {
            label: 'Users this month',
            value: stats.users.this_month,
            accent: 'bg-violet-100 text-violet-900 dark:bg-violet-500/10 dark:text-violet-200',
        },
        {
            label: 'Total CAT submissions',
            value: stats.cat.total,
            accent: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200',
        },
        {
            label: 'CAT submissions this month',
            value: stats.cat.this_month,
            accent: 'bg-lime-100 text-lime-900 dark:bg-lime-500/10 dark:text-lime-200',
        },
        {
            label: 'Total XAT submissions',
            value: stats.xat.total,
            accent: 'bg-amber-100 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200',
        },
        {
            label: 'XAT submissions this month',
            value: stats.xat.this_month,
            accent: 'bg-rose-100 text-rose-900 dark:bg-rose-500/10 dark:text-rose-200',
        },
    ];

    const rangeCards = range
        ? [
              {
                  label: `Users (${range.from} → ${range.to})`,
                  value: range.users,
              },
              {
                  label: `CAT submissions (${range.from} → ${range.to})`,
                  value: range.cat,
              },
              {
                  label: `XAT submissions (${range.from} → ${range.to})`,
                  value: range.xat,
              },
          ]
        : [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Overview" />

            <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Overview
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Monitor user growth and score submissions across the
                            platform.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <DateRangePicker
                            value={pendingRange}
                            onChange={applyRange}
                            onClear={() => {
                                setPendingRange(undefined);
                            }}
                        />
                        <Button
                            variant="ghost"
                            onClick={() => {
                                const now = new Date();
                                const last7 = addDays(now, -6);
                                const preset = {
                                    from: startOfDay(last7),
                                    to: endOfDay(now),
                                };
                                applyRange(preset);
                            }}
                        >
                            Last 7 days
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {cards.map((card) => (
                        <Card
                            key={card.label}
                            className="border border-slate-200 shadow-sm dark:border-slate-800"
                        >
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {card.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`inline-flex rounded-xl px-3 py-2 text-lg font-semibold ${card.accent}`}
                                >
                                    {formatNumber(card.value)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {rangeCards.length > 0 && (
                    <div className="mt-4 space-y-3">
                        <h2 className="text-sm font-semibold text-muted-foreground">
                            Filtered range totals
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {rangeCards.map((card) => (
                                <Card
                                    key={card.label}
                                    className="border border-slate-200 shadow-sm dark:border-slate-800"
                                >
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            {card.label}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="inline-flex rounded-xl bg-slate-900/5 px-3 py-2 text-lg font-semibold text-slate-900 dark:bg-slate-100/10 dark:text-slate-100">
                                            {formatNumber(card.value)}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
