import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import MarketingLayout from '@/layouts/marketing-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import interviewsRoutes from '@/routes/interviews';
import type { SharedData } from '@/types';
import {
    ArrowRight,
    AlertTriangle,
    CalendarCheck2,
    CalendarClock,
    CheckCircle2,
    Clock3,
    Loader2,
    RefreshCcw,
    ShieldCheck,
    Sparkles,
    Upload,
    Video,
    Zap,
    X,
    Calendar,
    UserRoundPen,
    FileText,
    DownloadIcon,
} from 'lucide-react';

type BackgroundRecordingResult = {
    blob: Blob;
    durationSeconds: number;
};

type CourseOption = {
    id: number;
    name: string;
    slug: string;
    imageUrl: string | null;
    interviewCredits: number;
};

type CreditBalance = {
    course: {
        id: number;
        name: string;
        slug: string;
        defaultCredits: number;
    } | null;
    balance: number;
    lifetimeCredited: number;
    lifetimeDebited: number;
    lastTransactionAt: string | null;
    updatedAt: string | null;
};

type CreditTransaction = {
    id: number;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string | null;
    course: {
        id: number;
        name: string;
        slug: string;
    } | null;
    meta: Record<string, unknown> | null;
    createdAt: string | null;
};

type InterviewSlotPreview = {
    id: number;
    course: {
        id: number;
        name: string;
        slug: string;
    } | null;
    startsAt: string | null;
    endsAt: string | null;
    timezone: string;
    capacity: number;
    bookedCount: number;
    available: number;
    meta?: Record<string, unknown> | null;
};

type InterviewSessionPreview = {
    id: number;
    uuid: string;
    status: string;
    course: {
        id: number;
        name: string;
        slug: string;
    } | null;
    slot: {
        id: number;
        startsAt: string | null;
        endsAt: string | null;
        timezone: string;
    } | null;
    candidateRole: string | null;
    questionLimit: number;
    questionsAsked: number;
    creditsDebited: number;
    scheduledAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    feedbackSummary: string | null;
    feedbackGeneratedAt?: string | null;
    recordingPath?: string | null;
    recordingUrl?: string | null;
};

type ToastVariant = 'success' | 'error';

type ToastMessage = {
    id: string;
    variant: ToastVariant;
    title: string;
    description?: string;
};

type InterviewSettingsPayload = {
    minRecordingSeconds: number;
    questionLimit: number;
    creditCost: number;
    reminderOffsets: number[];
    controls?: {
        repeatQuestion: boolean;
        recordAnswer: boolean;
        nextButton: boolean;
    };
    restrictions?: {
        cancelOnTabSwitch: boolean;
    };
};

type InterviewQuestionPayload = {
    id: number;
    sequence: number;
    question: string;
    answerNotes: string | null;
    answerTranscript?: string | null;
    answerRecordingPath: string | null;
    answerDurationSeconds: number;
    askedAt: string | null;
    answeredAt: string | null;
};

type InterviewsPageProps = {
    courses: CourseOption[];
    credits: {
        balances: CreditBalance[];
        transactions: CreditTransaction[];
    };
    slots: InterviewSlotPreview[];
    sessions: InterviewSessionPreview[];
    settings: InterviewSettingsPayload;
};

const slotFilters = [
    { label: 'Today', value: 'today' },
    { label: 'Tomorrow', value: 'tomorrow' },
    { label: 'Next 7 days', value: 'week' },
    { label: 'All', value: 'all' },
] as const;

const interviewFlow = [
    {
        title: 'Share your ambition',
        description: 'Tell us the MBA role + SOP so prompts stay context-aware.',
        icon: Sparkles,
    },
    {
        title: 'Reserve an AI mentor',
        description: 'Pick an available slot aligned with your course credits.',
        icon: CalendarCheck2,
    },
    {
        title: 'Google Meet style room',
        description: 'We request mic/camera and mirror an interviewer across the desk.',
        icon: Video,
    },
    {
        title: 'Adaptive Q&A',
        description: 'Each question unlocks after you record a focused answer.',
        icon: ShieldCheck,
    },
    {
        title: 'Instant debrief',
        description: 'We stitch recordings + AI feedback for on-demand review.',
        icon: CheckCircle2,
    },
] as const;

const heroStats = [
    { label: 'Mock sessions delivered', value: '2,450+', icon: Video },
    { label: 'Avg. satisfaction score', value: '4.9/5', icon: ShieldCheck },
    { label: 'AI feedback ready in', value: '< 3 mins', icon: Zap },
] as const;

const statusStyles: Record<
    string,
    { label: string; className: string }
