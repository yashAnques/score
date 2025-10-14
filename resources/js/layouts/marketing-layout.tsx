import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { MessageCircle, Menu, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';

const WHATSAPP_NUMBER = '+91 63032 39042';
const WHATSAPP_LINK =
    'https://wa.me/916303239042?text=Hi%2C%20I%20have%20visited%20Cracku%20website%2C%20wanted%20to%20know%20about%20more%20courses';

type MarketingLayoutProps = {
    children: ReactNode;
};

type NavItem = {
    label: string;
    href: string;
    external?: boolean;
};

const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'CAT Score Calculator', href: '/cat-score-calculator' },
    { label: 'CAT 2025 Prep', href: '/cat-score-calculator#prep' },
    { label: 'Mock Tests', href: '/cat-score-calculator#mock-tests' },
    { label: 'Results', href: '/cat-score-calculator#results' },
    { label: 'FAQs', href: '/cat-score-calculator#faq' },
];

export default function MarketingLayout({ children }: MarketingLayoutProps) {
    const {
        props: { auth },
    } = usePage<SharedData>();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const isAuthenticated = Boolean(auth?.user);

    const renderNavLink = (item: NavItem, onClick?: () => void) => {
        if (item.external || item.href.startsWith('http')) {
            return (
                <a
                    key={item.label}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    onClick={onClick}
                >
                    {item.label}
                </a>
            );
        }

        return (
            <Link
                key={item.label}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                onClick={onClick}
            >
                {item.label}
            </Link>
        );
    };

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="sticky top-0 z-40 bg-background/95 shadow-sm shadow-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <AppLogo />
                        </Link>
                    </div>
                    <div className="hidden items-center gap-6 md:flex">
                        <a
                            href={WHATSAPP_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                        >
                            <MessageCircle className="h-4 w-4" />
                            {WHATSAPP_NUMBER}
                        </a>
                        {isAuthenticated ? (
                            <Link
                                href="/dashboard"
                                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
                            >
                                Go to dashboard
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/login"
                                    className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
                                >
                                    Sign in
                                </Link>
                                <Button asChild size="sm" className="rounded-full">
                                    <Link href="/register">Get Started</Link>
                                </Button>
                            </div>
                        )}
                        <AppearanceToggleDropdown />
                    </div>
                    <div className="flex items-center gap-2 md:hidden">
                        <a
                            href={WHATSAPP_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                        >
                            <MessageCircle className="h-4 w-4" />
                        </a>
                        <AppearanceToggleDropdown />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-md"
                            onClick={() => setMobileNavOpen((open) => !open)}
                            aria-label="Toggle navigation"
                        >
                            {mobileNavOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>
                <div className="border-t border-border/60 bg-background/80">
                    <div className="mx-auto hidden h-12 w-full max-w-6xl items-center px-4 sm:px-6 md:flex lg:px-8">
                        <nav className="flex w-full items-center justify-start gap-2">
                            {navItems.map((item) => renderNavLink(item))}
                        </nav>
                    </div>
                </div>
                {mobileNavOpen && (
                    <div className="border-t border-border/70 bg-background/95 px-4 py-4 md:hidden">
                        <nav className="flex flex-col gap-2">
                            {navItems.map((item) =>
                                renderNavLink(item, () =>
                                    setMobileNavOpen(false),
                                ),
                            )}
                            <div className="mt-2 flex items-center gap-3">
                                {isAuthenticated ? (
                                    <Link
                                        href="/dashboard"
                                        className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
                                        onClick={() => setMobileNavOpen(false)}
                                    >
                                        Go to dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
                                            onClick={() =>
                                                setMobileNavOpen(false)
                                            }
                                        >
                                            Sign in
                                        </Link>
                                        <Button
                                            asChild
                                            size="sm"
                                            className="w-full rounded-full"
                                        >
                                            <Link
                                                href="/register"
                                                onClick={() =>
                                                    setMobileNavOpen(false)
                                                }
                                            >
                                                Get Started
                                            </Link>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </header>
            <AnnouncementBar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border/60 bg-muted/40">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
                    <div>&copy; {new Date().getFullYear()} Cracku Clone. All rights reserved.</div>
                    <div className="flex items-center gap-6">
                        <a
                            href="mailto:support@example.com"
                            className="transition-colors hover:text-primary"
                        >
                            support@example.com
                        </a>
                        <a
                            href={WHATSAPP_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 transition-colors hover:text-primary"
                        >
                            <MessageCircle className="h-4 w-4" />
                            {WHATSAPP_NUMBER}
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function AnnouncementBar() {
    return (
        <div className="border-b border-border/60 bg-primary/5">
            <div className="mx-auto flex h-10 w-full max-w-6xl items-center justify-center gap-2 px-4 text-sm font-medium sm:px-6 lg:px-8">
                <span className="hidden text-muted-foreground md:inline">
                    Join our official CAT WhatsApp group for daily updates.
                </span>
                <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    <MessageCircle className="h-4 w-4" />
                    Join CAT WhatsApp Group
                </a>
            </div>
        </div>
    );
}
