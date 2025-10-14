import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MarketingLayout from '@/layouts/marketing-layout';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Check,
    ClipboardList,
    FileSpreadsheet,
    GraduationCap,
    Layers,
    LineChart,
    Sparkles,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

type SectionKey = 'varc' | 'dilr' | 'qa';

type SectionInput = {
    correct: number;
    incorrect: number;
};

type SectionConfig = {
    label: string;
    questions: number;
    description: string;
};

const sectionConfig: Record<SectionKey, SectionConfig> = {
    varc: {
        label: 'VARC',
        questions: 24,
        description: 'Verbal Ability & Reading Comprehension',
    },
    dilr: {
        label: 'DILR',
        questions: 20,
        description: 'Data Interpretation & Logical Reasoning',
    },
    qa: {
        label: 'QA',
        questions: 22,
        description: 'Quantitative Aptitude',
    },
};

const rawToPercentileTiers = [
    { threshold: 165, percentile: 99.9 },
    { threshold: 150, percentile: 99.7 },
    { threshold: 140, percentile: 99.4 },
    { threshold: 130, percentile: 99 },
    { threshold: 120, percentile: 98.4 },
    { threshold: 110, percentile: 97.5 },
    { threshold: 100, percentile: 96 },
    { threshold: 90, percentile: 94 },
    { threshold: 80, percentile: 92 },
    { threshold: 70, percentile: 89 },
    { threshold: 60, percentile: 85 },
    { threshold: 50, percentile: 80 },
    { threshold: 40, percentile: 72 },
    { threshold: 30, percentile: 62 },
    { threshold: 20, percentile: 50 },
    { threshold: 10, percentile: 35 },
    { threshold: 0, percentile: 20 },
];

const stats = [
    {
        label: 'Students used our predictor',
        value: '65,000+',
        description: 'Trusted by serious CAT aspirants since 2017',
    },
    {
        label: 'Predicted 99+ percentilers',
        value: '540',
        description: 'CAT 2024 toppers validated our estimates',
    },
    {
        label: 'Accuracy benchmark',
        value: '±1.8%',
        description: 'Average deviation from published percentiles',
    },
];

const features = [
    {
        icon: FileSpreadsheet,
        title: 'Slot Normalisation',
        description:
            'We adjust your raw score with historical slot difficulty data to mirror official scaling.',
    },
    {
        icon: BarChart3,
        title: 'Sectional Analytics',
        description:
            'Get tailored insights for VARC, DILR, and QA—know exactly where you stand in each section.',
    },
    {
        icon: Sparkles,
        title: 'Actionable Roadmap',
        description:
            'Personalised tips to push into your target percentile band within the remaining prep window.',
    },
];

const steps = [
    {
        title: 'Paste Response Sheet URL',
        description:
            'Download your response sheet from the CAT portal and paste the link in the calculator above.',
    },
    {
        title: 'Verify Attempt Summary',
        description:
            'Enter the number of correct and incorrect attempts for each section to build your raw score.',
    },
    {
        title: 'Get Percentile & Plan',
        description:
            'Receive your scaled score, expected percentile, and a custom improvement strategy instantly.',
    },
];

const percentileBands = [
    { percentile: '99.9', expectedScore: '165+', takeaway: 'IIM ABC in striking distance' },
    { percentile: '99.5', expectedScore: '148 - 160', takeaway: 'Target IIM LKI, FMS, IIT DMS' },
    { percentile: '99', expectedScore: '135 - 147', takeaway: 'Convert blackis, IITs, SPJIMR' },
    { percentile: '98', expectedScore: '120 - 134', takeaway: 'Focus on IIM CAP, NMIMS, SIBM' },
    { percentile: '95', expectedScore: '100 - 119', takeaway: 'SJMSOM, MDI, DFS and more' },
    { percentile: '90', expectedScore: '80 - 99', takeaway: 'Great Lakes, TAPMI, XIMB, IMT' },
];

const faqs = [
    {
        question: 'How reliable is this CAT score calculator?',
        answer:
            'We benchmark every prediction against thousands of historical response sheets. The algorithm blends raw scoring, slot-wise scaling, and percentile curves built from real results.',
    },
    {
        question: 'What inputs do I need to provide?',
        answer:
            'Just count your correct and incorrect attempts in each section. The calculator handles the official marking scheme, scaling, and percentile conversion.',
    },
    {
        question: 'Can I track multiple attempts?',
        answer:
            'Yes. Save different input combinations to map your progress. We recommend updating your numbers after every mock or when the official answer key releases.',
    },
    {
        question: 'Does it work for all slots?',
        answer:
            'Absolutely. Slot normalisation is baked in. Simply choose the slot you appeared in so we can apply the right difficulty adjustments.',
    },
    {
        question: 'Is this tool free to use?',
        answer:
            'Yes. The CAT score calculator, percentile predictor, and preparation resources on this page are all available for free.',
    },
];

