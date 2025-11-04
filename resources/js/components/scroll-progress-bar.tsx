import { useEffect, useRef, useState } from 'react';

const getScrollProgress = () => {
    if (typeof window === 'undefined') {
        return 0;
    }

    const scrollingElement =
        document.scrollingElement ?? document.documentElement;
    const { scrollTop, scrollHeight, clientHeight } = scrollingElement;
    const scrollable = scrollHeight - clientHeight;

    if (scrollable <= 0) {
        return 0;
    }

    return (scrollTop / scrollable) * 100;
};

export function ScrollProgressBar() {
    const [progress, setProgress] = useState(0);
    const frame = useRef<number | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return () => undefined;
        }

        const handleScroll = () => {
            if (frame.current !== null) {
                return;
            }

            frame.current = window.requestAnimationFrame(() => {
                frame.current = null;
                setProgress(getScrollProgress());
            });
        };

        const handleResize = () => {
            setProgress(getScrollProgress());
        };

        handleResize();
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);

        return () => {
            if (frame.current !== null) {
                window.cancelAnimationFrame(frame.current);
            }
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div
            className="pointer-events-none fixed left-0 top-0 z-[60] w-full"
            aria-hidden="true"
        >
            <div
                className="h-2 rounded-r-full bg-yellow-400 transition-all duration-200"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
