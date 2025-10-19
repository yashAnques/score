import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import MarketingLayout from '@/layouts/marketing-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    BarChart3,
    CheckCircle2,
    ListChecks,
    Loader2,
    ShieldCheck,
    Target,
    Trophy,
    XCircle,
} from 'lucide-react';
import {
    type ComponentType,
    type FormEvent,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { SharedData } from '@/types';

type CalculationSection = {
    name: string;
    correct?: number | null;
    incorrect?: number | null;
    sa_incorrect?: number | null;
    unattempted?: number | null;
    score?: number | null;
    percentile?: number | string | null;
};

type CalculationOverall = {
    total_correct?: number | null;
    total_incorrect?: number | null;
    total_sa_incorrect?: number | null;
    total_unattempted?: number | null;
    total_score?: number | null;
    total_percentile?: number | string | null;
    percentile?: number | string | null;
};

type CalculationPayload = {
    id: number;
    candidate_name?: string;
    slot?: number;
    test_center?: string;
    response_link?: string;
    total_score?: number;
    total_percentile?: number;
    overall_percentile?: number;
    result_image_url?: string;
    details?: Record<string, string> | null;
    percentile_text?: string | null;
    sections: CalculationSection[];
    overall: CalculationOverall;
};

type PageProps = {
    latestCalculation: CalculationPayload | null;
};

const steps = [
    {
        title: 'Paste your CAT response sheet link',
        description:
            'Download the HTML response sheet from the official CAT portal and paste the link in the box above.',
    },
    {
        title: 'Sign in & submit',
        description:
            'Only logged-in users can process a sheet. We send it securely to our scoring engine the moment you click submit.',
    },
    {
        title: 'Get section-wise marks instantly',
        description:
            'See correct vs incorrect counts, sectional scores, and the combined total in a clean scorecard.',
    },
];

const assurances = [
    {
        icon: ShieldCheck,
        title: 'Official marking scheme',
        description:
            'We follow the current CAT pattern ( +3 / -1 / 0 ) and handle type-in-the-answer questions accurately.',
    },
    {
        icon: CheckCircle2,
        title: 'Slot-aware parsing',
        description:
            'Response sheets from every slot are normalised before we compute the totals to avoid mismatches.',
    },
    {
        icon: Trophy,
        title: 'Auto-saved history',
        description:
            'Every calculation is stored on your account so you can revisit and download the scorecard anytime.',
    },
];

const guideSections = [
    {
        title: 'What is CAT Score Calculator?',
        description:
            "CAT score calculator is a simple tool that helps you estimate raw scores and predict percentiles long before the official results arrive. It evaluates your performance across VARC, DILR, and QA, then estimates your overall score and chances of receiving calls from leading IIMs by analysing historical trends.",
    },
    {
        title: 'How does CAT Score Calculator work?',
        description:
            "CAT score calculator applies the official scoring pattern and benchmarks your performance against past exams to forecast a realistic percentile so you can plan early.",
        bullets: [
            'Correct answers earn +3 marks each.',
            'Incorrect answers for MCQs incur a -1 penalty.',
            'Unattempted questions do not affect your score.',
            'TITA questions never receive negative marking.',
        ],
    },
    {
        title: 'How to Use CAT Score Calculator 2025',
        description:
            "Follow these steps to capture accurate results, convert them into a percentile prediction, and prepare for post-exam processes confidently.",
        bullets: [
            'Access the calculator for CAT 2025.',
            'Copy the response sheet URL from the official IIM portal and paste it into the calculator.',
            'Review the estimated raw score generated from your responses.',
            'Use the percentile predictor to convert that score into an expected percentile.',
            'Compare your percentile with recent cut-offs for IIMs and other B-schools.',
            'Begin interview and GD preparation—or plan backup options—based on your projected percentile.',
        ],
    },
];

const usageSteps = [
    'Open your CAT response sheet on the official portal and copy the URL.',
    'Paste the link into CAT score calculator.',
    'Submit the sheet to generate your section-wise raw score instantly.',
    'Review the predicted percentile to understand where you stand for IIM shortlists.',
    'Plan interview prep, alternative colleges, or a retake strategy based on the forecast.',
];

export default function CatScoreCalculator({ latestCalculation }: PageProps) {
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

            const response = await fetch('/cat-score-calculator/calculate', {
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
            1,
        )} marks in CAT ${new Date().getFullYear()}.`;
    }, [calculation?.total_score]);

    useEffect(() => {
        if (calculation && resultSectionRef.current) {
            const el = resultSectionRef.current;
            const y =
                el.getBoundingClientRect().top + window.pageYOffset - 70;

            window.scrollTo({
                top: Math.max(0, y),
                behavior: 'smooth',
            });
        }
    }, [calculation]);


    return (
        <>
            <Head title="CAT Score Calculator 2025 | Instant Sectional Scores & Percentile Insights">
                <meta
                    name="description"
                    content="Paste your official CAT response sheet to get precise VARC, DILR, and QA scores in seconds. Understand your predicted percentile, track past attempts, and plan interview prep with confidence."
                />
            </Head>
            <section className="bg-[#131C35] py-16 text-white dark:bg-[#090E1D] lg:py-20">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                    <div className="max-w-2xl space-y-6">
                        <Badge className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                             CAT Score Calculator 2025
                        </Badge>
                        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                            Upload your official CAT response sheet and let  reveal your exact sectional
                            score in seconds.
                        </h1>
                        <p className="text-base text-white/80 sm:text-lg">
                            No estimations. No manual counting. Paste the HTML response link and let our trusted engine compute your VARC, DILR, QA, and overall marks using the official CAT marking scheme.
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
                                placeholder="https://cdn.digialm.com/per/g06/.../response.html"
                                className="h-12 flex-1 rounded-xl border-white/20 bg-white/90 text-[#131C35] placeholder:text-[#4B567E]"
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
                        {!isLoggedIn && (
                            <p className="text-sm text-white/70">
                                You need an account to process response sheets.{' '}
                                <Link
                                    href="/register"
                                    className="font-semibold text-sky-300 hover:text-sky-200"
                                >
                                    Create one for free.
                                </Link>
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
                    </div>
                    <div className="hidden w-full max-w-md lg:block">
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/80">
                                “Score got scaled down but actual percentile remained what we
                                predicted initially. So can&apos;t really say.”
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/80">
                                “I pasted my sheet and had the full breakdown in under a minute.
                                Super useful to double-check before challenging the key.”
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/80">
                                “Shows section-wise accuracy instantly. Helped me decide which mocks
                                to revisit.”
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section
                ref={resultSectionRef}
                className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
            >
                {calculation ? (
                    <Scorecard calculation={calculation} headline={headline} />
                ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                            Paste your response sheet to see section-wise marks.
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Once you submit the link above, we will parse the official CAT answer
                            key and store a complete report for you here.
                        </p>
                    </div>
                )}
            </section>



            <section className="bg-muted/40 py-16 dark:bg-muted/20">
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                            How it works
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            Three simple steps to get your verified CAT scores.
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
                            CAT 2025 Guide
                        </Badge>
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            CAT 2025 score calculator walkthrough
                        </h2>
                        <p className="text-sm text-muted-foreground sm:text-base">
                            Understand how  interprets your response sheet, predicts your percentile,
                            and helps you plan the journey from raw scores to IIM calls.
                        </p>
                    </div>

                    <div className="mt-10 grid gap-6 lg:grid-cols-3">
                        {guideSections.map((section) => (
                            <Card key={section.title} className="h-full border border-slate-200 shadow-none dark:border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-foreground">
                                        {section.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground">
                                    <p>{section.description}</p>
                                    {section.bullets && (
                                        <ul className="space-y-2 pl-4 text-sm text-muted-foreground">
                                            {section.bullets.map((bullet) => (
                                                <li key={bullet} className="list-disc">
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-12 grid gap-8 lg:grid-cols-[2fr,1fr]">
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    How to use our calculator
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p>
                                    Follow these steps to make sure the predicted score mirrors your official CAT evaluation.
                                </p>
                                <ol className="list-decimal space-y-2 pl-5">
                                    {usageSteps.map((step) => (
                                        <li key={step}>{step}</li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>
                        <Card className="border border-primary/20 bg-primary/5 shadow-none dark:border-primary/40 dark:bg-primary/10">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    CAT 2025 Score Calculator From Response Sheet
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-foreground">
                                <p>
                                    Our CAT Score Calculator 2025 helps you predict your score and anticipate your percentile before the official results arrive. With real-time insights, you can gauge your standing among other candidates and understand your likelihood of receiving interview calls from top IIMs.
                                </p>
                                <p>
                                    This guide walks you through reviewing your CAT 2025 response sheet, using the calculator effectively, and interpreting your predicted percentile so you can plan your IIM applications with confidence.
                                </p>
                                <p>
                                    Together with the percentile predictor, it remains one of the most effective ways to stay ahead of the official results and act on your MBA goals without losing time.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    CAT Score vs Percentile 2024
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p>
                                    One of the most common questions CAT aspirants ask is how their CAT raw score translates into a percentile. While your score reflects the number of questions answered correctly, your percentile measures how you performed relative to other candidates.
                                </p>
                                <p>
                                    Using historical data, our percentile predictor can give you a reasonable estimate of your percentile based on your raw score. Here&apos;s a quick reference for CAT Score vs Percentile 2024.
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 text-left text-sm dark:divide-slate-800 dark:border-slate-800">
                                        <thead className="bg-slate-900 text-white">
                                            <tr className="text-xs uppercase tracking-wide">
                                                <th className="px-4 py-3 font-semibold">%ile</th>
                                                <th className="px-4 py-3 font-semibold">Overall</th>
                                                <th className="px-4 py-3 font-semibold">VARC</th>
                                                <th className="px-4 py-3 font-semibold">LRDI</th>
                                                <th className="px-4 py-3 font-semibold">Quant</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                            {[
                                                ['99.95%', '129.67', '53.95', '52.51', '48.15'],
                                                ['99.90%', '123.86', '51.20', '50.32', '45.27'],
                                                ['99.50%', '105.00', '44.50', '41.38', '36.87'],
                                                ['99.00%', '96.35', '40.58', '37.60', '33.11'],
                                                ['98.00%', '86.91', '36.42', '33.98', '28.83'],
                                                ['97.00%', '81.51', '34.00', '31.28', '26.69'],
                                                ['95.00%', '73.46', '30.18', '28.06', '23.48'],
                                                ['90.00%', '60.70', '24.55', '23.08', '18.07'],
                                                ['85.00%', '52.63', '20.80', '19.81', '14.92'],
                                                ['80.00%', '46.57', '17.95', '17.46', '12.43'],
                                                ['75.00%', '41.61', '15.62', '15.45', '10.64'],
                                                ['70.00%', '38.11', '14.15', '14.28', '9.57'],
                                                ['65.00%', '35.09', '13.00', '13.22', '8.50'],
                                                ['60.00%', '32.51', '11.45', '12.16', '7.42'],
                                                ['55.00%', '30.24', '10.42', '11.10', '6.79'],
                                                ['50.00%', '28.27', '9.85', '10.07', '5.88'],
                                                ['40.00%', '22.94', '7.50', '8.05', '4.22'],
                                                ['30.00%', '18.65', '5.60', '6.86', '3.03'],
                                                ['20.00%', '14.79', '3.70', '5.02', '1.84'],
                                            ].map((row, rowIndex) => (
                                                <tr key={rowIndex} className="border-t border-slate-200 dark:border-slate-800">
                                                    {row.map((cell, cellIndex) => (
                                                        <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    These figures are based on trends from previous years, and while they offer a reliable estimation, the actual percentile for 2025 might vary with the exam&apos;s difficulty and the overall performance of candidates. Our CAT Score Calculator 2025 blends sophisticated algorithms with historical data to deliver an accurate percentile prediction so you can stay one step ahead.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    CAT 2024 Slotwise Difficulty Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 text-left text-sm dark:divide-slate-800 dark:border-slate-800">
                                        <thead className="bg-slate-100 text-foreground dark:bg-slate-900/60">
                                            <tr className="text-xs uppercase tracking-wide">
                                                <th className="px-4 py-3 font-semibold"></th>
                                                <th className="px-4 py-3 font-semibold">Slot-1</th>
                                                <th className="px-4 py-3 font-semibold">Slot-2</th>
                                                <th className="px-4 py-3 font-semibold">Slot-3</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                            {[
                                                ['VARC', 'Moderate', 'Moderate', 'Moderate - Difficult'],
                                                ['DILR', 'Easy - Moderate', 'Moderate', 'Moderate'],
                                                ['QA', 'Moderate', 'Moderate', 'Moderate'],
                                            ].map((row, rowIndex) => (
                                                <tr key={`slotwise-${rowIndex}`} className="border-t border-slate-200 dark:border-slate-800">
                                                    {row.map((cell, cellIndex) => (
                                                        <td
                                                            key={`slotwise-${rowIndex}-${cellIndex}`}
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
                                <p>
                                    VARC (Verbal Ability and Reading Comprehension) remained consistent across slots with four reading comprehension passages and eight verbal ability questions. The “Odd One Out” format returned, and the difficulty level was comparable to CAT 2022.
                                </p>
                                <p>
                                    DILR (Data Interpretation and Logical Reasoning) offered manageable sets in each slot, including two approachable sets. Slot 3’s QA (Quantitative Ability), however, was considered the toughest—longer passages, trickier questions, and more complex calculations made it noticeably time-consuming. Overall, Slot 3 demanded the highest effort.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    How Does Our CAT Percentile Predictor Work?
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p>
                                    Our CAT percentile predictor uses advanced data models to estimate your percentile based on the raw scores you provide. By analysing thousands of past test-takers, we deliver a dependable forecast of your percentile so you can anticipate interview opportunities with confidence.
                                </p>
                                <div>
                                    <p className="font-medium text-foreground">Here&apos;s how the predictor works:</p>
                                    <ol className="mt-2 list-decimal space-y-2 pl-5">
                                        <li>Input section-wise scores: Enter your VARC, DILR, and QA raw scores.</li>
                                        <li>Weightage across sections: Every section contributes equally to your final percentile, so a balanced performance matters.</li>
                                        <li>Historical comparison: Your score is benchmarked against previous exam data to estimate your relative standing.</li>
                                        <li>Estimated percentile: Once processed, you receive an accurate percentile projection to plan your next steps.</li>
                                    </ol>
                                </div>
                                <p>
                                    With this insight, you&apos;ll quickly understand your standing and can prepare for the next phase of the admissions process.
                                </p>
                                <p className="font-medium text-foreground">
                                    CAT Score Prediction: Estimating Your Final Percentile
                                </p>
                                <p>
                                    While the score calculator captures your raw performance, your final percentile depends on several factors:
                                </p>
                                <ul className="list-disc space-y-2 pl-5">
                                    <li>
                                        Overall performance of all candidates: If the CAT exam in 2025 is tougher, even a lower raw score can translate into a high percentile.
                                    </li>
                                    <li>
                                        Sectional cutoffs: Each section has its own difficulty level and cutoff expectations, affecting your sectional percentile.
                                    </li>
                                    <li>
                                        Score normalization: Scores are normalized across different exam slots so everyone competes on an even footing.
                                    </li>
                                </ul>
                                <p>
                                    Combining the percentile predictor with the score calculator helps you create a realistic view of your final results—whether you&apos;re polishing interviews, planning a retake, or exploring alternative programmes.
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    CAT Response Sheet 2025
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p>
                                    Your CAT response sheet 2025 combines your marked answers with the official key released by IIMs—usually within two to three days of the exam. Reviewing it helps you spot strengths, understand mistakes, and calculate an accurate raw score before results day.
                                </p>
                                <p>
                                    To make the most of our calculator:
                                </p>
                                <ul className="list-disc space-y-2 pl-5">
                                    <li>Cross-check each response against the official answer key.</li>
                                    <li>Count correct and incorrect attempts for every section.</li>
                                    <li>Feed those details into the score calculator for an instant estimate.</li>
                                </ul>
                                <p>
                                    Analysing your response sheet with these steps gives you a clear picture of your performance—whether you&apos;re gearing up for interviews, planning another attempt, or mapping out alternative programmes.
                                </p>
                            </CardContent>
                        </Card>
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
    const scoreSummary = calculation.overall;
    const details = calculation.details ?? null;
    const derivedSlot =
        details && typeof details['Shift'] === 'string'
            ? Number.parseInt(details['Shift'], 10)
            : undefined;
    const slotLabel =
        typeof calculation.slot === 'number'
            ? calculation.slot
            : typeof derivedSlot === 'number' && !Number.isNaN(derivedSlot)
                ? derivedSlot
                : undefined;
    const testTime =
        details?.['Test Time'] ??
        details?.['Test Slot'] ??
        details?.['Exam Slot'] ??
        null;
    const testCentre =
        calculation.test_center ??
        details?.['Test Centre Name'] ??
        details?.['Test Centre'] ??
        details?.['Test Center'] ??
        null;
    const totalScore = coerceNumber(scoreSummary.total_score);
    const totalPercentile = scoreSummary.percentile ?? scoreSummary.total_percentile ?? '—';
    const totalCorrect = coerceNumber(scoreSummary.total_correct);
    const totalIncorrect = coerceNumber(scoreSummary.total_incorrect);
    const totalUnattempted = coerceNumber(scoreSummary.total_unattempted);
    const sectionChartData = calculation.sections.map((section) => ({
        name: section.name,
        score: coerceNumber(section.score),
        correct: coerceNumber(section.correct),
        incorrect: coerceNumber(section.incorrect),
        unattempted: coerceNumber(section.unattempted),
        percentile: section.percentile ?? null,
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
                    {calculation.candidate_name ? (
                        <>
                            How did we help you on this journey?{' '}
                            <Link
                                href="https://wa.me/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-primary hover:text-primary/80"
                            >
                                Share your story!
                            </Link>{' '}
                            <br />
                            <br />
                            Name: <p className='text-xl font-semibold text-foreground '>{calculation.candidate_name}</p>
                            <br />
                            {slotLabel &&
                                <b>
                                    Slot : {slotLabel}
                                </b>
                            }
                            {testTime && `${testTime}`}
                            {testCentre && `${testCentre}`}
                        </>
                    ) : (
                        'We store each attempt securely so you can revisit or download it anytime.'
                    )}
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryTile
                        icon={Target}
                        label="Total Score"
                        value={formatValue(totalScore)}
                        helper="Across all sections"
                    />
                    <SummaryTile
                        icon={BarChart3}
                        label="Overall Percentile"
                        value={typeof totalPercentile === 'string' ? totalPercentile : formatValue(totalPercentile)}
                        helper="Based on slot normalisation"
                    />
                    <SummaryTile
                        icon={ListChecks}
                        label="Correct Attempts"
                        value={formatValue(totalCorrect)}
                        helper="Includes MCQ & TITA"
                    />
                    <SummaryTile
                        icon={XCircle}
                        label="Incorrect · Unattempted"
                        value={`${formatValue(totalIncorrect)} · ${formatValue(totalUnattempted)}`}
                        helper="Incorrect · Skipped"
                    />
                </div>

                <SectionPerformanceChart sections={sectionChartData} />

                <div className="overflow-x-auto">
                    <table className="min-w-full overflow-hidden rounded-2xl border border-slate-200 text-sm dark:border-slate-800">
                        <thead className="bg-[#112143] text-white dark:bg-[#162A52]">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Section</th>
                                <th className="px-4 py-3 text-left font-semibold">Correct</th>
                                <th className="px-4 py-3 text-left font-semibold">Incorrect</th>
                                <th className="px-4 py-3 text-left font-semibold">Score</th>
                                <th className="px-4 py-3 text-left font-semibold">Percentile</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            {calculation.sections.map((section) => (
                                <tr key={section.name} className="border-t border-slate-200 dark:border-slate-800">
                                    <td className="px-4 py-3 font-semibold">{section.name}</td>
                                    <td className="px-4 py-3">{formatValue(section.correct)}</td>
                                    <td className="px-4 py-3">{formatValue(section.incorrect)}</td>
                                    <td className="px-4 py-3">{formatValue(section.score)}</td>
                                    <td className="px-4 py-3">{formatValue(section.percentile)}</td>
                                </tr>
                            ))}
                            <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold dark:border-slate-700 dark:bg-slate-900/70">
                                <td className="px-4 py-3">Overall</td>
                                <td className="px-4 py-3">{formatValue(scoreSummary.total_correct)}</td>
                                <td className="px-4 py-3">{formatValue(scoreSummary.total_incorrect)}</td>
                                <td className="px-4 py-3">{formatValue(scoreSummary.total_score)}</td>
                                <td className="px-4 py-3">{formatValue(scoreSummary.percentile)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col gap-3 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
                    <span>
                        Overall percentile: {formatValue(scoreSummary.percentile)} · Total score:{' '}
                        {formatValue(scoreSummary.total_score)}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

type SummaryTileProps = {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
    helper?: string;
};

function SummaryTile({ icon: Icon, label, value, helper }: SummaryTileProps) {
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary min-w-[40px">
                <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </p>
                <p className="text-2xl font-semibold text-foreground">{value}</p>
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

CatScoreCalculator.layout = (page: ReactNode) => (
    <MarketingLayout>{page}</MarketingLayout>
);
