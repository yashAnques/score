import { useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowDownCircle, Crown, Download, Lock, Sparkles } from 'lucide-react';
import MarketingLayout from '@/layouts/marketing-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';
import type { SharedData } from '@/types';

type PdfCourse = {
    id: number;
    name: string;
    slug: string;
};

type PdfResource = {
    id: number;
    title: string;
    slug: string;
    label: string;
    fileUrl: string;
    downloadCount: number;
    course: PdfCourse | null;
    isPaid: boolean;
    isUnlocked: boolean;
    courseUrl: string;
};

type PdfPageProps = {
    pdfs: PdfResource[];
};

const gradientPalette = [
    'from-[#0f172a] via-[#132042] to-[#172554]',
    'from-[#172554] via-[#1d3a75] to-[#2563eb]',
    'from-[#172554] via-[#0f766e] to-[#14b8a6]',
    'from-[#0f172a] via-[#4f46e5] to-[#7c3aed]',
];

export default function PdfPage({ pdfs }: PdfPageProps) {
    const {
        props: { auth },
    } = usePage<SharedData>();

    const isAuthenticated = Boolean(auth?.user);

    const preparedPdfs = useMemo(() => pdfs ?? [], [pdfs]);

    return (
        <MarketingLayout>
            <Head title="PDF Library" />
            <section className="flex flex-col gap-16 pb-20">
                <div className="relative isolate overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#172554] py-16 text-white">
                    <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2)_0%,_rgba(255,255,255,0)_60%)]" />
                    </div>
                    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-center">
                        <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 shadow-sm">
                            <Sparkles className="h-3 w-3 text-amber-400" />
                            Premium PDF Library
                        </span>
                        <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                            Download playbooks, cheat-sheets, and interview packs
                        </h1>
                        <p className="mx-auto max-w-3xl text-base leading-relaxed text-white/80 sm:text-lg">
                            Access curated PDFs crafted by our mentors. Unlock premium packs by enrolling in their
                            respective programs or grab useful free guides instantly.
                        </p>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-6xl px-4">
                    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                        {preparedPdfs.map((pdf, index) => {
                            const gradientClass = gradientPalette[index % gradientPalette.length];

                            return (
                                <Card
                                    key={pdf.id}
                                    className={clsx(
                                        'group flex h-full flex-col overflow-hidden border border-primary/10 bg-background/60 shadow-lg shadow-primary/10 ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/30 !py-0 !gap-0',
                                    )}
                                >
                                    <div
                                        className={clsx(
                                            'relative flex items-center justify-center bg-gradient-to-br px-6 py-16 text-center text-white min-h-[240px]',
                                            gradientClass,
                                        )}
                                    >
                                        <div className="absolute inset-0 opacity-30 mix-blend-overlay">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.2)_0%,_rgba(255,255,255,0)_70%)]" />
                                        </div>
                                        <div className="relative z-10 flex flex-col items-center gap-4">
                                            <span
                                                className={clsx(
                                                    'inline-flex items-center gap-2 rounded-full border border-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
                                                    pdf.isPaid ? 'bg-white/20 text-white' : 'bg-emerald-400/20 text-white',
                                                )}
                                            >
                                                {pdf.isPaid ? (
                                                    <Crown className="h-3.5 w-3.5 text-amber-300" />
                                                ) : (
                                                    <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                                                )}
                                                {pdf.label.toUpperCase()}
                                            </span>
                                            <CardTitle className="text-2xl font-semibold text-white">
                                                {pdf.title}
                                            </CardTitle>
                                        </div>
                                    </div>

                                    <CardContent className="flex flex-1 flex-col justify-between gap-6 py-6">
                                        <div className="space-y-3 text-sm text-muted-foreground">
                                            <p>
                                                {pdf.isPaid
                                                    ? 'Exclusive mentor-crafted study resources. Unlocked once you enrol in the connected course.'
                                                    : 'Instantly accessible downloadable resource for your prep.'}
                                            </p>
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-muted-foreground/80">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 font-semibold text-muted-foreground shadow-sm">
                                                    <ArrowDownCircle className="h-3.5 w-3.5 text-primary" />
                                                    {Intl.NumberFormat('en-IN').format(pdf.downloadCount)} downloads
                                                </span>
                                                {pdf.course ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary shadow-sm">
                                                        <Crown className="h-3.5 w-3.5" />
                                                        {pdf.course.name}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-600 shadow-sm">
                                                        Free Access
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {pdf.isPaid ? (
                                                pdf.isUnlocked ? (
                                                    <Button
                                                        asChild
                                                        className="inline-flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground shadow-primary/30 transition hover:shadow-lg hover:shadow-primary/40"
                                                    >
                                                        <a href={`/pdfs/${pdf.slug}/download`}>
                                                            <Download className="h-4 w-4" />
                                                            Download PDF
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        className="inline-flex w-full items-center justify-center gap-2 border-primary/30 text-primary transition hover:border-primary hover:bg-primary/10"
                                                    >
                                                        <Link href={pdf.courseUrl}>
                                                            <Lock className="h-4 w-4" />
                                                            Unlock via Course
                                                        </Link>
                                                    </Button>
                                                )
                                            ) : (
                                                <Button
                                                    asChild
                                                    className="inline-flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground shadow-primary/30 transition hover:shadow-lg hover:shadow-primary/40"
                                                >
                                                    <a href={`/pdfs/${pdf.slug}/download`}>
                                                        <Download className="h-4 w-4" />
                                                        Download PDF
                                                    </a>
                                                </Button>
                                            )}

                                            {/* {pdf.isPaid && !pdf.isUnlocked ? (
                                                <p className="text-center text-xs text-muted-foreground">
                                                    <Lock className="mr-1 inline h-3 w-3 text-primary" />
                                                    {isAuthenticated
                                                        ? 'Buy the mapped course to unlock this premium PDF.'
                                                        : 'Sign in and purchase the course to unlock this premium PDF.'}
                                                </p>
                                            ) : null} */}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {!preparedPdfs.length ? (
                        <div className="mt-10 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-12 text-center text-muted-foreground">
                            Our PDF library is getting updated. Check back soon for fresh resources.
                        </div>
                    ) : null}
                </div>
            </section>
        </MarketingLayout>
    );
}
