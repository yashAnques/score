import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import MarketingLayout from '@/layouts/marketing-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    ListChecks,
    Loader2,
    ShieldCheck,
    Target,
    Trophy,
    XCircle,
} from 'lucide-react';
import {
    type FormEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { SharedData } from '@/types';

type SectionMarks = {
    name: string;
    total_questions?: number | null;
    attempt_questions?: number | null;
    unattempt_questions?: number | null;
    correct_answers?: number | null;
    wrong_answers?: number | null;
    obtain_marks?: number | string | null;
    total_marks?: number | string | null;
};

type CalculationSummary = {
    obtain_marks?: number | string | null;
    total_marks?: number | string | null;
    unattempted_questions?: number | null;
    unattempted_negative_marks?: number | string | null;
    percentile?: number | string | null;
};

type CalculationPayload = {
    id: number;
    xat_id?: string;
    candidate_name?: string;
    test_center?: string;
    response_link?: string;
    total_score?: number;
    result_image_url?: string;
    details?: Record<string, string> | null;
    sections_marks?: SectionMarks[];
    summary?: CalculationSummary;
    percentile_text?: string | null;
};

type PageProps = {
    latestCalculation: CalculationPayload | null;
};

const steps = [
    {
        title: 'Grab your XAT response sheet',
        description:
            'Download the HTML response sheet from the official XAT portal and paste the secure link below.',
    },
    {
        title: 'Sign in & submit',
        description:
            'Only logged-in aspirants can process a sheet. We send it instantly to our scoring engine when you click submit.',
    },
    {
        title: 'Get section-wise marks instantly',
        description:
            'See accuracy, raw score, and calibrated percentiles across VALR, DM, and QA&DI in seconds.',
    },
];

const assurances = [
    {
        icon: ShieldCheck,
        title: 'Official marking logic',
        description:
            'We follow the latest XAT answer key, including partial penalties for unattempted questions beyond the threshold.',
    },
    {
        icon: CheckCircle2,
        title: 'Section-aware parsing',
        description:
            'VALR, DM, and QA&DI responses are normalised before computing accuracy so you can trust every metric.',
    },
    {
        icon: Trophy,
        title: 'Auto-saved attempts',
        description:
            'Every calculation stays attached to your account so you can revisit performance reports anytime.',
    },
];

export default function XatScoreCalculator({ latestCalculation }: PageProps) {
    const {
        props: { auth },
    } = usePage<SharedData>();
    const [responseLink, setResponseLink] = useState(
        latestCalculation?.response_link ?? '',
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [calculation, setCalculation] = useState<CalculationPayload | null>(
        latestCalculation,
    );
    const resultSectionRef = useRef<HTMLDivElement | null>(null);

    const isLoggedIn = Boolean(auth.user);
    const isVerified = Boolean(auth.user?.email_verified_at);
    const showVerificationWarning = isLoggedIn && !isVerified;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isLoggedIn) {
            router.visit('/login');
            return;
        }

        if (!isVerified) {
            setError('Please verify your email address before submitting your response sheet.');
            router.visit('/verify-email');
            return;
        }

        if (!responseLink.trim()) {
            setError('Please paste your response sheet link before submitting.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const csrfToken = document
                .querySelector("meta[name='csrf-token']")
                ?.getAttribute('content');

            const response = await fetch('/xat-score-calculator/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({
                    link: responseLink.trim(),
                }),
            });

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(
                    body.message ??
                    'We could not compute the score right now. Please try again in a bit.',
                );
            }

            const body = (await response.json()) as {
                calculation: CalculationPayload;
                message?: string;
            };

            setCalculation(body.calculation);
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Something went wrong while calculating your score.',
            );
        } finally {
            setLoading(false);
        }
    };

    const headline = useMemo(() => {
        if (typeof calculation?.total_score !== 'number') {
            return null;
        }

        return `Congratulations! You scored ${calculation.total_score.toFixed(
            2,
        )} marks in XAT ${new Date().getFullYear()}.`;
    }, [calculation?.total_score]);

    useEffect(() => {
        if (calculation && resultSectionRef.current) {
            const el = resultSectionRef.current;
            const y =
                el.getBoundingClientRect().top + window.pageYOffset - 110;

            window.scrollTo({
                top: Math.max(0, y),
                behavior: 'smooth',
            });
        }
    }, [calculation]);

    return (
        <>
            <Head title="XAT Score Calculator 2025 | Accurate Sectional Marks & Percentile Predictor">
                <meta
                    name="description"
                    content="Upload your XAT response sheet to unlock instant sectional analysis, penalty-aware scoring, and percentile projections. Review your performance history and prepare smarter for B-school shortlists."
                />
            </Head>
            <section className="bg-[#101C3E] py-8 text-white dark:bg-[#0A1024] lg:py-20">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                    <div className="max-w-2xl space-y-6">
                        <Badge className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                            XAT Score Calculator 2025
                        </Badge>
                        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                            Upload your official XAT response sheet and unlock your exact sectional
                            performance.
                        </h1>
                        <p className="text-base text-white/80 sm:text-lg">
                            No spreadsheets. No guesswork. Paste your link and we will benchmark you
                            against the latest XAT scoring pattern, including the penalty for
                            excessive unattempted questions.
                        </p>
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-3 rounded-2xl bg-white/10 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:gap-4"
                        >
                            <Input
                                value={responseLink}
                                onChange={(event) =>
                                    setResponseLink(event.target.value ?? '')
                                }
                                placeholder="https://cdn3.digialm.com/.../XAT25066291_..."
                                className="h-12 flex-1 rounded-xl border-white/20 bg-white/90 text-[#0B142E] placeholder:text-[#4C5A89] p-3"
                            />
                            <Button
                                type="submit"
                                className="h-12 rounded-xl px-6"
                                disabled={loading || !isLoggedIn || !isVerified}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Calculating…
                                    </>
                                ) : !isLoggedIn ? (
                                    'Sign in to submit'
                                ) : !isVerified ? (
                                    'Verify your email'
                                ) : (
                                    'Submit'
                                )}
                            </Button>
                        </form>
                        {error && (
                            <p className="text-sm font-medium text-red-200">
                                {error}
                            </p>
                        )}
                        {showVerificationWarning && (
                            <p className="text-sm text-amber-100">
                                Please verify your email address before submitting response sheets.{' '}
                                <Link
                                    href="/verify-email"
                                    className="font-semibold underline-offset-4 hover:underline"
                                >
                                    Resend verification email
                                </Link>
                                .
                            </p>
                        )}
                        {!isLoggedIn && (
                            <p className="text-sm text-white/75">
                                You need an account to process response sheets.{' '}
                                <Link
                                    href="/register"
                                    className="font-semibold text-sky-300 hover:text-sky-200"
                                >
                                    Create one for free.
                                </Link>
                            </p>
                        )}
                    </div>
                    <div className="hidden w-full max-w-md lg:block">
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/80">
                                “The DM section analysis was spot-on. Helped me plan retakes in a
                                day.”
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/80">
                                “Penalty for unattempted questions was calculated exactly like the
                                official answer key.”
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/80">
                                “Loved the saved history — I can compare mocks whenever I want.”
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section
                ref={resultSectionRef}
                className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
            >
                {calculation ? (
                    <Scorecard calculation={calculation} headline={headline} />
                ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                            Paste your XAT response sheet to see your personalised scorecard.
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Once you submit the link above, we will parse the official key, apply
                            XAT&apos;s scoring rules, and store the report for you here.
                        </p>
                    </div>
                )}
            </section>


            <section className="bg-muted/40 py-8 dark:bg-muted/20">
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                            How it works
                       </p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            Three simple steps to get your verified XAT score.
                        </h2>
                    </div>
                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        {steps.map((step, index) => (
                            <Card
                                key={step.title}
                                className="border border-primary/10 bg-background/80 shadow-none"
                            >
                                <CardHeader className="space-y-2">
                                    <Badge className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                        Step {index + 1}
                                    </Badge>
                                    <CardTitle className="text-lg font-semibold text-foreground">
                                        {step.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    {step.description}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-background">
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl space-y-4">
                        <Badge className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                            Why aspirants use us
                        </Badge>
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            Stress-free XAT score calculation for serious aspirants.
                        </h2>
                        <p className="text-sm text-muted-foreground sm:text-base">
                            We stay updated with the official exam pattern so you can focus on
                            analysis, not arithmetic. Every report highlights accuracy, negative
                            marking, and percentile guidance.
                        </p>
                    </div>

                    <div className="mt-10 grid gap-6 lg:grid-cols-3">
                        {assurances.map((assurance) => (
                            <Card
                                key={assurance.title}
                                className="h-full border border-slate-200 shadow-none dark:border-slate-800"
                            >
                                <CardHeader className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <assurance.icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-lg font-semibold text-foreground">
                                        {assurance.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    {assurance.description}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-background py-8">
                <div className="mx-auto w-full max-w-6xl space-y-10 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            Top Colleges Accepting XAT 2024 Score
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            The following institutes have considered XAT 2024 scores for their 2024-26 admission cycle. Use this snapshot of fees and placement statistics to gauge where your score could take you.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 text-left text-sm dark:divide-slate-800 dark:border-slate-800">
                                <thead className="bg-slate-900 text-white">
                                    <tr className="text-xs uppercase tracking-wide">
                                        <th className="px-4 py-3 font-semibold">Colleges</th>
                                        <th className="px-4 py-3 font-semibold">Fees</th>
                                        <th className="px-4 py-3 font-semibold">Avg CTC</th>
                                        <th className="px-4 py-3 font-semibold">Highest CTC</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    {[
                                        ['Xavier Labour Research Institute, Jamshedpur', '24.8 Lakhs', '32.7 LPA', '78.2 LPA'],
                                        ['Xavier Labour Research Institute, Delhi', '23.6 Lakhs', '32.7 LPA', '78.2 LPA'],
                                        ['Xavier Institute of Management, Bhubaneshwar', '20.91 Lakhs', '20.03 LPA', '71.50 LPA'],
                                        ['Institute of Management Technology, Ghaziabad', '19.53 Lakhs', '17.35 LPA', '65.6 LPA'],
                                        ['International Management Institute, New Delhi', '20.19 Lakhs', '17.01 LPA', '50 LPA'],
                                        ['Mudra Institute of Communications, Ahmedabad', '21 Lakhs', '20.09 LPA', '36 LPA'],
                                        ['Institute of Rural Management Anand, Gujarat', '16.09 Lakhs', '15.50 LPA', '26.50 LPA'],
                                        ['Goa Institute of Management, Goa', '18.31 Lakhs', '14.87 LPA', '55 LPA'],
                                        ['T.A.Pai Management Institute, Manipal', '16.5 Lakhs', '15.3 LPA', '22.7 LPA'],
                                        ['Fore School of Management, New Delhi', '16.9 Lakhs', '14.5 LPA', '30 LPA'],
                                        ['Great Lakes Institute of Management, Chennai', '19.95 Lakhs', '18.1 LPA', '34 LPA'],
                                        ['Graduate School of Business, Sri City', '14.56 Lakhs', '13.50 LPA', '22.9 LPA'],
                                    ].map((row, rowIndex) => (
                                        <tr key={`xat-colleges-${rowIndex}`} className="border-t border-slate-200 dark:border-slate-800">
                                            {row.map((cell, cellIndex) => (
                                                <td
                                                    key={`xat-colleges-${rowIndex}-${cellIndex}`}
                                                    className="px-4 py-3"
                                                >
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
            <section className="bg-muted/40 py-8 dark:bg-muted/20">
                <div className="mx-auto w-full max-w-6xl space-y-10 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            XAT 2025 Toppers List Analysis
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Based on the response sheets collected for XAT 2024, we analysed score trends to understand difficulty levels across slots. In total, we reviewed <span className="font-semibold text-foreground">53,863</span> responses. The statistics below summarise the mean, median, and maximum scores across all slots—useful indicators of slot difficulty.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            We&lsquo;ve also plotted score-versus-percentile curves for all slots. In those graphs, a slot that lies below another indicates a comparatively easier paper: a lower raw score in that slot yields a higher percentile relative to tougher slots.
                        </p>
                        <div className='py-3'>
                            <h3 className="text-xl font-semibold text-foreground mb-2">VALR Analysis</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 text-left text-sm dark:divide-slate-800 dark:border-slate-800">
                                    <thead className="bg-slate-900 text-white">
                                        <tr className="text-xs uppercase tracking-wide">
                                            <th className="px-4 py-3 font-semibold"> </th>
                                            <th className="px-4 py-3 font-semibold">Overall</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                        {[
                                            ['Mean', '5.39'],
                                            ['Median', '5.01'],
                                            ['Max Score', '21.22'],
                                            ['Total Responses', '53,863'],
                                        ].map((row, index) => (
                                            <tr key={`xat-topper-${index}`} className="border-t border-slate-200 dark:border-slate-800">
                                                {row.map((cell, cellIndex) => (
                                                    <td
                                                        key={`xat-topper-${index}-${cellIndex}`}
                                                        className={`px-4 py-3 ${cellIndex === 0 ? 'font-semibold text-foreground' : ''}`}
                                                    >
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className='py-3'>
                            <h3 className="text-xl font-semibold text-foreground mb-2">QADI Analysis</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 text-left text-sm dark:divide-slate-800 dark:border-slate-800">
                                    <thead className="bg-slate-900 text-white">
                                        <tr className="text-xs uppercase tracking-wide">
                                            <th className="px-4 py-3 font-semibold"> </th>
                                            <th className="px-4 py-3 font-semibold">Overall</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                        {[
                                            ['Mean', '4.96'],
                                            ['Median', '4.5'],
                                            ['Max Score', '25.5'],
                                            ['Total Responses', '53,863'],
                                        ].map((row, index) => (
                                            <tr key={`xat-topper-${index}`} className="border-t border-slate-200 dark:border-slate-800">
                                                {row.map((cell, cellIndex) => (
                                                    <td
                                                        key={`xat-topper-${index}-${cellIndex}`}
                                                        className={`px-4 py-3 ${cellIndex === 0 ? 'font-semibold text-foreground' : ''}`}
                                                    >
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                        <div className='py-3'>
                            <h3 className="text-xl font-semibold text-foreground mb-2">DM Analysis</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 text-left text-sm dark:divide-slate-800 dark:border-slate-800">
                                    <thead className="bg-slate-900 text-white">
                                        <tr className="text-xs uppercase tracking-wide">
                                            <th className="px-4 py-3 font-semibold"> </th>
                                            <th className="px-4 py-3 font-semibold">Overall</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                        {[
                                            ['Mean', '6.86'],
                                            ['Median', '6.91'],
                                            ['Max Score', '19.44'],
                                            ['Total Responses', '53,863'],
                                        ].map((row, index) => (
                                            <tr key={`xat-topper-${index}`} className="border-t border-slate-200 dark:border-slate-800">
                                                {row.map((cell, cellIndex) => (
                                                    <td
                                                        key={`xat-topper-${index}-${cellIndex}`}
                                                        className={`px-4 py-3 ${cellIndex === 0 ? 'font-semibold text-foreground' : ''}`}
                                                    >
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-background py-8">
                <div className="mx-auto w-full max-w-6xl space-y-10 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            XAT 2025 Exam Pattern
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            The pattern for XAT 2025 mirrors XAT 2024 in both structure and difficulty. Candidates faced 175 minutes for the main test plus an additional 10 minutes for the General Knowledge section.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 text-left text-sm dark:divide-slate-800 dark:border-slate-800">
                                <thead className="bg-slate-900 text-white">
                                    <tr className="text-xs uppercase tracking-wide">
                                        <th className="px-4 py-3 font-semibold">Sections</th>
                                        <th className="px-4 py-3 font-semibold">Number of Questions</th>
                                        <th className="px-4 py-3 font-semibold">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    {[
                                        ['Verbal Ability & Logical Reasoning (VALR)', '26', ''],
                                        ['Decision Making (DM)', '21', '175 Minutes'],
                                        ['Quantitative Aptitude & Data Interpretation (QADI)', '28', ''],
                                        ['General Knowledge', '20', '10 Minutes'],
                                    ].map((row, rowIndex) => (
                                        <tr key={`xat-pattern-${rowIndex}`} className="border-t border-slate-200 dark:border-slate-800">
                                            {row.map((cell, cellIndex) => (
                                                <td
                                                    key={`xat-pattern-${rowIndex}-${cellIndex}`}
                                                    className="px-4 py-3"
                                                >
                                                    {cell || '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                            XAT Score vs Percentile Comparison (2024-2022)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 text-left text-sm dark:divide-slate-800 dark:border-slate-800">
                                <thead className="bg-slate-900 text-white">
                                    <tr className="text-xs uppercase tracking-wide">
                                        <th className="px-4 py-3 font-semibold">Percentile</th>
                                        <th className="px-4 py-3 font-semibold">Scaled Score 2024</th>
                                        <th className="px-4 py-3 font-semibold">Scaled Score 2023</th>
                                        <th className="px-4 py-3 font-semibold">Score 2022</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    {[
                                        ['99', '33.5', '45+', '40+'],
                                        ['98', '32', '43+', '39+'],
                                        ['97', '29.10', '41+', '37+'],
                                        ['95', '26', '39+', '34+'],
                                        ['90', '23', '35+', '30+'],
                                        ['80', '18.20', '30+', '23+'],
                                    ].map((row, rowIndex) => (
                                        <tr key={`xat-comparison-${rowIndex}`} className="border-t border-slate-200 dark:border-slate-800">
                                            {row.map((cell, cellIndex) => (
                                                <td
                                                    key={`xat-comparison-${rowIndex}-${cellIndex}`}
                                                    className="px-4 py-3"
                                                >
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-muted/40 py-8 dark:bg-muted/20">
                <div className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            XAT 2024 Analysis
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            XAT 2024 was similar in difficulty to XAT 2023, with moderate paper difficulty overall. Sectional variation, however, continues to play a major role in percentile outcomes.
                        </p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 text-left text-sm dark:divide-slate-800 dark:border-slate-800">
                                <thead className="bg-slate-900 text-white">
                                    <tr className="text-xs uppercase tracking-wide">
                                        <th className="px-4 py-3 font-semibold">Section</th>
                                        <th className="px-4 py-3 font-semibold">Number of Questions</th>
                                        <th className="px-4 py-3 font-semibold">Level of Difficulty</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                    {[
                                        ['Verbal Ability and Logical Reasoning (VALR)', '26', 'Moderate - Difficult'],
                                        ['Decision Making (DM)', '21', 'Moderate - Difficult'],
                                        ['Quantitative Aptitude & Data Interpretation (QADI)', '28', 'Moderate'],
                                        ['General Knowledge (GK)', '25', 'Easy - Moderate'],
                                        ['Overall', '100', 'Moderate'],
                                    ].map((row, rowIndex) => (
                                        <tr key={`xat-analysis-${rowIndex}`} className="border-t border-slate-200 dark:border-slate-800">
                                            {row.map((cell, cellIndex) => (
                                                <td
                                                    key={`xat-analysis-${rowIndex}-${cellIndex}`}
                                                    className="px-4 py-3"
                                                >
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-foreground">Essay Topics</h3>
                        <p className="text-sm text-muted-foreground">
                            Candidates encountered the following essay prompts in XAT 2024:
                        </p>
                        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                            <li>Tech predictions are no longer accurate and need to acknowledge the uncertainty in the future.</li>
                            <li>Stringent regulations for social media is the only way to mitigate or prevent the spread of fake news.</li>
                            <li>Things that are least important shouldn&apos;t affect things that are most important.</li>
                        </ul>
                    </div>
                </div>
            </section>

        </>
    );
}

type ScorecardProps = {
    calculation: CalculationPayload;
    headline: string | null;
};

function Scorecard({ calculation, headline }: ScorecardProps) {
    const summary = calculation.summary ?? {};
    const sectionsMarks = calculation.sections_marks ?? [];
    const details = (calculation.details ?? {}) as Record<string, string>;
    const totalScore = coerceNumber(summary.obtain_marks ?? calculation.total_score);
    const totalMarks = coerceNumber(summary.total_marks);
    const unattemptedPenalty = coerceNumber(summary.unattempted_negative_marks);
    const penaltyDisplay = unattemptedPenalty ? -Math.abs(unattemptedPenalty) : 0;
    const unattemptedQuestionsDisplay = formatValue(summary.unattempted_questions ?? '—');
    const percentileRange = calculation.percentile_text ?? '—';
    const sectionChartData = sectionsMarks.map((section) => ({
        name: section.name ?? 'Section',
        score: coerceNumber(section.obtain_marks),
        correct: coerceNumber(section.correct_answers),
        incorrect: coerceNumber(section.wrong_answers),
        unattempted: coerceNumber(section.unattempt_questions),
        percentile: null,
    }));

    return (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <CardHeader className="space-y-2">
                {headline && (
                    <CardTitle className="text-2xl font-semibold text-foreground">
                        {headline} 🎉
                    </CardTitle>
                )}
                <p className="text-sm text-muted-foreground">
                    Keep this report handy for your GDPI prep — every calculation is saved securely
                    in your account.
                </p>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <DetailItem
                                    label="Candidate Name"
                                    value={calculation.candidate_name ?? details['Candidate Name'] ?? '—'}
                                />
                                <DetailItem
                                    label="XAT ID"
                                    value={calculation.xat_id ?? details['XAT ID'] ?? '—'}
                                />
                                <DetailItem
                                    label="Test Centre"
                                    value={
                                        calculation.test_center ??
                                        details['Test Centre'] ??
                                        details['TC Name'] ??
                                        '—'
                                    }
                                />
                                <DetailItem
                                    label="Response Link"
                                    value={calculation.response_link ?? details['Response Link'] ?? '—'}
                                    isLink
                                />
                            </div>
                            {calculation.result_image_url && (
                                <Button asChild variant="outline" size="sm" className="mt-4">
                                    <a
                                        href={calculation.result_image_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Download official scorecard
                                    </a>
                                </Button>
                            )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <SummaryTile
                                icon={Target}
                                label="Total Score"
                                value={formatValue(totalScore)}
                                helper="After applying the unattempted penalty."
                            />
                            <SummaryTile
                                icon={CheckCircle2}
                                label="Maximum Marks"
                                value={formatValue(totalMarks)}
                                helper="Sum of sectional marks considered in the final score."
                            />
                            <SummaryTile
                                icon={ListChecks}
                                label="Unattempted Questions"
                                value={`${unattemptedQuestionsDisplay}`}
                                helper={`Penalty applied: ${formatValue(penaltyDisplay)} pts`}
                            />
                            <SummaryTile
                                icon={XCircle}
                                label="Negative Marks"
                                value={formatValue(penaltyDisplay)}
                                helper="Derived from unanswered questions beyond allowance."
                            />
                        </div>
                    </div>
                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-5 text-sm dark:border-slate-800 dark:bg-slate-900/60">
                        <h3 className="text-base font-semibold text-foreground">Percentile outlook</h3>
                        <p className="text-sm text-muted-foreground">
                            The percentile range helps you gauge shortlisting chances. We track live
                            conversions to keep this benchmark relevant.
                        </p>
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center text-primary dark:border-primary/40 dark:bg-primary/10">
                            <p className="text-sm uppercase tracking-wide">Overall Percentile</p>
                            <p className="mt-2 text-3xl font-semibold text-primary">
                                {percentileRange}
                            </p>
                        </div>
                    </div>
                </div>

                <SectionPerformanceChart sections={sectionChartData} />
            </CardContent>
        </Card>
    );
}

type DetailItemProps = {
    label: string;
    value: string;
    isLink?: boolean;
};

function DetailItem({ label, value, isLink = false }: DetailItemProps) {
    if (value === '—') {
        return (
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </p>
                <p className="text-sm text-muted-foreground">—</p>
            </div>
        );
    }

    if (isLink) {
        return (
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </p>
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
                >
                    View response sheet
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p className="text-sm font-semibold text-foreground">{value}</p>
        </div>
    );
}

type SummaryTileProps = {
    icon: typeof Target;
    label: string;
    value: string;
    helper?: string;
};

function SummaryTile({ icon: Icon, label, value, helper }: SummaryTileProps) {
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary min-w-[40px]">
                <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </p>
                <p className="text-xl font-semibold text-foreground">{value}</p>
                {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
            </div>
        </div>
    );
}

type SectionChartEntry = {
    name: string;
    score: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    percentile: number | string | null;
};

type SectionChartProps = {
    sections: SectionChartEntry[];
};

function SectionPerformanceChart({ sections }: SectionChartProps) {
    if (sections.length === 0) {
        return null;
    }

    const maxMagnitude = sections.reduce(
        (max, section) => Math.max(max, Math.abs(section.score)),
        0,
    );
    const safeMax = maxMagnitude > 0 ? maxMagnitude : 1;

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Section performance</h3>
                    <p className="text-xs text-muted-foreground">
                        Scores scaled relative to your best-performing section.
                    </p>
                </div>
                <AlertCircle className="h-5 w-5 text-primary/70" />
            </div>
            <div className="mt-4 space-y-4">
                {sections.map((section) => {
                    const width = `${Math.min(
                        100,
                        (Math.abs(section.score) / safeMax) * 100,
                    ).toFixed(1)}%`;
                    const barColor =
                        section.score >= 0
                            ? 'bg-primary'
                            : 'bg-rose-500';

                    return (
                        <div key={section.name} className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <span>{section.name}</span>
                                <span>{formatValue(section.score)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                                <div
                                    className={`h-2 rounded-full transition-all ${barColor}`}
                                    style={{ width }}
                                />
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    {formatValue(section.correct)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                    {formatValue(section.incorrect)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                    {formatValue(section.unattempted)}
                                </span>
                                {section.percentile && (
                                    <span className="flex items-center gap-1 text-primary">
                                        <Target className="h-3.5 w-3.5" />
                                        {formatValue(section.percentile)}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function formatValue(value?: number | string | null) {
    if (value === undefined || value === null) {
        return '—';
    }

    if (typeof value === 'string') {
        const normalised = value.trim().replace(/\u2212/g, '-');
        const parsed = Number.parseFloat(normalised);

        if (!Number.isNaN(parsed)) {
            return formatNumber(parsed);
        }

        return normalised || '—';
    }

    return formatNumber(value);
}

function formatNumber(value: number) {
    if (!Number.isFinite(value)) {
        return '—';
    }

    if (Object.is(value, -0)) {
        return '-0';
    }

    if (Number.isInteger(value)) {
        return value.toString();
    }

    return value.toFixed(2);
}

function coerceNumber(value?: number | string | null): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const normalised = value.trim().replace(/\u2212/g, '-');
        const parsed = Number.parseFloat(normalised);

        return Number.isNaN(parsed) ? 0 : parsed;
    }

    return 0;
}

XatScoreCalculator.layout = (page: ReactNode) => (
    <MarketingLayout>{page}</MarketingLayout>
);