> = {
    scheduled: { label: 'Scheduled', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200' },
    ready: { label: 'Ready', className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100' },
    in_progress: { label: 'Live', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100' },
    completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100' },
    cancelled: { label: 'Cancelled', className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-100' },
};

const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(date.getDate() + days);

    return next;
};

const formatDateTime = (value: string | null | undefined, options?: Intl.DateTimeFormatOptions) => {
    if (!value) {
        return 'To be announced';
    }

    const date = new Date(value);

    return new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        ...options,
    }).format(date);
};

const getCsrfToken = (): string => {
    const meta = document.querySelector("meta[name='csrf-token']") as HTMLMetaElement | null;

    return meta?.content ?? '';
};

const sessionEndpoint = {
    start: (id: number) => `/interviews/sessions/${id}/start`,
    nextQuestion: (id: number) => `/interviews/sessions/${id}/questions/next`,
    submitAnswer: (sessionId: number, questionId: number) =>
        `/interviews/sessions/${sessionId}/questions/${questionId}/answer`,
    complete: (id: number) => `/interviews/sessions/${id}/complete`,
    cancel: (id: number) => `/interviews/sessions/${id}/cancel`,
    uploadRecording: (id: number) => `/interviews/sessions/${id}/recordings/chunks`,
};

export default function InterviewsPage({
    courses,
    credits: initialCredits,
    slots: initialSlots,
    sessions: initialSessions,
    settings,
}: InterviewsPageProps) {
    const {
        props: { auth },
    } = usePage<SharedData>();
    const firstName = auth?.user?.name?.split(' ')?.[0] ?? 'there';

    const [credits, setCredits] = useState(initialCredits);
    const [slots, setSlots] = useState(initialSlots);
    const [sessions, setSessions] = useState(initialSessions);
    const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
    const [slotFilter, setSlotFilter] = useState<(typeof slotFilters)[number]['value']>('week');
    const [formData, setFormData] = useState({
        candidate_role: '',
    });
    const [sopFile, setSopFile] = useState<File | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slotLoading, setSlotLoading] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [roomOpen, setRoomOpen] = useState(false);
    const [roomSession, setRoomSession] = useState<InterviewSessionPreview | null>(null);
    const [roomQuestion, setRoomQuestion] = useState<InterviewQuestionPayload | null>(null);
    const [roomLoading, setRoomLoading] = useState(false);
    const [roomError, setRoomError] = useState<string | null>(null);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [permissionState, setPermissionState] = useState<'idle' | 'pending' | 'granted' | 'denied'>('idle');
    const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing'>('idle');
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [answerNotes, setAnswerNotes] = useState('');
    const [cheatTriggered, setCheatTriggered] = useState(false);
    const [feedbackGenerating, setFeedbackGenerating] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const backgroundRecorderRef = useRef<MediaRecorder | null>(null);
    const backgroundRecordingSessionIdRef = useRef<number | null>(null);
    const backgroundRecordingChunksRef = useRef<Blob[]>([]);
    const backgroundRecordingPromiseRef = useRef<Promise<BackgroundRecordingResult | null> | null>(null);
    const backgroundRecordingResolverRef = useRef<((result: BackgroundRecordingResult | null) => void) | null>(null);
    const backgroundRecordingStartTimeRef = useRef<number | null>(null);

    const totalCredits = useMemo(
        () => credits.balances.reduce((sum, item) => sum + (item.balance ?? 0), 0),
        [credits.balances],
    );

    const creditCanvas = useMemo(
        () => ({
            total: totalCredits,
            lifetime: credits.balances.reduce((sum, item) => sum + (item.lifetimeCredited ?? 0), 0),
            used: credits.balances.reduce((sum, item) => sum + (item.lifetimeDebited ?? 0), 0),
        }),
        [credits.balances, totalCredits],
    );

    const reminderPreview = useMemo(
        () => [...(settings.reminderOffsets ?? [])].sort((a, b) => a - b),
        [settings.reminderOffsets],
    );
    const controlToggles = useMemo(
        () => ({
            repeatQuestion: settings.controls?.repeatQuestion ?? true,
            recordAnswer: settings.controls?.recordAnswer ?? true,
            nextButton: settings.controls?.nextButton ?? true,
        }),
        [settings.controls],
    );
    const restrictions = useMemo(
        () => ({
            cancelOnTabSwitch: settings.restrictions?.cancelOnTabSwitch ?? true,
        }),
        [settings.restrictions],
    );

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        ({
            title,
            description,
            variant = 'success',
            duration = 5000,
        }: {
            title: string;
            description?: string;
            variant?: ToastVariant;
            duration?: number;
        }) => {
            const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            setToasts((prev) => [...prev, { id, variant, title, description }]);
            setTimeout(() => {
                dismissToast(id);
            }, duration);
        },
        [dismissToast],
    );

    const ensureMediaPermissions = useCallback(async () => {
        if (permissionState === 'granted') {
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setPermissionState('denied');
            throw new Error('Your browser does not support audio/video capture.');
        }

        try {
            setPermissionState('pending');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            mediaStreamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setPermissionState('granted');
        } catch (error) {
            setPermissionState('denied');
            throw error instanceof Error ? error : new Error('Camera or microphone permission denied.');
        }
    }, [permissionState]);

    const startBackgroundRecording = useCallback(
        async (sessionId: number) => {
            if (backgroundRecordingSessionIdRef.current === sessionId && backgroundRecorderRef.current) {
                return;
            }

            if (!mediaStreamRef.current) {
                await ensureMediaPermissions();
            }

            if (!mediaStreamRef.current) {
                throw new Error('Unable to access microphone or camera.');
            }

            let recorder: MediaRecorder;
            try {
                recorder = new MediaRecorder(mediaStreamRef.current, {
                    mimeType: 'video/webm;codecs=vp8,opus',
                });
            } catch {
                recorder = new MediaRecorder(mediaStreamRef.current);
            }

            backgroundRecordingSessionIdRef.current = sessionId;
            backgroundRecorderRef.current = recorder;
            backgroundRecordingChunksRef.current = [];
            backgroundRecordingStartTimeRef.current = performance.now();
            backgroundRecordingPromiseRef.current = new Promise<BackgroundRecordingResult | null>((resolve) => {
                backgroundRecordingResolverRef.current = resolve;
            });

            recorder.addEventListener('dataavailable', (event) => {
                if (!event.data?.size || backgroundRecordingSessionIdRef.current === null) {
                    return;
                }

                backgroundRecordingChunksRef.current.push(event.data);
            });

            recorder.addEventListener('stop', () => {
                const durationSeconds = backgroundRecordingStartTimeRef.current
                    ? Math.max(1, Math.round((performance.now() - backgroundRecordingStartTimeRef.current) / 1000))
                    : 1;
                const blob = backgroundRecordingChunksRef.current.length
                    ? new Blob(backgroundRecordingChunksRef.current, { type: recorder.mimeType })
                    : null;

                backgroundRecordingChunksRef.current = [];
                backgroundRecordingStartTimeRef.current = null;
                backgroundRecorderRef.current = null;
                backgroundRecordingSessionIdRef.current = null;

                if (backgroundRecordingResolverRef.current) {
                    backgroundRecordingResolverRef.current(blob ? { blob, durationSeconds } : null);
                    backgroundRecordingResolverRef.current = null;
                }
            });

            recorder.start();
        },
        [ensureMediaPermissions],
    );

    const stopBackgroundRecording = useCallback(async (): Promise<BackgroundRecordingResult | null> => {
        if (!backgroundRecorderRef.current) {
            const pending = backgroundRecordingPromiseRef.current;
            backgroundRecordingPromiseRef.current = null;
            return pending ? pending : null;
        }

        const pending = backgroundRecordingPromiseRef.current;
        backgroundRecorderRef.current.stop();

        const result = pending ? await pending : null;
        backgroundRecordingPromiseRef.current = null;
        return result;
    }, []);

    const requestJson = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T> => {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(init?.headers ?? {}),
            },
            ...init,
        });

        let payload: unknown = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        if (!response.ok) {
            const error = new Error(
                (payload && typeof payload === 'object' && 'message' in payload ? (payload as any).message : null) ??
                'Something went wrong. Please try again.',
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (error as any).errors = (payload as any)?.errors ?? {};
            throw error;
        }

        return payload as T;
    }, []);

    const refreshCredits = useCallback(async () => {
        const data = await requestJson<typeof initialCredits>(interviewsRoutes.credits.index.url());
        setCredits(data);
        return data;
    }, [requestJson]);

    const refreshSessions = useCallback(async () => {
        const data = await requestJson<{ sessions: InterviewSessionPreview[] }>(
            interviewsRoutes.sessions.index.url(),
        );
        setSessions(data.sessions);
        return data;
    }, [requestJson]);
    const syncSession = useCallback((updated: InterviewSessionPreview) => {
        setSessions((prev) => {
            const exists = prev.some((session) => session.id === updated.id);
            if (!exists) {
                return [updated, ...prev].slice(0, 8);
            }

            return prev.map((session) => (session.id === updated.id ? updated : session));
        });
    }, []);
    const trackSessionLocally = useCallback(
        (updated: InterviewSessionPreview) => {
            syncSession(updated);
            setRoomSession((prev) => (prev && prev.id === updated.id ? updated : prev));
        },
        [syncSession],
    );

    const refreshSlots = useCallback(async () => {
        setSlotLoading(true);
        try {
            const data = await requestJson<{ slots: InterviewSlotPreview[] }>(interviewsRoutes.slots.index.url());
            setSlots(data.slots);

            return data;
        } finally {
            setSlotLoading(false);
        }
    }, [requestJson]);

    const resetRecordingState = useCallback((options?: { preserveChunks?: boolean }) => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        if (!options?.preserveChunks) {
            recordingChunksRef.current = [];
        }
        setRecordingSeconds(0);
        setRecordingState('idle');
    }, []);

    const closeRoom = useCallback(() => {
        stopBackgroundRecording().catch(() => {
            // ignore
        });
        resetRecordingState();
        setRoomOpen(false);
        setRoomSession(null);
        setRoomQuestion(null);
        setAnswerNotes('');
        setRoomError(null);
        setFeedbackGenerating(false);
        setCheatTriggered(false);

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setPermissionState('idle');
    }, [resetRecordingState, stopBackgroundRecording]);

    const postJson = useCallback(
        async <T,>(url: string, body?: Record<string, unknown>): Promise<T> =>
            requestJson<T>(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: body ? JSON.stringify(body) : undefined,
            }),
        [requestJson],
    );

    const speakQuestion = useCallback(
        (questionText?: string | null) => {
            if (!questionText || typeof window === 'undefined' || !('speechSynthesis' in window)) {
                return;
            }

            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(questionText);
            utterance.rate = 1;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        },
        [],
    );

    const handleRepeatQuestion = useCallback(() => {
        speakQuestion(roomQuestion?.question);
    }, [roomQuestion?.question, speakQuestion]);

    const handleStartInterview = useCallback(
        async (sessionId: number) => {
            setRoomLoading(true);
            setRoomError(null);

            try {
                const data = await postJson<{ session: InterviewSessionPreview; question: InterviewQuestionPayload }>(
                    sessionEndpoint.start(sessionId),
                );

                trackSessionLocally(data.session);
                setRoomSession(data.session);
                setRoomQuestion(data.question);
                speakQuestion(data.question?.question);
                setRoomOpen(true);
                setAnswerNotes('');
                setFeedbackGenerating(false);
                await ensureMediaPermissions();
                await startBackgroundRecording(data.session.id);
            } catch (error) {
                setRoomError(error instanceof Error ? error.message : 'Unable to start interview right now.');
            } finally {
                setRoomLoading(false);
            }
        },
        [ensureMediaPermissions, postJson, speakQuestion, startBackgroundRecording, trackSessionLocally],
    );

    const requestNextQuestion = useCallback(
        async (sessionId: number) => {
            try {
                const data = await postJson<{ question: InterviewQuestionPayload; session: InterviewSessionPreview }>(
                    sessionEndpoint.nextQuestion(sessionId),
                );

                trackSessionLocally(data.session);
                setRoomQuestion(data.question);
                speakQuestion(data.question?.question);
                setAnswerNotes('');
                setRecordingState('idle');
                setRecordingSeconds(0);
            } catch (error) {
                setRoomError(error instanceof Error ? error.message : 'Unable to fetch the next question.');
            }
        },
        [postJson, speakQuestion, trackSessionLocally],
    );

    const uploadRecordingBlob = useCallback(
        async (
            sessionId: number,
            blob: Blob,
            durationSeconds: number,
            onProgress?: (value: number) => void,
        ): Promise<string | null> => {
            const chunkSize = 512 * 1024; // 512KB to respect PHP upload limits
            const totalChunks = Math.max(1, Math.ceil(blob.size / chunkSize));
            let lastPath: string | null = null;

            for (let index = 0; index < totalChunks; index += 1) {
                const chunk = blob.slice(index * chunkSize, Math.min(blob.size, (index + 1) * chunkSize), 'video/webm');
                const formData = new FormData();
                formData.append('file', chunk, `chunk-${index}.webm`);
                formData.append('chunk_index', String(index));
                formData.append('duration_seconds', String(Math.max(1, Math.round(durationSeconds / totalChunks))));
                formData.append('total_chunks', String(totalChunks));
                formData.append('is_last_chunk', index === totalChunks - 1 ? '1' : '0');

                const response = await fetch(sessionEndpoint.uploadRecording(sessionId), {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: formData,
                });

                const payload = (await response.json().catch(() => ({}))) as { path?: string | null; message?: string };

                if (!response.ok) {
                    throw new Error(
                        payload && typeof payload === 'object' && payload.message
                            ? payload.message
                            : 'Unable to upload recording chunk.',
                    );
                }

                lastPath = payload.path ?? lastPath;

                if (onProgress) {
                    onProgress(Math.round(((index + 1) / totalChunks) * 100));
                }
            }

            return lastPath;
        },
        [],
    );

    const uploadFullSessionRecording = useCallback(
        async (sessionId: number, recording: BackgroundRecordingResult | null) => {
            if (!recording) {
                return;
            }

            const formData = new FormData();
            formData.append('file', recording.blob, `session-${sessionId}.webm`);
            formData.append('duration_seconds', String(Math.max(1, recording.durationSeconds)));
            formData.append('full_recording', '1');

            const response = await fetch(sessionEndpoint.uploadRecording(sessionId), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: formData,
            });

            const payload = (await response.json().catch(() => ({}))) as { message?: string };
            if (!response.ok) {
                throw new Error(
                    payload && typeof payload === 'object' && payload.message
                        ? payload.message
                        : 'Unable to upload interview recording.',
                );
            }
        },
        [],
    );

    const handleCompleteSession = useCallback(async () => {
        if (!roomSession) {
            return;
        }

        setFeedbackGenerating(true);
        try {
            const recording = await stopBackgroundRecording();
            await uploadFullSessionRecording(roomSession.id, recording);
            const data = await postJson<{ session: InterviewSessionPreview }>(sessionEndpoint.complete(roomSession.id));
            trackSessionLocally(data.session);
            await refreshSessions();
            setTimeout(() => {
                setFeedbackGenerating(false);
                closeRoom();
            }, 1500);
        } catch (error) {
            setFeedbackGenerating(false);
            setRoomError(error instanceof Error ? error.message : 'Unable to complete interview right now.');
        }
    }, [closeRoom, postJson, refreshSessions, roomSession, stopBackgroundRecording, trackSessionLocally, uploadFullSessionRecording]);

    const handleSubmitAnswer = useCallback(
        async (durationSeconds: number, recordingPath?: string | null) => {
            if (!roomSession || !roomQuestion) {
                return;
            }

            if (durationSeconds < settings.minRecordingSeconds) {
                setRoomError(`Record at least ${settings.minRecordingSeconds} seconds before saving your answer.`);
                return;
            }

            try {
                const shouldAutoAdvance = roomSession.questionsAsked < roomSession.questionLimit;
                const sessionId = roomSession.id;
                const payload = {
                    answer_notes: answerNotes.trim() || null,
                    answer_duration_seconds: durationSeconds,
                    answer_recording_path: recordingPath ?? null,
                };
                const data = await postJson<{ question: InterviewQuestionPayload }>(
                    sessionEndpoint.submitAnswer(roomSession.id, roomQuestion.id),
                    payload,
                );

                setRoomQuestion(data.question);
                setAnswerNotes('');
                const refreshed = await refreshSessions();
                const updatedSession = refreshed.sessions.find((session) => session.id === sessionId);
                setRoomSession((prev) => (prev && updatedSession ? updatedSession : prev));

                if (shouldAutoAdvance) {
                    await requestNextQuestion(sessionId);
                } else if (updatedSession && updatedSession.questionsAsked >= updatedSession.questionLimit) {
                    await handleCompleteSession();
                }
            } catch (error) {
                setRoomError(error instanceof Error ? error.message : 'Unable to save your answer.');
            }
        },
        [answerNotes, handleCompleteSession, postJson, refreshSessions, requestNextQuestion, roomQuestion, roomSession, settings.minRecordingSeconds],
    );

    const handleRecordToggle = useCallback(async () => {
        if (recordingState === 'recording') {
            const currentDuration = recordingSeconds;
            const hasChunks = recordingChunksRef.current.length > 0;
            resetRecordingState({ preserveChunks: true });
            if (currentDuration >= settings.minRecordingSeconds && hasChunks) {
                if (!roomSession) {
                    setRoomError('This interview session is no longer available.');
                    recordingChunksRef.current = [];
                    setRecordingState('idle');
                    setRecordingSeconds(0);
                    setUploadProgress(0);
                    return;
                }
                try {
                    setRecordingState('processing');
                    const blob = new Blob(recordingChunksRef.current, { type: 'video/webm' });
                    setUploadProgress(0);
                    const recordingPath = await uploadRecordingBlob(
                        roomSession.id,
                        blob,
                        currentDuration,
                        setUploadProgress,
                    );
                    recordingChunksRef.current = [];
                    await handleSubmitAnswer(currentDuration, recordingPath);
                    setRecordingState('idle');
                    setRecordingSeconds(0);
                    setUploadProgress(0);
                } catch (error) {
                    setRoomError(error instanceof Error ? error.message : 'Unable to upload this recording.');
                    setRecordingState('idle');
                    setUploadProgress(0);
                }
            } else {
                setRoomError(`Record at least ${settings.minRecordingSeconds} seconds before saving.`);
                recordingChunksRef.current = [];
                setRecordingState('idle');
                setRecordingSeconds(0);
                setUploadProgress(0);
            }
            return;
        }

        try {
            await ensureMediaPermissions();
            if (!mediaStreamRef.current) {
                throw new Error('Unable to access microphone and camera.');
            }

            const recorder = new MediaRecorder(mediaStreamRef.current, {
                mimeType: 'video/webm;codecs=vp9,opus',
            });
            recordingChunksRef.current = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size) {
                    recordingChunksRef.current.push(event.data);
                }
            };
            recorder.onstop = () => {
                if (!recordingChunksRef.current.length) {
                    try {
                        if (recorder.state !== 'inactive') {
                            recorder.requestData();
                        }
                    } catch {
                        // ignore
                    }
                }
            };
            mediaRecorderRef.current = recorder;
            recorder.start(1000);
            setRecordingSeconds(0);
            setRecordingState('recording');
            recordingTimerRef.current = window.setInterval(() => {
                setRecordingSeconds((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            setRoomError(error instanceof Error ? error.message : 'Unable to access microphone or camera.');
            setRecordingState('idle');
        }
    }, [
        ensureMediaPermissions,
        handleSubmitAnswer,
        recordingSeconds,
        recordingState,
        resetRecordingState,
        settings.minRecordingSeconds,
        roomSession,
        uploadRecordingBlob,
    ]);

    const handleNextQuestion = useCallback(async () => {
        if (!roomSession) {
            return;
        }

        await requestNextQuestion(roomSession.id);
    }, [requestNextQuestion, roomSession]);

    const handleCancelSession = useCallback(
        async (sessionId: number, reason = 'user_cancelled') => {
            try {
                let recording: BackgroundRecordingResult | null = null;
                if (roomSession?.id === sessionId) {
                    recording = await stopBackgroundRecording();
                }
                const data = await postJson<{ session: InterviewSessionPreview }>(sessionEndpoint.cancel(sessionId), {
                    reason,
                });
                trackSessionLocally(data.session);
                await refreshSessions();
                if (recording) {
                    await uploadFullSessionRecording(sessionId, recording);
                }
                if (roomSession?.id === sessionId) {
                    closeRoom();
                }
            } catch (error) {
                setRoomError(error instanceof Error ? error.message : 'Unable to cancel this interview.');
            }
        },
        [closeRoom, postJson, refreshSessions, roomSession, stopBackgroundRecording, trackSessionLocally, uploadFullSessionRecording],
    );


    const handleCompleteFromList = useCallback(
        async (sessionId: number) => {
            try {
                const recording = roomSession?.id === sessionId ? await stopBackgroundRecording() : null;
                const data = await postJson<{ session: InterviewSessionPreview }>(sessionEndpoint.complete(sessionId));
                await uploadFullSessionRecording(sessionId, recording);
                trackSessionLocally(data.session);
                await refreshSessions();
            } catch (error) {
                showToast({
                    title: 'Unable to complete session',
                    description: error instanceof Error ? error.message : 'Unable to complete this session.',
                    variant: 'error',
                });
            }
        },
        [postJson, refreshSessions, roomSession, showToast, stopBackgroundRecording, trackSessionLocally, uploadFullSessionRecording],
    );

    useEffect(() => {
        refreshSlots().catch((error) => {
            showToast({
                title: 'Unable to load slots',
                description: error instanceof Error ? error.message : 'Unable to load slots.',
                variant: 'error',
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(
        () => () => {
            stopBackgroundRecording().catch(() => {
                // ignore
            });
        },
        [stopBackgroundRecording],
    );

    const filteredSlots = useMemo(() => {
        const now = new Date();

        return slots.filter((slot) => {
            if (!slot.startsAt) {
                return false;
            }

            const slotDate = new Date(slot.startsAt);

            if (slotFilter === 'today') {
                return isSameDay(slotDate, now);
            }

            if (slotFilter === 'tomorrow') {
                return isSameDay(slotDate, addDays(now, 1));
            }

            if (slotFilter === 'week') {
                const sevenDaysLater = addDays(now, 7);

                return slotDate <= sevenDaysLater;
            }

            return true;
        });
    }, [slotFilter, slots]);

    useEffect(() => {
        if (!selectedSlotId && filteredSlots.length) {
            setSelectedSlotId(filteredSlots[0].id);
        }
    }, [filteredSlots, selectedSlotId]);

    useEffect(
        () => () => {
            closeRoom();
        },
        [closeRoom],
    );

    useEffect(() => {
        if (permissionState === 'granted' && videoRef.current && mediaStreamRef.current) {
            videoRef.current.srcObject = mediaStreamRef.current;
        }
    }, [permissionState, roomOpen]);

    useEffect(() => {
        if (!roomError) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setRoomError(null);
        }, 3000);

        return () => window.clearTimeout(timeout);
    }, [roomError]);

    useEffect(() => {
        if (typeof document === 'undefined') {
            return;
        }

        const previousOverflow = document.body.style.overflow;

        if (roomOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = previousOverflow || '';
        }

        return () => {
            document.body.style.overflow = previousOverflow || '';
        };
    }, [roomOpen]);

    useEffect(() => {
        if (!roomOpen || !restrictions.cancelOnTabSwitch || !roomSession) {
            return;
        }

        const onVisibilityChange = () => {
            if (document.hidden) {
                setCheatTriggered(true);
                handleCancelSession(roomSession.id, 'visibility_change_detected');
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [handleCancelSession, restrictions.cancelOnTabSwitch, roomOpen, roomSession]);

    const upcomingSession = useMemo(() => {
        const futureSessions = sessions
            .filter((session) => !session.cancelledAt && session.slot?.startsAt)
            .sort((a, b) => {
                const left = new Date(a.slot?.startsAt ?? 0).getTime();
                const right = new Date(b.slot?.startsAt ?? 0).getTime();

                return left - right;
            });

        return futureSessions[0] ?? null;
    }, [sessions]);

    const handleSchedule = useCallback(
        async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setFormErrors({});

            if (!selectedSlotId) {
                showToast({
                    title: 'Select a slot',
                    description: 'Please select a slot to continue.',
                    variant: 'error',
                });

                return;
            }

            setIsSubmitting(true);
            try {
                const payload = new FormData();
                payload.append('interview_slot_id', String(selectedSlotId));
                payload.append('candidate_role', formData.candidate_role.trim());
                if (sopFile) {
                    payload.append('sop_file', sopFile);
                }

                const response = await fetch(interviewsRoutes.sessions.store.url(), {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                    },
                    body: payload,
                });

                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    const error = new Error(
                        (result && typeof result === 'object' && 'message' in result ? (result as any).message : null) ??
                        'Unable to schedule interview.',
                    );
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (error as any).errors = (result as any)?.errors ?? {};
                    throw error;
                }

                const data = result as { session: InterviewSessionPreview };

                setSessions((prev) => [data.session, ...prev].slice(0, 8));
                setFormData({ candidate_role: '' });
                setSelectedSlotId(null);
                setSopFile(null);
                showToast({
                    title: 'Interview locked in',
                    description: 'We emailed the confirmation and will nudge you before it begins.',
                });
                await Promise.all([
                    refreshCredits(),
                    refreshSessions(),
                    refreshSlots(),
                ]);
            } catch (error) {
                const validationErrors =
                    error instanceof Error && 'errors' in error ? (error as any).errors : {};
                setFormErrors(validationErrors ?? {});
                showToast({
                    title: 'Unable to schedule interview',
                    description: error instanceof Error ? error.message : 'Unable to schedule interview.',
                    variant: 'error',
                });
            } finally {
                setIsSubmitting(false);
            }
        },
        [
            formData.candidate_role,
            refreshCredits,
            refreshSessions,
            refreshSlots,
            selectedSlotId,
            sopFile,
            showToast,
        ],
    );

    const handleRefreshAll = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                refreshCredits(),
                refreshSessions(),
                refreshSlots(),
            ]);
            showToast({
                title: 'Dashboard updated',
                description: 'Synced with the latest interview data.',
            });
        } catch (error) {
            showToast({
                title: 'Unable to refresh right now',
                description: error instanceof Error ? error.message : 'Unable to refresh right now.',
                variant: 'error',
            });
        } finally {
            setRefreshing(false);
        }
    }, [refreshCredits, refreshSessions, refreshSlots, showToast]);

    const slotUnavailable = filteredSlots.length === 0;
    return (
        <MarketingLayout>
            <Head title="AI Interview Studio" />
            <div className="pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto flex max-w-xl flex-col gap-3 px-4 sm:right-4 sm:top-6 sm:left-auto sm:max-w-sm sm:px-0">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            'pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur',
                            toast.variant === 'error'
                                ? 'border-rose-200/60 bg-white text-rose-900'
                                : 'border-emerald-200/60 bg-white text-emerald-900',
                        )}
                        aria-live="polite"
                    >
                        {toast.variant === 'error' ? (
                            <AlertTriangle className="mt-0.5 h-5 w-5 text-rose-500" />
                        ) : (
                            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                        )}
                        <div className="flex-1">
                            <p className="font-semibold">{toast.title}</p>
                            {toast.description ? (
                                <p className="text-xs text-muted-foreground/80">{toast.description}</p>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={() => dismissToast(toast.id)}
                            className="text-muted-foreground transition hover:text-foreground"
                            aria-label="Dismiss notification"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
            <section className="relative overflow-hidden border border-white/5 bg-[#050b22] p-6 text-white transition md:p-10">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(61,108,241,0.18),_transparent_65%)]" />
                <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-amber-400/25 blur-[120px]" />
                <div className="relative mx-auto w-full max-w-6xl space-y-10 py-10 sm:px-6 lg:px-0">
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-5 text-balance">
                            <Badge className="rounded-full border border-yellow-400/40 bg-gradient-to-r from-[#FFCC5F]/90 to-[#F6A602]/90 px-4 py-1 text-sm font-semibold text-slate-900 shadow-lg shadow-yellow-300/30">
                                MBA Interview Studio
                            </Badge>
                            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-[2.9rem] lg:leading-tight">
                                {firstName}, design your smartest mock interview in minutes.
                            </h1>
                            <p className="max-w-2xl text-base text-slate-200 md:text-lg">
                                Reserve a slot, step into a Google Meet inspired room, and let our AI panel generate
                                human-grade questions based on your role + SOP. Every recording and feedback loop lands
                                in one place.
                            </p>
                            {upcomingSession ? (
                                <div className="group flex items-center gap-4 rounded-3xl border border-white/10 bg-white/10 px-5 py-4 text-sm text-white shadow-2xl shadow-black/30 backdrop-blur transition hover:-translate-y-0.5 hover:border-white/40">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/25 text-emerald-100">
                                        <CalendarClock className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="font-semibold">
                                            Next session · {formatDateTime(upcomingSession.slot?.startsAt)}
                                        </p>
                                        <p className="text-xs text-slate-200/80">
                                            Meet link unlocks {reminderPreview[0] ?? 15} min before start · {upcomingSession.slot?.timezone ?? 'Local time'}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="rounded-full border border-emerald-300/60 bg-emerald-400/20 text-xs font-semibold text-emerald-100"
                                    >
                                        {upcomingSession.status === 'ready' ? 'Ready to join' : 'Scheduled'}
                                    </Badge>
                                </div>
                            ) : null}
                            <div className="grid gap-3 pt-2 sm:grid-cols-3">
                                {heroStats.map((stat) => {
                                    const Icon = stat.icon;
                                    return (
                                        <div
                                            key={stat.label}
                                            className="group rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/15"
                                        >
                                            <Icon className="mb-3 h-5 w-5 text-white/80 transition group-hover:text-white" />
                                            <p className="text-2xl font-semibold tracking-tight text-white">{stat.value}</p>
                                            <p className="text-xs text-white/70">{stat.label}</p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    size="lg"
                                    variant="default"
                                    className="h-11 rounded-xl !bg-[#FFD766] px-6 font-semibold text-slate-900 shadow-[0_12px_40px_rgba(255,214,102,0.35)] transition hover:-translate-y-1 hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2 !hover:bg-transparent hover:ring-white cursor-pointer"
                                    onClick={() =>
                                        document.getElementById('schedule-interview')?.scrollIntoView({ behavior: 'smooth' })
                                    }
                                >
                                    Plan next session
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="lg"
                                    className="h-11 rounded-xl border border-white/40 bg-white/10 px-6 text-white shadow-[0_14px_40px_rgba(13,148,136,0.25)] backdrop-blur transition cursor-pointer"
                                    onClick={handleRefreshAll}
                                    disabled={refreshing}
                                >
                                    {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                                    Sync data
                                </Button>
                            </div>
                        </div>
                        <div className="grid w-full gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-2xl shadow-black/30 backdrop-blur md:max-w-md">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">Available credits</span>
                                <Badge variant="outline" className="rounded-full border-white/20 bg-white/10 text-xs font-semibold text-white">
                                    {settings.creditCost} credit / session
                                </Badge>
                            </div>
                            <p className="text-4xl font-semibold tracking-tight text-white">{creditCanvas.total}</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                                    <p className="text-xs text-white/70">Lifetime earned</p>
                                    <p className="text-lg font-semibold text-white">{creditCanvas.lifetime}</p>
                                </div>
                                <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
                                    <p className="text-xs text-white/70">Spent on interviews</p>
                                    <p className="text-lg font-semibold text-white">{creditCanvas.used}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-white/80">
                                <Clock3 className="h-4 w-4" />
                                Reminders go out {reminderPreview.join(', ')} min before start.
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <div className="mx-auto w-full max-w-6xl space-y-10 py-10 sm:px-6 lg:px-0">
                <div className="grid gap-8 lg:grid-cols-[1fr]">
                    <section className="space-y-6">
                        <Card className="border shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl font-semibold">Interview energy overview</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Track where your credits go and review the latest ledger activity.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full"
                                    onClick={() => setHistoryOpen((prev) => !prev)}
                                >
                                    {historyOpen ? 'Hide ledger' : 'Show ledger'}
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4">
                                    {credits.balances.map((balance) => (
                                        <div
                                            key={balance.course?.id ?? balance.updatedAt}
                                            className={cn(
                                                'rounded-2xl border bg-gradient-to-br p-4 transition hover:-translate-y-0.5 hover:shadow-md',
                                                'from-white via-white to-primary/5 dark:from-slate-900 dark:via-slate-900 dark:to-primary/10',
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium">
                                                    {balance.course?.name ?? 'Unassigned course'}
                                                </p>
                                                <Badge variant="outline" className="rounded-full text-xs">
                                                    +{balance.course?.defaultCredits ?? 0}/purchase
                                                </Badge>
                                            </div>
                                            <p className="mt-3 text-3xl font-semibold tracking-tight text-primary">
                                                {balance.balance}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Updated {balance.updatedAt ? formatDateTime(balance.updatedAt) : 'recently'}
                                            </p>
                                        </div>
                                    ))}
                                    {credits.balances.length === 0 && (
                                        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                            Purchase any CATking MBA course to unlock interview credits.
                                        </div>
                                    )}
                                </div>
                                {historyOpen && (
                                    <div className="space-y-4 rounded-2xl border bg-muted/30 p-4 animate-in fade-in-50 slide-in-from-top-2">
                                        <p className="text-sm font-semibold">Recent ledger</p>
                                        <div className="space-y-3">
                                            {credits.transactions.map((transaction) => (
                                                <div
                                                    key={transaction.id}
                                                    className="flex items-center justify-between rounded-2xl bg-background/80 p-3 shadow-xs"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {transaction.description ?? transaction.type}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDateTime(transaction.createdAt)}
                                                            {transaction.course ? ` · ${transaction.course.name}` : null}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p
                                                            className={cn(
                                                                'text-base font-semibold',
                                                                transaction.amount >= 0 ? 'text-emerald-600' : 'text-rose-600',
                                                            )}
                                                        >
                                                            {transaction.amount > 0 ? '+' : ''}
                                                            {transaction.amount}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Balance {transaction.balanceAfter}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {credits.transactions.length === 0 && (
                                                <p className="text-sm text-muted-foreground">
                                                    Credit history will appear after your next purchase or booking.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* <Card className="border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">Interview journey preview</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Know what happens the moment you hit “Schedule interview”.
                                </p>
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                {interviewFlow.map((step, index) => {
                                    const Icon = step.icon;

                                    return (
                                        <div
                                            key={step.title}
                                            className="relative flex flex-col gap-3 rounded-2xl border bg-background/80 p-4 text-sm shadow-xs transition hover:-translate-y-0.5 hover:shadow-lg"
                                        >
                                            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{index + 1}. {step.title}</p>
                                                <p className="text-xs text-muted-foreground">{step.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card> */}
                    </section>

                    <section id="schedule-interview" className="space-y-6">
                        <Card className="border shadow-lg">
                            <CardHeader className="space-y-2">
                                <CardTitle className="text-2xl font-semibold tracking-tight">
                                    Schedule your next mock interview
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Choose the course credits to consume, share your role, and claim a slot. We&apos;ll send
                                    you a Meet-style link instantly.
                                </p>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-6" onSubmit={handleSchedule}>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <UserRoundPen width={20} />
                                            <Label className="text-base font-medium">Preferred role / college</Label>
                                        </div>
                                        <Input
                                            id="role"
                                            placeholder="Eg. ISB EEO · Consulting focus"
                                            value={formData.candidate_role}
                                            onChange={(event) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    candidate_role: event.target.value,
                                                }))
                                            }
                                            className="rounded-xl"
                                        />
                                        <InputError message={formErrors.candidate_role?.[0]} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="sop-file"></Label>
                                        <div className="flex items-center gap-2">
                                            <FileText width={20} />
                                            <Label className="text-base font-medium">Upload SOP (PDF, optional)</Label>
                                        </div>
                                        <input
                                            id="sop-file"
                                            type="file"
                                            accept="application/pdf"
                                            className="block w-full cursor-pointer rounded-xl border border-muted bg-background/80 px-4 py-2 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-primary"
                                            onChange={(event) => {
                                                const file = event.target.files?.[0] ?? null;
                                                if (file && file.type !== 'application/pdf') {
                                                    showToast({
                                                        title: 'Invalid file type',
                                                        description: 'Please upload only PDF files.',
                                                        variant: 'error',
                                                    });
                                                    event.target.value = '';
                                                    return;
                                                }
                                                setSopFile(file ?? null);
                                            }}
                                        />
                                        {sopFile ? (
                                            <p className="text-xs text-muted-foreground">Selected: {sopFile.name}</p>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                Upload your SOP PDF if you want the panel to read the full version.
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar width={20} />
                                                <Label className="text-base font-medium">Pick an available slot</Label>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {slotFilters.map((filter) => (
                                                    <Button
                                                        key={filter.value}
                                                        type="button"
                                                        variant={slotFilter === filter.value ? 'default' : 'outline'}
                                                        size="lg"
                                                        className="rounded-full cursor-pointer"
                                                        onClick={() => setSlotFilter(filter.value)}
                                                    >
                                                        {filter.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {slotLoading && (
                                                <div className="flex gap-3">
                                                    {[...Array(3)].map((_, index) => (
                                                        <Skeleton key={index} className="h-24 flex-1 rounded-2xl" />
                                                    ))}
                                                </div>
                                            )}
                                            {!slotLoading && slotUnavailable && (
                                                <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                                    No slots match the selected filters. Try another day or refresh.
                                                </div>
                                            )}
                                            {!slotLoading && !slotUnavailable && (
                                                <div className="flex gap-3 overflow-x-auto pb-1">
                                                    {filteredSlots.map((slot) => {
                                                        const isSelected = slot.id === selectedSlotId;

                                                        return (
                                                            <button
                                                                key={slot.id}
                                                                type="button"
                                                                className={cn(
                                                                    'flex min-w-[220px] flex-1 flex-col rounded-2xl border p-4 text-left transition focus:outline-none cursor-pointer',
                                                                    isSelected
                                                                        ? 'border-2 border-green-700 bg-white'
                                                                        : 'border-muted bg-background/80 hover:border-primary/50',
                                                                )}
                                                                onClick={() => setSelectedSlotId(slot.id)}
                                                            >
                                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                    <span>{slot.timezone}</span>
                                                                    <span className="font-medium text-foreground">
                                                                        {slot.available} seats
                                                                    </span>
                                                                </div>
                                                                <p className="mt-2 text-lg font-semibold">
                                                                    {slot.startsAt ? formatDateTime(slot.startsAt) : 'TBA'}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Ends {slot.endsAt ? formatDateTime(slot.endsAt, { hour: 'numeric', minute: '2-digit' }) : 'soon'}
                                                                </p>
                                                                {slot.course ? (
                                                                    <Badge variant="outline" className="mt-3 w-fit rounded-full">
                                                                        {slot.course.name}
                                                                    </Badge>
                                                                ) : null}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <InputError message={formErrors.interview_slot_id?.[0]} />
                                    </div>

                                    <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                                        <p className="flex items-center gap-2 font-medium text-foreground">
                                            <Video className="h-4 w-4 text-primary" />
                                            Interview room policies
                                        </p>
                                        <ul className="mt-2 list-disc space-y-1 pl-4">
                                            <li>Mic + camera permissions are required before the first question.</li>
                                            <li>
                                                Next button activates only after recording an answer for at least{' '}
                                                {settings.minRecordingSeconds} seconds.
                                            </li>
                                            <li>If the browser/tab is left mid-interview, the attempt auto-cancels.</li>
                                        </ul>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full rounded-2xl py-6 text-base font-semibold"
                                        disabled={
                                            isSubmitting ||
                                            !selectedSlotId ||
                                            !formData.candidate_role.trim()
                                        }
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" /> Locking your slot
                                            </>
                                        ) : (
                                            <>
                                                Schedule interview (uses {settings.creditCost} credit
                                                {settings.creditCost > 1 ? 's' : ''})
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </section>
                </div>

                <section>
                    <Card className="border shadow-sm">
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-semibold">Upcoming interviews</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Track every mock session across statuses.
                                </p>
                            </div>
                            <Badge variant="outline" className="rounded-full">
                                {sessions.length} scheduled
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sessions.map((session) => {
                                const tone = statusStyles[session.status] ?? statusStyles.scheduled;
                                const progress =
                                    session.questionLimit > 0
                                        ? Math.min(100, Math.round((session.questionsAsked / session.questionLimit) * 100))
                                        : 0;

                                return (
                                    <div
                                        key={session.id}
                                        className="rounded-3xl border bg-background/70 p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium">
                                                    {session.course?.name ?? 'Interview session'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {session.slot
                                                        ? `${formatDateTime(session.slot.startsAt)} · ${session.slot.timezone}`
                                                        : 'Slot confirmation pending'}
                                                </p>
                                            </div>
                                            <Badge className={cn('rounded-full', tone.className)}>{tone.label}</Badge>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                            <span>Credits debited: {session.creditsDebited || settings.creditCost}</span>
                                            <span>Question limit: {session.questionLimit}</span>
                                        </div>
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                                <span>
                                                    Progress · {session.questionsAsked}/{session.questionLimit}
                                                </span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        {session.feedbackSummary && (
                                            <p className="mt-3 text-sm text-muted-foreground">
                                                “{session.feedbackSummary}”
                                            </p>
                                        )}
                                        {session.status === 'completed' && !session.feedbackSummary ? (
                                            <p className="mt-3 text-sm text-muted-foreground">
                                                Feedback is being generated — check back shortly.
                                            </p>
                                        ) : null}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {['scheduled', 'ready'].includes(session.status) ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleStartInterview(session.id)}
                                                        disabled={roomLoading}
                                                        className='cursor-pointer'
                                                    >
                                                        Start interview
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className='cursor-pointer'
                                                        onClick={() => handleCancelSession(session.id)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            ) : null}
                                            {session.status === 'in_progress' ? (
                                                <>
                                                    <Button size="sm" onClick={() => handleStartInterview(session.id)}>
                                                        Rejoin
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleCompleteFromList(session.id)}
                                                    >
                                                        Complete
                                                    </Button>
                                                </>
                                            ) : null}
                                            {session.status === 'completed' ? (
                                                session.recordingUrl ? (
                                                    <Button size="sm" variant="outline" className="cursor-pointer" asChild>
                                                        <a href={session.recordingUrl} target="_blank" rel="noreferrer">
                                                            Get your recording <DownloadIcon />
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" disabled>
                                                        Recording processing
                                                    </Button>
                                                )
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                            {sessions.length === 0 && (
                                <div className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    You have not scheduled any interviews yet. Use the form on the right to lock one
                                    in.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="rounded-3xl border bg-gradient-to-r from-primary/5 via-background to-background p-6 shadow-lg">
                    <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary">Always-on library</p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                                Every interview recording + AI feedback stays accessible under “Your sessions”.
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                We ship one continuous, encrypted recording to your configured storage (DigitalOcean or local).
                                Switch disks anytime from the interview settings table.
                            </p>
                        </div>
                        {/* <Button
                            variant="outline"
                            className="rounded-full border-primary/40 bg-white/90 px-6 py-3 text-primary shadow-[0_16px_40px_rgba(59,130,246,0.25)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(59,130,246,0.3)]"
                        >
                            Coming soon: Watch recordings
                            <Zap className="h-4 w-4 text-primary" />
                        </Button> */}
                    </div>
                </section>
            </div>
            {roomOpen && roomSession ? (
                <div className="fixed inset-0 z-50 flex flex-col bg-[#030616] text-white">
                    <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">Now interviewing</p>
                            <p className="text-lg font-semibold">
                                {roomSession.course?.name ?? 'MBA Interview'} · {roomSession.questionsAsked}/
                                {roomSession.questionLimit} questions
                            </p>
                            <p className="text-xs text-white/60">
                                Slot {roomSession.slot?.startsAt ? formatDateTime(roomSession.slot.startsAt) : 'TBA'}
                            </p>
                        </div>
                        {/* <div className="flex flex-wrap gap-2">
                            <Button
                                variant="destructive"
                                onClick={() => handleCancelSession(roomSession.id)}
                                disabled={feedbackGenerating}
                            >
                                Cancel interview
                            </Button>
                        </div> */}
                    </div>
                    {roomError ? (
                        <div className="bg-rose-500/10 px-6 py-3 text-sm text-rose-100">{roomError}</div>
                    ) : null}
                    {cheatTriggered ? (
                        <div className="bg-rose-500/20 px-6 py-3 text-sm text-rose-100">
                            Interview cancelled because the browser tab lost focus.
                        </div>
                    ) : null}
                    <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
                        <div className="relative flex-1 bg-black min-h-[240px] sm:min-h-[320px]">
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="h-full w-full object-contain"
                            />
                            {permissionState !== 'granted' ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/80 text-center">
                                    <p className="text-lg font-semibold text-white">Allow camera & microphone</p>
                                    <p className="max-w-sm text-sm text-white/70">
                                        We need audio + video before the interview can begin. Click the button below and
                                        approve the browser prompt.
                                    </p>
                                    <Button
                                        onClick={ensureMediaPermissions}
                                        disabled={permissionState === 'pending'}
                                        className="rounded-full px-6"
                                    >
                                        {permissionState === 'pending' ? 'Requesting permission…' : 'Grant access'}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                        <div className="border-t border-white/10 bg-[#050b23] px-4 py-4 sm:px-6 lg:h-full lg:w-[420px] lg:border-l lg:border-t-0 lg:px-5 lg:py-6">
                            <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 lg:max-w-none">
                                <div className="flex-1 overflow-y-auto rounded-3xl bg-white/5 p-4 text-white shadow-xl shadow-black/30">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-white/60">
                                                Question {roomQuestion?.sequence ?? roomSession.questionsAsked + 1}/
                                                {roomSession.questionLimit}
                                            </p>
                                            <p className="text-lg font-semibold leading-relaxed">
                                                {roomQuestion?.question ?? 'Generating your first question...'}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="secondary"
                                                className="rounded-full"
                                                onClick={handleRepeatQuestion}
                                                disabled={!roomQuestion}
                                            >
                                                Speak question
                                            </Button>
                                        </div>
                                    </div>
                                    {/* <textarea
                                        className="mt-3 min-h-[90px] w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                                        placeholder="Add private notes about your response (optional)"
                                        value={answerNotes}
                                        onChange={(event) => setAnswerNotes(event.target.value)}
                                    /> */}
                                    {/* {recordingState === 'processing' ? (
                                        <p className="mt-2 flex items-center gap-2 text-xs text-white/70">
                                            <Upload className="h-3.5 w-3.5 animate-pulse" />
                                            Uploading answer… {uploadProgress}%
                                        </p>
                                    ) : (
                                        <p className="mt-2 text-xs text-white/70">
                                            Record at least {settings.minRecordingSeconds} seconds. Current: {recordingSeconds}s
                                        </p>
                                    )} */}
                                    {roomQuestion?.answeredAt ? (
                                        <p className="mt-1 text-xs text-emerald-300">
                                            Answer saved at {formatDateTime(roomQuestion.answeredAt)}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="flex flex-col gap-3 rounded-3xl bg-white/5 p-4 text-white shadow-xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-1 flex-wrap items-center gap-2 justify-between">
                                        {/* {controlToggles.repeatQuestion ? (
                                            <Button
                                                variant="ghost"
                                                className="rounded-full border border-white/20 text-white hover:bg-white/10"
                                                onClick={handleRepeatQuestion}
                                                disabled={!roomQuestion}
                                            >
                                                Repeat
                                            </Button>
                                        ) : null} */}
                                        {controlToggles.recordAnswer ? (
                                            <Button
                                                className={cn(
                                                    'rounded-full px-6',
                                                    recordingState === 'recording'
                                                        ? 'bg-rose-500 hover:bg-rose-500/90'
                                                        : 'bg-white text-slate-900 hover:bg-white/90',
                                                )}
                                                onClick={handleRecordToggle}
                                                disabled={
                                                    permissionState !== 'granted' ||
                                                    !roomQuestion ||
                                                    feedbackGenerating ||
                                                    recordingState === 'processing'
                                                }
                                            >
                                                {recordingState === 'recording'
                                                    ? `Stop & save (${recordingSeconds}s)`
                                                    : 'Record answer'}
                                            </Button>
                                        ) : (
                                            <Button
                                                className="rounded-full bg-white/80 px-6 text-slate-900"
                                                onClick={() => handleSubmitAnswer(settings.minRecordingSeconds)}
                                                disabled={
                                                    recordingState !== 'idle' ||
                                                    !roomQuestion ||
                                                    !!roomQuestion.answeredAt ||
                                                    feedbackGenerating
                                                }
                                            >
                                                Mark answered
                                            </Button>
                                        )}
                                        {controlToggles.nextButton ? (
                                            <Button
                                                variant="secondary"
                                                className="rounded-full px-6"
                                                onClick={handleNextQuestion}
                                                disabled={
                                                    !roomQuestion?.answeredAt ||
                                                    roomSession.questionsAsked >= roomSession.questionLimit ||
                                                    recordingState !== 'idle' ||
                                                    feedbackGenerating
                                                }
                                            >
                                                Next question
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 items-center justify-center">
                                    {/* <Button
                                            variant="outline"
                                            className="rounded-full border-white/30 text-white"
                                            onClick={handleCompleteSession}
                                            disabled={
                                                !roomQuestion?.answeredAt ||
                                                roomSession.questionsAsked < roomSession.questionLimit ||
                                                recordingState !== 'idle' ||
                                                feedbackGenerating
                                            }
                                        >
                                            Complete
                                        </Button> */}
                                    <Button
                                        variant="destructive"
                                        className="rounded-full"
                                        onClick={() => handleCancelSession(roomSession.id)}
                                        disabled={recordingState === 'processing'}
                                    >
                                        Cancel session
                                    </Button>
                                </div>
                                <div className="flex flex-wrap items-center justify-between text-xs text-white/70">
                                    <span>
                                        Status: <span className="font-semibold capitalize text-white">{roomSession.status}</span>
                                    </span>
                                    <span>
                                        Progress:{' '}
                                        <span className="font-semibold text-white">
                                            {roomSession.questionsAsked}/{roomSession.questionLimit}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </MarketingLayout>
    );
}
