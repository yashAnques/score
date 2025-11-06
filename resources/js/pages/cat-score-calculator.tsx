import defaultContent from '@/content/cat-score-calculator.json';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import MarketingLayout from '@/layouts/marketing-layout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    BarChart3,
    Bot,
    CheckCircle2,
    Cpu,
    ListChecks,
    Loader2,
    RefreshCcw,
    Sparkles,
    Target,
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

type WhatsappInvite = {
    type?: string | null;
    label?: string | null;
    cta_text?: string | null;
    description?: string | null;
    url?: string | null;
    min_percentile?: number | null;
    max_percentile?: number | null;
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
    whatsapp_link?: WhatsappInvite | null;
};

type CatPageContent = {
    meta: {
        title: string;
        description: string;
    };
    hero: {
        title: string;
        description: string;
        highlights: Array<{ icon: string; title: string; description: string }>;
        input_placeholder: string;
        button_labels: {
            default: string;
            login_required: string;
            loading: string;
        };
        unauthenticated_notice: string;
        unauthenticated_link_label: string;
        unauthenticated_link_url: string;
    };
    empty_state: {
        title: string;
        description: string;
    };
    how_it_works: {
        badge: string;
        heading: string;
        steps: Array<{ title: string; description: string }>;
    };
    guide: {
        badge: string;
        heading: string;
        intro: string;
        sections: Array<{
            title: string;
            description: string;
            bullets?: string[];
        }>;
        how_to_use: {
            title: string;
            description: string;
            steps: string[];
        };
        highlight_card: {
            title: string;
            paragraphs: string[];
        };
    };
    insights: {
        score_vs_percentile: {
            title: string;
            paragraphs: string[];
            table: { headers: string[]; rows: string[][] };
            footer: string;
        };
        slot_difficulty: {
            title: string;
            table: { headers: string[]; rows: string[][] };
            paragraphs: string[];
        };
        predictor: {
            title: string;
            paragraphs: string[];
            ordered_list_title: string;
            ordered_list: string[];
            footer_paragraphs: Array<{ text: string; variant?: 'heading' | 'default' }>;
            unordered_list: string[];
        };
        response_sheet: {
            title: string;
            paragraphs: string[];
            list: string[];
            footer: string;
        };
    };
};

type PageProps = {
    latestCalculation: CalculationPayload | null;
    pageContent?: Partial<CatPageContent> | null;
};

const DEFAULT_CONTENT = defaultContent as CatPageContent;

const HERO_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
    sparkles: Sparkles,
    cpu: Cpu,
    bot: Bot,
};

const mergeContent = (
    base: CatPageContent,
    override?: Partial<CatPageContent> | null,
): CatPageContent => {
    if (!override) {
        return base;
    }

    const clone = JSON.parse(JSON.stringify(base)) as CatPageContent;

    const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>) => {
        Object.entries(source).forEach(([key, value]) => {
            if (value === undefined) {
                return;
            }

            if (Array.isArray(value)) {
                target[key] = value;

                return;
            }

            if (value !== null && typeof value === 'object') {
                const current = (target[key] ?? {}) as Record<string, unknown>;

                target[key] = deepMerge(current, value as Record<string, unknown>);

                return;
            }

            target[key] = value;
        });

        return target;
    };

    return deepMerge(clone as unknown as Record<string, unknown>, override as Record<string, unknown>) as CatPageContent;
};