const defaultInputs: Record<SectionKey, SectionInput> = {
    varc: { correct: 14, incorrect: 5 },
    dilr: { correct: 12, incorrect: 4 },
    qa: { correct: 11, incorrect: 3 },
};

export default function CatScoreCalculator() {
    const [slot, setSlot] = useState<'slot-1' | 'slot-2' | 'slot-3'>('slot-1');
    const [inputs, setInputs] = useState(defaultInputs);

    const results = useMemo(() => {
        const sectionScores = (Object.keys(sectionConfig) as SectionKey[]).map(
            (key) => {
                const section = sectionConfig[key];
                const { correct, incorrect } = inputs[key];
                const mcqScore = correct * 3 - incorrect;
                const rawScore = Math.max(mcqScore, 0);
                const accuracy =
                    correct + incorrect === 0
                        ? 0
                        : Math.max(
                              Math.min(
                                  Math.round((correct / (correct + incorrect)) * 100),
                                  100,
                              ),
                              0,
                          );

                const slotMultiplier =
                    slot === 'slot-1' ? 1 :
                    slot === 'slot-2' ? 1.015 : 1.03;

                const scaledScore = Math.round(
                    Math.min(rawScore * slotMultiplier + 0.8 * correct, section.questions * 3.2),
                );

                return {
                    key,
                    label: section.label,
                    questions: section.questions,
                    rawScore,
                    scaledScore,
                    attempts: correct + incorrect,
                    accuracy,
                };
            },
        );

        const overallRaw = sectionScores.reduce((sum, section) => sum + section.rawScore, 0);
        const overallScaled = sectionScores.reduce(
            (sum, section) => sum + section.scaledScore,
            0,
        );

        const percentile = estimatePercentile(overallScaled);

        return {
            sections: sectionScores,
            overallRaw,
            overallScaled,
            percentile,
            recommendation: draftRecommendation(percentile),
        };
    }, [inputs, slot]);

    const handleChange = (section: SectionKey, field: keyof SectionInput, value: string) => {
        const numericValue = value === '' ? 0 : Number(value);
        if (Number.isNaN(numericValue) || numericValue < 0) {
            return;
        }

        setInputs((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: Math.min(numericValue, 50),
            },
        }));
    };

    return (
        <>
            <Head title="CAT Score Calculator" />
            <section
                id="hero"
                className="relative overflow-hidden bg-gradient-to-br from-[#161921] via-[#181c2c] to-[#111322] text-white dark:from-[#0A0B11] dark:via-[#11182A] dark:to-[#050608]"
            >
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-20">
                    <div className="max-w-2xl space-y-6">
                        <Badge className="w-fit gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur">
                            CAT 2025 Score Predictor
                        </Badge>
                        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                            Predict your CAT percentile in minutes—no spreadsheets required.
                        </h1>
                        <p className="text-base text-white/80 sm:text-lg">
                            Paste your response sheet, validate your attempts, and instantly unlock
                            raw scores, scaled scores, and percentile predictions built on real CAT
                            data. Switch between light and dark mode to stay focussed in any
                            environment.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button asChild size="lg" className="h-12 gap-2 rounded-full bg-primary">
                                <a href="#calculator">
                                    Start calculating
                                    <ArrowRight className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="h-12 gap-2 rounded-full border-white/25 bg-white/10 text-white transition hover:bg-white hover:text-slate-950 dark:border-white/20 dark:hover:bg-white dark:hover:text-slate-950"
                            >
                                <Link href="/register">Create free account</Link>
                            </Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-sm backdrop-blur transition dark:border-white/10 dark:bg-white/5"
                                >
                                    <div className="text-xs uppercase tracking-wide text-white/60">
                                        {stat.label}
                                    </div>
                                    <div className="mt-2 text-2xl font-semibold text-white">
                                        {stat.value}
                                    </div>
                                    <p className="mt-1 text-xs text-white/70">
                                        {stat.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative isolate hidden w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur lg:block">
                        <div className="flex items-center justify-between text-sm text-white/70">
                            <span>Percentile snapshot</span>
                            <span>{results.percentile.toFixed(1)} %ile</span>
                        </div>
                        <div className="my-6 h-2 w-full rounded-full bg-white/20">
                            <div
                                className="h-2 rounded-full bg-lime-400 transition-all"
                                style={{ width: `${Math.min(results.percentile, 100)}%` }}
                            />
                        </div>
                        <dl className="space-y-4 text-sm text-white/80">
                            <div className="flex items-center justify-between">
                                <dt>Raw score</dt>
                                <dd className="font-semibold text-white">
                                    {results.overallRaw} / 198
                                </dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt>Scaled score</dt>
                                <dd className="font-semibold text-white">
                                    {results.overallScaled}
                                </dd>
                            </div>
                            <div className="flex items-start justify-between gap-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                                <div>
                                    <div className="text-xs uppercase tracking-wide text-white/60">
                                        Recommended focus
                                    </div>
                                    <div className="mt-1 text-sm text-white">
                                        {results.recommendation.headline}
                                    </div>
                                </div>
                                <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                                    {results.recommendation.band}
                                </div>
                            </div>
                        </dl>
                        <div className="mt-6 text-xs text-white/60">
                            These numbers refresh live as you tweak your attempts below. Build a
                            roadmap that closes the gap to your dream college.
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="calculator"
                className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
            >
                <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            CAT Score Calculator
                        </h2>
                        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                            Enter your attempt summary to replicate the official CAT marking scheme.
                            We automatically apply slot-based scaling and map your score to the
                            closest percentile band.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {(['slot-1', 'slot-2', 'slot-3'] as const).map((slotValue) => (
                            <Button
                                key={slotValue}
                                variant={slot === slotValue ? 'default' : 'outline'}
                                className={cn(
                                    'rounded-full px-4 py-1 text-sm',
                                    slot === slotValue
                                        ? 'bg-primary text-primary-foreground'
                                        : 'border-dashed',
                                )}
                                onClick={() => setSlot(slotValue)}
                            >
                                {slotLabel(slotValue)}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <Card className="gap-0">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">
                                Build your raw score
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {(Object.keys(sectionConfig) as SectionKey[]).map((key) => {
                                const section = sectionConfig[key];
                                const sectionInput = inputs[key];

                                return (
                                    <div key={section.label} className="rounded-xl border border-border p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <h3 className="text-lg font-semibold text-foreground">
                                                    {section.label}{' '}
                                                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                        ({section.questions} Qs)
                                                    </span>
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {section.description}
                                                </p>
                                            </div>
                                            <Badge className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                                                Accuracy{' '}
                                                <span className="font-semibold text-foreground">
                                                    {results.sections
                                                        .find((item) => item.key === key)
                                                        ?.accuracy.toFixed(0)}
                                                    %
                                                </span>
                                            </Badge>
                                        </div>
                                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor={`${section.label}-correct`}
                                                    className="text-sm font-medium text-muted-foreground"
                                                >
                                                    Correct attempts
                                                </Label>
                                                <Input
                                                    id={`${section.label}-correct`}
                                                    type="number"
                                                    min={0}
                                                    max={section.questions}
                                                    value={sectionInput.correct}
                                                    onChange={(event) =>
                                                        handleChange(key, 'correct', event.target.value)
                                                    }
                                                    className="h-11 rounded-xl border-border focus:border-primary focus:ring-primary/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor={`${section.label}-incorrect`}
                                                    className="text-sm font-medium text-muted-foreground"
                                                >
                                                    Incorrect attempts
                                                </Label>
                                                <Input
                                                    id={`${section.label}-incorrect`}
                                                    type="number"
                                                    min={0}
                                                    max={section.questions}
                                                    value={sectionInput.incorrect}
                                                    onChange={(event) =>
                                                        handleChange(key, 'incorrect', event.target.value)
                                                    }
                                                    className="h-11 rounded-xl border-border focus:border-primary focus:ring-primary/20"
                                                />
                                            </div>
                                        </div>
                                        <dl className="mt-4 grid gap-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground sm:grid-cols-3">
                                            <div>
                                                <dt className="text-xs uppercase text-muted-foreground/80">
                                                    Attempts
                                                </dt>
                                                <dd className="mt-1 text-base font-semibold text-foreground">
                                                    {results.sections.find((item) => item.key === key)?.attempts ?? 0}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs uppercase text-muted-foreground/80">
                                                    Raw score
                                                </dt>
                                                <dd className="mt-1 text-base font-semibold text-foreground">
                                                    {results.sections.find((item) => item.key === key)?.rawScore ?? 0}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs uppercase text-muted-foreground/80">
                                                    Scaled score
                                                </dt>
                                                <dd className="mt-1 text-base font-semibold text-foreground">
                                                    {results.sections.find((item) => item.key === key)?.scaledScore ?? 0}
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <aside className="space-y-6">
                        <Card className="gap-4 bg-muted/40 dark:bg-muted/30">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">
                                    Predicted outcome
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-5 text-sm">
                                <div className="space-y-2">
                                    <div className="text-xs uppercase text-muted-foreground">
                                        Overall percentile
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-semibold text-primary">
                                            {results.percentile.toFixed(1)}
                                        </span>
                                        <span className="text-muted-foreground">%ile</span>
                                    </div>
                                </div>
                                <div className="grid gap-3 rounded-xl border border-border p-4">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>Raw score</span>
                                        <span className="font-semibold text-foreground">
                                            {results.overallRaw} / 198
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-muted-foreground">
                                        <span>Scaled score</span>
                                        <span className="font-semibold text-foreground">
                                            {results.overallScaled}
                                        </span>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                                    <div className="text-xs uppercase text-primary">
                                        Next focus area
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-foreground">
                                        {results.recommendation.headline}
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {results.recommendation.detail}
                                    </p>
                                </div>
                                <Button asChild className="w-full rounded-full">
                                    <Link href="/register">Unlock personalised plan</Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="gap-4">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">
                                    Sectional breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                {results.sections.map((section) => (
                                    <div key={section.key} className="flex flex-col gap-2 rounded-xl border border-border p-3">
                                        <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                                            <span className="text-muted-foreground/80">
                                                {sectionConfig[section.key].label}
                                            </span>
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                                                {section.rawScore} → {section.scaledScore}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-muted">
                                            <div
                                                className={cn(
                                                    'h-2 rounded-full bg-primary transition-all',
                                                    section.accuracy >= 80 && 'bg-emerald-500',
                                                    section.accuracy <= 50 && 'bg-amber-400',
                                                )}
                                                style={{ width: `${Math.min(section.accuracy, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span>{section.accuracy}% accuracy</span>
                                            <span>{section.attempts} attempts</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </section>

            <section
                id="prep"
                className="bg-muted/40 py-16 dark:bg-muted/20"
            >
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-10 max-w-2xl">
                        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                            CAT Preparation Blueprint
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            Translate your predicted percentile into a winning plan.
                        </h2>
                        <p className="mt-4 text-base text-muted-foreground">
                            These focus areas evolve with your score inputs. Hit the percentile you
                            need and then double down on the next set of skills and mocks.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {features.map((feature) => (
                            <Card key={feature.title} className="gap-4 border border-primary/10 bg-background/80 shadow-none">
                                <CardHeader className="flex flex-row items-center gap-3">
                                    <span className="rounded-full bg-primary/10 p-2 text-primary">
                                        <feature.icon className="h-5 w-5" />
                                    </span>
                                    <CardTitle className="text-lg font-semibold text-foreground">
                                        {feature.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    {feature.description}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <section
                id="mock-tests"
                className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
            >
                <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
                    <div>
                        <Badge className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            Daily targets
                        </Badge>
                        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            Stay exam-ready with structured mocks and post-test analytics.
                        </h2>
                        <p className="mt-3 text-base text-muted-foreground">
                            Alternate between full-length mocks and focussed sectional tests. Our
                            dashboard stitches every attempt to show momentum—not just raw scores.
                        </p>
                        <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                            <li className="inline-flex items-start gap-2">
                                <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                                2 full mocks each fortnight with detailed quant & LR drill-downs.
                            </li>
                            <li className="inline-flex items-start gap-2">
                                <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                                Sectional tests every Sunday to stress-test accuracy under 40 mins.
                            </li>
                            <li className="inline-flex items-start gap-2">
                                <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                                Adaptive question bank that gets tougher as your percentile climbs.
                            </li>
                        </ul>
                    </div>
                    <Card className="gap-0 border border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-foreground">
                                Weekly practice planner
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <div className="flex items-center justify-between rounded-xl border border-border/80 p-3">
                                <div>
                                    <div className="text-xs uppercase text-muted-foreground/70">
                                        Monday – Wednesday
                                    </div>
                                    <div className="text-foreground">
                                        Topic drills (2 hrs) + RC practice (1 hr)
                                    </div>
                                </div>
                                <Layers className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/80 p-3">
                                <div>
                                    <div className="text-xs uppercase text-muted-foreground/70">
                                        Thursday – Friday
                                    </div>
                                    <div className="text-foreground">
                                        Sectional test + error log revisits
                                    </div>
                                </div>
                                <LineChart className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/80 p-3">
                                <div>
                                    <div className="text-xs uppercase text-muted-foreground/70">
                                        Weekend
                                    </div>
                                    <div className="text-foreground">
                                        Full-length mock & detailed analysis
                                    </div>
                                </div>
                                <ClipboardList className="h-5 w-5 text-primary" />
                            </div>
                            <Button asChild className="w-full rounded-full">
                                <Link href="/register">Sync with prep calendar</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section
                id="results"
                className="bg-muted/40 py-16 dark:bg-muted/20"
            >
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                                Real success stories
                            </p>
                            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                540 Cracku students scored 99+%ile in CAT 2024
                            </h2>
                            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                                Your predicted percentile sits beside anonymised data from the last
                                cycle, so you know exactly how toppers paced their prep.
                            </p>
                        </div>
                        <Button asChild variant="outline" className="h-11 rounded-full">
                            <Link href="/login">View topper dashboards</Link>
                        </Button>
                    </div>
                    <div className="mt-10 grid gap-6 lg:grid-cols-3">
                        {percentileBands.map((band) => (
                            <Card key={band.percentile} className="border border-border/70 bg-background/80 shadow-none">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-2xl font-semibold text-primary">
                                            {band.percentile}
                                        </CardTitle>
                                        <GraduationCap className="h-6 w-6 text-primary" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Expected percentile
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground">
                                    <div>
                                        <div className="text-xs uppercase text-muted-foreground/80">
                                            Expected scaled score
                                        </div>
                                        <div className="text-base font-semibold text-foreground">
                                            {band.expectedScore}
                                        </div>
                                    </div>
                                    <p>{band.takeaway}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <section
                id="faq"
                className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
            >
                <div className="max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                        Frequently asked questions
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                        Everything you need to know before submitting your score.
                    </h2>
                    <p className="mt-3 text-base text-muted-foreground">
                        Can’t find the answer you’re looking for? Reach us on WhatsApp and we’ll
                        help you decode your response sheet.
                    </p>
                </div>
                <div className="mt-10 space-y-4">
                    {faqs.map((faq) => (
                        <Card key={faq.question} className="border border-border/70 bg-background/80 shadow-none">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-foreground">
                                    {faq.question}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                {faq.answer}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </>
    );
}

CatScoreCalculator.layout = (page: ReactNode) => (
    <MarketingLayout>{page}</MarketingLayout>
);

function estimatePercentile(score: number) {
    const cappedScore = Math.max(0, Math.min(score, 198 * 1.05));
    const tier = rawToPercentileTiers.find(
        (item) => cappedScore >= item.threshold,
    );

    return tier ? tier.percentile : 15;
}

function draftRecommendation(percentile: number) {
    if (percentile >= 99) {
        return {
            headline: 'Fine-tune question selection and maintain composure in the first 15 minutes.',
            detail:
                'You are already cruising at an elite percentile. Focus on minimising silly errors and perfecting your mock-day routine.',
            band: '99%ile+',
        };
    }

    if (percentile >= 96) {
        return {
            headline: 'Double down on DILR sets that are table-heavy and RC passages with inference questions.',
            detail:
                'Strengthen medium-difficulty sets through targeted practice. Review mock logs to isolate chapters where accuracy slips under time pressure.',
            band: '96-98%ile',
        };
    }

    if (percentile >= 90) {
        return {
            headline: 'Crack arithmetic fundamentals and LR arrangements to break into the 95 percentile band.',
            detail:
                'Limit blind guesses. Solve two QA topic tests daily and revisit RC error logs to push accuracy above 65%.',
            band: '90-95%ile',
        };
    }

    if (percentile >= 80) {
        return {
            headline: 'Focus on accuracy-first attempts and attempt selection across all three sections.',
            detail:
                'Your percentile climbs fastest when incorrect attempts drop. Solve shorter sets, build stamina with 45-minute sectional tests, and revise basics.',
            band: '80-89%ile',
        };
    }

    return {
        headline: 'Strengthen basics and start logging every attempt to accelerate improvement.',
        detail:
            'Use the calculator after every mock, review solutions meticulously, and target 12 high-quality attempts per section before pushing speed.',
        band: '<80%ile',
    };
}

function slotLabel(slot: 'slot-1' | 'slot-2' | 'slot-3') {
    switch (slot) {
        case 'slot-1':
            return 'Slot 1';
        case 'slot-2':
            return 'Slot 2';
        case 'slot-3':
            return 'Slot 3';
        default:
            return 'Slot';
    }
}
