import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { logout } from '@/routes';
import { edit as profileEdit } from '@/routes/profile';
import { edit as appearanceEdit } from '@/routes/appearance';
import { edit as passwordEdit } from '@/routes/password';
import { MarketingLinksPayload, SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import clsx from 'clsx';
import { Menu, X, MoveLeft } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';

type MarketingLayoutProps = {
    children: ReactNode;
};

type NavItem = {
    label: string;
    href: string;
    external?: boolean;
};

export default function MarketingLayout({ children }: MarketingLayoutProps) {
    const {
        props: { auth, marketingLinks },
        url,
    } = usePage<SharedData>();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const isAuthenticated = Boolean(auth?.user);
    const user = auth?.user ?? null;
    const getInitials = useInitials();

    const marketingLinksPayload = marketingLinks as MarketingLinksPayload | undefined;
    const navLinks = marketingLinksPayload?.nav ?? [];
    const processedNavLinks: NavItem[] = useMemo(() => {
        return [
            { label: 'CAT Score Calculator', href: '/cat-score-calculator' },
            { label: 'XAT Score Calculator', href: '/xat-score-calculator' },
        ];
    }, [navLinks]);

    const whatsappLink = marketingLinksPayload?.whatsapp ?? null;
    const whatsappUrl = whatsappLink?.url ?? 'https://wa.me/';
    const whatsappNumber = whatsappLink?.text ?? '+91 63032 39042';
    const whatsappCta = whatsappLink?.label ?? 'Join CAT WhatsApp Group';
    const whatsappSubtitle = (() => {
        if (whatsappLink?.meta && typeof whatsappLink.meta === 'object' && 'cta_subtitle' in whatsappLink.meta) {
            const subtitle = whatsappLink.meta.cta_subtitle;
            if (typeof subtitle === 'string') {
                return subtitle;
            }
        }

        return 'Join our official CAT WhatsApp group for daily updates.';
    })();

    const userMenuLinks = useMemo(
        () => [
            { label: 'Profile', href: profileEdit.url() },
            { label: 'Update Profile', href: profileEdit.url({ query: { view: 'update' } }) },
            { label: 'Settings', href: appearanceEdit.url() },
            { label: 'Security', href: passwordEdit.url() },
        ],
        [],
    );

    const navItems = useMemo(() => [...processedNavLinks], [processedNavLinks]);

    const renderNavLink = (item: NavItem, onClick?: () => void) => {
        const isActive =
            !item.external &&
            (item.href === '/'
                ? url === '/'
                : url === item.href || url.startsWith(`${item.href}/`));

        if (item.external || item.href.startsWith('http')) {
            return (
                <a
                    key={item.label}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className={clsx(
                        'px-3 py-2 text-sm font-medium transition-colors',
                        'text-muted-foreground hover:text-primary',
                    )}
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
                className={clsx(
                    'px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground hover:text-primary',
                )}
                onClick={onClick}
            >
                {item.label}
            </Link>
        );
    };

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="sticky top-0 z-40 bg-background shadow-sm shadow-border/40">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 cursor-pointer">
                        <a href="https://bschoolbuzz.in/">
                            <MoveLeft />
                        </a>
                        <Link href="/" className="flex items-center gap-2">
                            <AppLogo />
                        </Link>
                    </div>
                    <div className="hidden items-center gap-6 md:flex">
                        {/* <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                        >
                            <svg width="20" height="20" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>Whatsapp-color</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Color-" transform="translate(-700.000000, -360.000000)" fill="#67C15E"> <path d="M723.993033,360 C710.762252,360 700,370.765287 700,383.999801 C700,389.248451 701.692661,394.116025 704.570026,398.066947 L701.579605,406.983798 L710.804449,404.035539 C714.598605,406.546975 719.126434,408 724.006967,408 C737.237748,408 748,397.234315 748,384.000199 C748,370.765685 737.237748,360.000398 724.006967,360.000398 L723.993033,360.000398 L723.993033,360 Z M717.29285,372.190836 C716.827488,371.07628 716.474784,371.034071 715.769774,371.005401 C715.529728,370.991464 715.262214,370.977527 714.96564,370.977527 C714.04845,370.977527 713.089462,371.245514 712.511043,371.838033 C711.806033,372.557577 710.056843,374.23638 710.056843,377.679202 C710.056843,381.122023 712.567571,384.451756 712.905944,384.917648 C713.258648,385.382743 717.800808,392.55031 724.853297,395.471492 C730.368379,397.757149 732.00491,397.545307 733.260074,397.27732 C735.093658,396.882308 737.393002,395.527239 737.971421,393.891043 C738.54984,392.25405 738.54984,390.857171 738.380255,390.560912 C738.211068,390.264652 737.745308,390.095816 737.040298,389.742615 C736.335288,389.389811 732.90737,387.696673 732.25849,387.470894 C731.623543,387.231179 731.017259,387.315995 730.537963,387.99333 C729.860819,388.938653 729.198006,389.89831 728.661785,390.476494 C728.238619,390.928051 727.547144,390.984595 726.969123,390.744481 C726.193254,390.420348 724.021298,389.657798 721.340985,387.273388 C719.267356,385.42535 717.856938,383.125756 717.448104,382.434484 C717.038871,381.729275 717.405907,381.319529 717.729948,380.938852 C718.082653,380.501232 718.421026,380.191036 718.77373,379.781688 C719.126434,379.372738 719.323884,379.160897 719.549599,378.681068 C719.789645,378.215575 719.62006,377.735746 719.450874,377.382942 C719.281687,377.030139 717.871269,373.587317 717.29285,372.190836 Z" id="Whatsapp"> </path> </g> </g> </g></svg>
                            {whatsappNumber}
                        </a> */}
                        {isAuthenticated && user ? (
                            <DropdownMenu>
                                {/* <DropdownMenuTrigger asChild> */}
                                <a href="http://bschoolbuzz.in/profile">
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 rounded-full text-sm font-semibold text-white transition hover:bg-transparent focus:outline-none transform-gpu duration-150 ease-out active:scale-95 hover:scale-[1.05] cursor-pointer"
                                        aria-label="Account menu"
                                    >
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.avatar} alt={user.name} />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {getInitials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="hidden text-sm font-semibold md:inline text-primary border-b-[2px] border-teal-900 dark:border-white/40">
                                            {user.name.split(' ')[0]}
                                        </span>
                                    </button>
                                </a>
                                {/* </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    <UserMenuContent user={user} />
                                </DropdownMenuContent> */}
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-3">
                                <>
                                    <a
                                        href={"https://bschoolbuzz.in/login?redirect_to=" + encodeURIComponent(window.location.href)}
                                        className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary w-full"
                                        onClick={() => setMobileNavOpen(false)}
                                    >
                                        Sign in
                                    </a>
                                    <Button
                                        asChild
                                        size="sm"
                                        className="w-full rounded-full"
                                    >
                                        <a
                                            href={"https://bschoolbuzz.in/signup?redirect_to=" + encodeURIComponent(window.location.href)}
                                            onClick={() => setMobileNavOpen(false)}
                                        >
                                            Get Started
                                        </a>
                                    </Button>
                                </>
                            </div>
                        )}
                        <AppearanceToggleDropdown />
                    </div>
                    <div className="flex items-center gap-2 md:hidden">
                        {/* <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                        >
                            <svg width="20" height="20" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>Whatsapp-color</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Color-" transform="translate(-700.000000, -360.000000)" fill="#67C15E"> <path d="M723.993033,360 C710.762252,360 700,370.765287 700,383.999801 C700,389.248451 701.692661,394.116025 704.570026,398.066947 L701.579605,406.983798 L710.804449,404.035539 C714.598605,406.546975 719.126434,408 724.006967,408 C737.237748,408 748,397.234315 748,384.000199 C748,370.765685 737.237748,360.000398 724.006967,360.000398 L723.993033,360.000398 L723.993033,360 Z M717.29285,372.190836 C716.827488,371.07628 716.474784,371.034071 715.769774,371.005401 C715.529728,370.991464 715.262214,370.977527 714.96564,370.977527 C714.04845,370.977527 713.089462,371.245514 712.511043,371.838033 C711.806033,372.557577 710.056843,374.23638 710.056843,377.679202 C710.056843,381.122023 712.567571,384.451756 712.905944,384.917648 C713.258648,385.382743 717.800808,392.55031 724.853297,395.471492 C730.368379,397.757149 732.00491,397.545307 733.260074,397.27732 C735.093658,396.882308 737.393002,395.527239 737.971421,393.891043 C738.54984,392.25405 738.54984,390.857171 738.380255,390.560912 C738.211068,390.264652 737.745308,390.095816 737.040298,389.742615 C736.335288,389.389811 732.90737,387.696673 732.25849,387.470894 C731.623543,387.231179 731.017259,387.315995 730.537963,387.99333 C729.860819,388.938653 729.198006,389.89831 728.661785,390.476494 C728.238619,390.928051 727.547144,390.984595 726.969123,390.744481 C726.193254,390.420348 724.021298,389.657798 721.340985,387.273388 C719.267356,385.42535 717.856938,383.125756 717.448104,382.434484 C717.038871,381.729275 717.405907,381.319529 717.729948,380.938852 C718.082653,380.501232 718.421026,380.191036 718.77373,379.781688 C719.126434,379.372738 719.323884,379.160897 719.549599,378.681068 C719.789645,378.215575 719.62006,377.735746 719.450874,377.382942 C719.281687,377.030139 717.871269,373.587317 717.29285,372.190836 Z" id="Whatsapp"> </path> </g> </g> </g></svg>
                        </a> */}
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
                            <div className="mt-4 space-y-3">
                                {isAuthenticated && user ? (
                                    <div className="space-y-3 rounded-xl border border-border/60 bg-background/80 p-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="text-sm">
                                                <p className="font-semibold text-foreground">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {userMenuLinks.map((item) => (
                                                <Link
                                                    key={item.label}
                                                    href={item.href}
                                                    className="rounded-md px-2 py-1 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                                                    onClick={() =>
                                                        setMobileNavOpen(false)
                                                    }
                                                >
                                                    {item.label}
                                                </Link>
                                            ))}
                                            <button
                                                type="button"
                                                className="rounded-md px-2 py-1 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                                                onClick={() => {
                                                    setMobileNavOpen(false);
                                                    router.post(logout.url());
                                                }}
                                            >
                                                Log out
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Button
                                            asChild
                                            size="sm"
                                            className="w-full rounded-full"
                                        >
                                            <a
                                                href="https://bschoolbuzz.in/login"
                                                onClick={() => setMobileNavOpen(false)}
                                            >
                                                Sign in
                                            </a>
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm"
                                            className="w-full rounded-full bg-transparent border border-primary hover:bg-primary/10 text-primary"
                                        >
                                            <a
                                                href="https://bschoolbuzz.in/signup"
                                                onClick={() => setMobileNavOpen(false)}
                                            >
                                                Get Started
                                            </a>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </header>
            <AnnouncementBar
                whatsappUrl={whatsappUrl}
                whatsappSubtitle={whatsappSubtitle}
                whatsappCta={whatsappCta}
            />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border/60 bg-muted/40">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
                    <div>&copy; {new Date().getFullYear()} <a href="http://bschoolbuzz.in">Bschoolbuzz.in</a> All rights reserved.</div>
                    <div className="flex items-center gap-6">
                        {/* <a
                            href="mailto:support@example.com"
                            className="transition-colors hover:text-primary"
                        >
                            support@example.com
                        </a> */}
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 transition-colors hover:text-primary"
                        >
                            <svg width="20" height="20" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>Whatsapp-color</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Color-" transform="translate(-700.000000, -360.000000)" fill="#67C15E"> <path d="M723.993033,360 C710.762252,360 700,370.765287 700,383.999801 C700,389.248451 701.692661,394.116025 704.570026,398.066947 L701.579605,406.983798 L710.804449,404.035539 C714.598605,406.546975 719.126434,408 724.006967,408 C737.237748,408 748,397.234315 748,384.000199 C748,370.765685 737.237748,360.000398 724.006967,360.000398 L723.993033,360.000398 L723.993033,360 Z M717.29285,372.190836 C716.827488,371.07628 716.474784,371.034071 715.769774,371.005401 C715.529728,370.991464 715.262214,370.977527 714.96564,370.977527 C714.04845,370.977527 713.089462,371.245514 712.511043,371.838033 C711.806033,372.557577 710.056843,374.23638 710.056843,377.679202 C710.056843,381.122023 712.567571,384.451756 712.905944,384.917648 C713.258648,385.382743 717.800808,392.55031 724.853297,395.471492 C730.368379,397.757149 732.00491,397.545307 733.260074,397.27732 C735.093658,396.882308 737.393002,395.527239 737.971421,393.891043 C738.54984,392.25405 738.54984,390.857171 738.380255,390.560912 C738.211068,390.264652 737.745308,390.095816 737.040298,389.742615 C736.335288,389.389811 732.90737,387.696673 732.25849,387.470894 C731.623543,387.231179 731.017259,387.315995 730.537963,387.99333 C729.860819,388.938653 729.198006,389.89831 728.661785,390.476494 C728.238619,390.928051 727.547144,390.984595 726.969123,390.744481 C726.193254,390.420348 724.021298,389.657798 721.340985,387.273388 C719.267356,385.42535 717.856938,383.125756 717.448104,382.434484 C717.038871,381.729275 717.405907,381.319529 717.729948,380.938852 C718.082653,380.501232 718.421026,380.191036 718.77373,379.781688 C719.126434,379.372738 719.323884,379.160897 719.549599,378.681068 C719.789645,378.215575 719.62006,377.735746 719.450874,377.382942 C719.281687,377.030139 717.871269,373.587317 717.29285,372.190836 Z" id="Whatsapp"> </path> </g> </g> </g></svg>
                            Join our WhatsApp Group
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

type AnnouncementBarProps = {
    whatsappUrl: string;
    whatsappSubtitle: string;
    whatsappCta: string;
};

function AnnouncementBar({ whatsappUrl, whatsappSubtitle, whatsappCta }: AnnouncementBarProps) {
    return (
        <div className="border-b border-border/60 bg-primary/5">
            <div className="mx-auto flex h-10 w-full max-w-6xl items-center justify-center gap-2 px-4 py-6 text-sm font-medium sm:px-6 lg:px-8">
                <span className="hidden text-muted-foreground md:inline">{whatsappSubtitle}</span>
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    <svg width="18" height="18" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>Whatsapp-color</title> <desc>Created with Sketch.</desc> <defs> </defs> <g id="Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Color-" transform="translate(-700.000000, -360.000000)" fill="#67C15E"> <path d="M723.993033,360 C710.762252,360 700,370.765287 700,383.999801 C700,389.248451 701.692661,394.116025 704.570026,398.066947 L701.579605,406.983798 L710.804449,404.035539 C714.598605,406.546975 719.126434,408 724.006967,408 C737.237748,408 748,397.234315 748,384.000199 C748,370.765685 737.237748,360.000398 724.006967,360.000398 L723.993033,360.000398 L723.993033,360 Z M717.29285,372.190836 C716.827488,371.07628 716.474784,371.034071 715.769774,371.005401 C715.529728,370.991464 715.262214,370.977527 714.96564,370.977527 C714.04845,370.977527 713.089462,371.245514 712.511043,371.838033 C711.806033,372.557577 710.056843,374.23638 710.056843,377.679202 C710.056843,381.122023 712.567571,384.451756 712.905944,384.917648 C713.258648,385.382743 717.800808,392.55031 724.853297,395.471492 C730.368379,397.757149 732.00491,397.545307 733.260074,397.27732 C735.093658,396.882308 737.393002,395.527239 737.971421,393.891043 C738.54984,392.25405 738.54984,390.857171 738.380255,390.560912 C738.211068,390.264652 737.745308,390.095816 737.040298,389.742615 C736.335288,389.389811 732.90737,387.696673 732.25849,387.470894 C731.623543,387.231179 731.017259,387.315995 730.537963,387.99333 C729.860819,388.938653 729.198006,389.89831 728.661785,390.476494 C728.238619,390.928051 727.547144,390.984595 726.969123,390.744481 C726.193254,390.420348 724.021298,389.657798 721.340985,387.273388 C719.267356,385.42535 717.856938,383.125756 717.448104,382.434484 C717.038871,381.729275 717.405907,381.319529 717.729948,380.938852 C718.082653,380.501232 718.421026,380.191036 718.77373,379.781688 C719.126434,379.372738 719.323884,379.160897 719.549599,378.681068 C719.789645,378.215575 719.62006,377.735746 719.450874,377.382942 C719.281687,377.030139 717.871269,373.587317 717.29285,372.190836 Z" id="Whatsapp"> </path> </g> </g> </g></svg>
                    {whatsappCta}
                </a>
            </div>
        </div>
    );
}