export default function CatScoreCalculator({
    latestCalculation,
    pageContent,
}: PageProps) {
    const {
        props: { auth },
    } = usePage<SharedData>();
    const content = useMemo(
        () => mergeContent(DEFAULT_CONTENT, pageContent ?? undefined),
        [pageContent],
    );
    const [responseLink, setResponseLink] = useState(
        latestCalculation?.response_link ?? '',
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [calculation, setCalculation] = useState<CalculationPayload | null>(
        latestCalculation,
    );
    const resultSectionRef = useRef<HTMLDivElement | null>(null);
    const responseInputRef = useRef<HTMLInputElement | null>(null);

    const isLoggedIn = Boolean(auth.user);

    const focusResponseInput = () => {
        const input = responseInputRef.current;
        if (!input) {
            return;
        }

        window.scrollTo({
            top: Math.max(0, input.getBoundingClientRect().top + window.scrollY - 1400),
            behavior: 'smooth',
        });

        window.setTimeout(() => {
            input.focus({ preventScroll: true });
            input.select();
        }, 250);
    };

    const handleRecalculate = () => {
        setResponseLink('');
        focusResponseInput();
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!isLoggedIn) {
            if (typeof window !== 'undefined') {
                window.location.assign('https://bschoolbuzz.in/login?redirect_to=' + encodeURIComponent(window.location.href));
            }
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
            <Head title={content.meta.title}>
                <meta name="description" content={content.meta.description} />
            </Head>
            <section className="relative overflow-hidden bg-[#080B1A] py-16 text-white dark:bg-[#05060D] lg:py-20">
                <div className="absolute inset-0" />
                <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-sky-500/25 blur-[120px] md:h-80 md:w-80" />
                <div className="absolute bottom-[-6rem] right-[-6rem] h-80 w-80 rounded-full bg-emerald-400/25 blur-[140px]" />
                <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                    <div className="space-y-8 text-center text-left">
                        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                            {content.hero.title}
                        </h1>
                        <p className="text-sm text-white/80 sm:text-base lg:text-lg">
                            {content.hero.description}
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {(content.hero.highlights ?? []).map(({ icon, title, description }) => {
                                const Icon = HERO_ICON_MAP[icon] ?? Sparkles;

                                return (
                                    <div
                                        key={title}
                                        className="group relative flex items-start gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-[0_0_25px_rgba(15,118,110,0.15)] transition hover:border-white/30 hover:bg-white/15"
                                    >
                                        <div className="rounded-xl bg-yellow-400/15 p-2 text-yellow-200 dark:bg-yellow-400/80">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                {title}
                                            </p>
                                            <p className="text-xs text-white/70">{description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-[0_20px_60px_rgba(12,17,35,0.45)] backdrop-blur-sm sm:flex-row sm:items-center sm:gap-4"
                        >
                            <Input
                                ref={responseInputRef}
                                value={responseLink}
                                onChange={(event) =>
                                    setResponseLink(event.target.value ?? '')
                                }
                                placeholder={content.hero.input_placeholder}
                                className="h-12 p-3 w-full flex-1 rounded-xl border-white/20 bg-white/90 text-slate-900 placeholder:text-slate-500 focus-visible:ring-yellow-400/30"
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                className="h-12 w-full min-w-[9rem] rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-400/10 via-yellow-400/20 to-yellow-300/10 px-6 text-yellow-100 transition hover:text-white cursor-pointer sm:w-auto hover:bg-transparent hover:from-yellow-400/20 hover:to-yellow-300/20"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {content.hero.button_labels.loading}
                                    </>
                                ) : !isLoggedIn ? (
                                    content.hero.button_labels.login_required
                                ) : (
                                    content.hero.button_labels.default
                                )}
                            </Button>
                        </form>
                        {error && (
                            <p className="text-sm font-medium text-amber-200">
                                {error}
                            </p>
                        )}
                        {!isLoggedIn && (
                            <p className="text-sm text-white/70">
                                {content.hero.unauthenticated_notice}{' '}
                                <a
                                    href={content.hero.unauthenticated_link_url}
                                    className="font-semibold text-yellow-200 hover:text-yellow-100"
                                >
                                    {content.hero.unauthenticated_link_label}
                                </a>
                            </p>
                        )}
                    </div>
                </div>
            </section>

            <section
                ref={resultSectionRef}
                className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
            >
                {calculation ? (
                    <Scorecard calculation={calculation} headline={headline} onRecalculate={handleRecalculate} />
                ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                            {content.empty_state.title}
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground">
                            {content.empty_state.description}
                        </p>
                    </div>
                )}
            </section>

            <section className="bg-muted/40 py-16 dark:bg-muted/20">
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                            {content.how_it_works.badge}
                        </p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            {content.how_it_works.heading}
                        </h2>
                    </div>
                    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                        {(content.how_it_works.steps ?? []).map((step, index) => (
                            <Card
                                key={step.title}
                                className="border border-primary/10 bg-background/80 shadow-none"
                            >
                                <CardHeader className="space-y-2">
                                    <Badge className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary bg-yellow-400 dark:bg-yellow-400/80 text-xs font-medium">
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
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 mt-8">
                    <div className="max-w-3xl space-y-4">
                        <Badge className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                            {content.guide.badge}
                        </Badge>
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                            {content.guide.heading}
                        </h2>
                        <p className="text-sm text-muted-foreground sm:text-base">
                            {content.guide.intro}
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {(content.guide.sections ?? []).map((section) => (
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

                    <div className="my-8 flex flex-col gap-8 xl:grid xl:grid-cols-[2fr,1fr]">
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    {content.guide.how_to_use.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <p>{content.guide.how_to_use.description}</p>
                                <ol className="list-decimal space-y-2 pl-5">
                                    {(content.guide.how_to_use.steps ?? []).map((step) => (
                                        <li key={step}>{step}</li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>
                        <Card className="border border-primary/20 bg-primary/5 shadow-none dark:border-primary/40 dark:bg-primary/10">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    {content.guide.highlight_card.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-foreground">
                                {(content.guide.highlight_card.paragraphs ?? []).map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    {content.insights.score_vs_percentile.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                {(content.insights.score_vs_percentile.paragraphs ?? []).map(
                                    (paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                    ),
                                )}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 text-left text-sm dark:divide-slate-800 dark:border-slate-800">
                                        <thead className="bg-yellow-400 text-primary dark:bg-yellow-400/80">
                                            <tr className="text-xs uppercase tracking-wide">
                                                {content.insights.score_vs_percentile.table.headers.map(
                                                    (header) => (
                                                        <th
                                                            key={header}
                                                            className="px-4 py-3 font-semibold"
                                                        >
                                                            {header}
                                                        </th>
                                                    ),
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                            {(content.insights.score_vs_percentile.table.rows ?? []).map((row, rowIndex) => (
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
                                    {content.insights.score_vs_percentile.footer}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    {content.insights.slot_difficulty.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 text-left text-sm dark:divide-slate-800 dark:border-slate-800">
                                        <thead className="bg-yellow-400 text-primary text-foreground dark:bg-yellow-400/80">
                                            <tr className="text-xs uppercase tracking-wide">
                                                {content.insights.slot_difficulty.table.headers.map(
                                                    (header, index) => (
                                                        <th
                                                            key={`${header}-${index}`}
                                                            className="px-4 py-3 font-semibold"
                                                        >
                                                            {header}
                                                        </th>
                                                    ),
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                            {(content.insights.slot_difficulty.table.rows ?? []).map((row, rowIndex) => (
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
                                {(content.insights.slot_difficulty.paragraphs ?? []).map((paragraph, index) => (
                                    <p key={index}>{paragraph}</p>
                                ))}
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    {content.insights.predictor.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                {(content.insights.predictor.paragraphs ?? []).map(
                                    (paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                    ),
                                )}
                                <div>
                                    <p className="font-medium text-foreground">
                                        {content.insights.predictor.ordered_list_title}
                                    </p>
                                    <ol className="mt-2 list-decimal space-y-2 pl-5">
                                        {(content.insights.predictor.ordered_list ?? []).map(
                                            (item, index) => (
                                                <li key={index}>{item}</li>
                                            ),
                                        )}
                                    </ol>
                                </div>
                                {(content.insights.predictor.footer_paragraphs ?? []).map(
                                    ({ text, variant }, index) => (
                                        <p
                                            key={index}
                                            className={
                                                variant === 'heading'
                                                    ? 'font-medium text-foreground'
                                                    : undefined
                                            }
                                        >
                                            {text}
                                        </p>
                                    ),
                                )}
                                <ul className="list-disc space-y-2 pl-5">
                                    {(content.insights.predictor.unordered_list ?? []).map(
                                        (item, index) => (
                                            <li key={index}>{item}</li>
                                        ),
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 shadow-none dark:border-slate-800 lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    {content.insights.response_sheet.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground">
                                {(content.insights.response_sheet.paragraphs ?? []).map(
                                    (paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                    ),
                                )}
                                <ul className="list-disc space-y-2 pl-5">
                                    {(content.insights.response_sheet.list ?? []).map(
                                        (item, index) => (
                                            <li key={index}>{item}</li>
                                        ),
                                    )}
                                </ul>
                                <p>{content.insights.response_sheet.footer}</p>
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
    onRecalculate: () => void;
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


function Scorecard({ calculation, headline, onRecalculate }: ScorecardProps) {
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
    const whatsappInvite = calculation.whatsapp_link ?? null;

    const formatPercentileValue = (value: number) =>
        Number.isInteger(value) ? value.toString() : value.toFixed(1);

    const formattedRange = (() => {
        if (!whatsappInvite) {
            return null;
        }

        const minRaw = whatsappInvite.min_percentile ?? null;
        const maxRaw = whatsappInvite.max_percentile ?? null;
        const min = minRaw !== null ? formatPercentileValue(minRaw) : null;
        const max = maxRaw !== null ? formatPercentileValue(maxRaw) : null;

        if (min !== null && max !== null && maxRaw !== null && minRaw !== null && Math.abs(maxRaw - minRaw) > 0.01) {
            return `${min}%tile - ${max}%tile`;
        }

        if (min !== null) {
            return `${min}%tile`;
        }

        return null;
    })();

    const whatsappCtaText = (() => {
        if (!whatsappInvite?.url) {
            return null;
        }

        if (whatsappInvite.cta_text && whatsappInvite.cta_text.trim().length > 0) {
            return whatsappInvite.cta_text;
        }

        if (whatsappInvite.type) {
            const typeLabel = whatsappInvite.type.toUpperCase();
            if (formattedRange) {
                return `Join ${typeLabel} ${formattedRange} Group`;
            }

            return `Join ${typeLabel} WhatsApp Group`;
        }

        return 'Join WhatsApp Group';
    })();

    const whatsappLabel = (() => {
        if (!whatsappInvite?.url) {
            return null;
        }

        if (whatsappInvite.label && whatsappInvite.label.trim().length > 0) {
            return whatsappInvite.label;
        }

        if (formattedRange) {
            return `Percentile-matched community for ${formattedRange} aspirants.`;
        }

        return 'Join peers preparing with the same momentum.';
    })();

    return (
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <CardHeader className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-3">
                        {headline && (
                            <CardTitle className="text-2xl font-semibold text-foreground">
                                {headline} 🎉
                            </CardTitle>
                        )}
                    </div>
                    <div className='flex gap-4'>
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-fit rounded-full cursor-pointer"
                            onClick={onRecalculate}
                        >
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Recalculate
                        </Button>

                        {whatsappInvite?.url && whatsappCtaText && (
                            <Button
                                asChild
                                size="sm"
                                className="inline-flex items-center gap-2 rounded-full border bg-transparent text-primary transition hover:bg-transparent hover:scale-105 hover:rotate-1"
                            >
                                <a href={whatsappInvite.url} target="_blank" rel="noopener noreferrer">
                                    <svg width="20" height="20" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>Whatsapp-color</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Icons" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd"> <g id="Color-" transform="translate(-700.000000, -360.000000)" fill="#67C15E"> <path d="M723.993033,360 C710.762252,360 700,370.765287 700,383.999801 C700,389.248451 701.692661,394.116025 704.570026,398.066947 L701.579605,406.983798 L710.804449,404.035539 C714.598605,406.546975 719.126434,408 724.006967,408 C737.237748,408 748,397.234315 748,384.000199 C748,370.765685 737.237748,360.000398 724.006967,360.000398 L723.993033,360.000398 L723.993033,360 Z M717.29285,372.190836 C716.827488,371.07628 716.474784,371.034071 715.769774,371.005401 C715.529728,370.991464 715.262214,370.977527 714.96564,370.977527 C714.04845,370.977527 713.089462,371.245514 712.511043,371.838033 C711.806033,372.557577 710.056843,374.23638 710.056843,377.679202 C710.056843,381.122023 712.567571,384.451756 712.905944,384.917648 C713.258648,385.382743 717.800808,392.55031 724.853297,395.471492 C730.368379,397.757149 732.00491,397.545307 733.260074,397.27732 C735.093658,396.882308 737.393002,395.527239 737.971421,393.891043 C738.54984,392.25405 738.54984,390.857171 738.380255,390.560912 C738.211068,390.264652 737.745308,390.095816 737.040298,389.742615 C736.335288,389.389811 732.90737,387.696673 732.25849,387.470894 C731.623543,387.231179 731.017259,387.315995 730.537963,387.99333 C729.860819,388.938653 729.198006,389.89831 728.661785,390.476494 C728.238619,390.928051 727.547144,390.984595 726.969123,390.744481 C726.193254,390.420348 724.021298,389.657798 721.340985,387.273388 C719.267356,385.42535 717.856938,383.125756 717.448104,382.434484 C717.038871,381.729275 717.405907,381.319529 717.729948,380.938852 C718.082653,380.501232 718.421026,380.191036 718.77373,379.781688 C719.126434,379.372738 719.323884,379.160897 719.549599,378.681068 C719.789645,378.215575 719.62006,377.735746 719.450874,377.382942 C719.281687,377.030139 717.871269,373.587317 717.29285,372.190836 Z" id="Whatsapp"> </path> </g> </g> </g></svg>
                                    {whatsappCtaText}
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="grid w-full grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 dark:border-slate-800 dark:bg-slate-900/50">
                        <DetailItem
                            label="Candidate Name"
                            value={calculation.candidate_name ?? '—'}
                        />
                        <DetailItem
                            label="Slot"
                            value={slotLabel ?? '—'}
                        />
                        <DetailItem
                            label="Test time"
                            value={testTime ?? '—'}
                        />
                        <DetailItem
                            label="Test center"
                            value={testCentre ?? '—'}
                        />
                        <DetailItem
                            label="Response Link"
                            value={calculation.response_link ?? '—'}
                            isLink
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                        <thead className="bg-yellow-400 text-primary dark:bg-yellow-400/80">
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
                <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {label}
                </p>
                <p className="text-xl font-semibold text-foreground sm:text-2xl">{value}</p>
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
                            ? 'bg-yellow-400 dark:bg-yellow-400/80'
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
