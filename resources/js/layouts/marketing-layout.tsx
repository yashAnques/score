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
import { Menu, X, MoveLeft, User, UserPlus, CircleUserRound } from 'lucide-react';
import { ScrollProgressBar } from '@/components/scroll-progress-bar';
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
            <ScrollProgressBar />
            <header className="sticky top-0 z-40 bg-background shadow-sm shadow-border/40">
                <div className="flex h-20 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 cursor-pointer">
                        <a href="https://bschoolbuzz.in/">
                            <MoveLeft />
                        </a>
                        <a href="https://bschoolbuzz.in/" className="flex items-center gap-2">
                            <AppLogo />
                        </a>
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
                            <div className="flex items-center gap-6">
                                <a
                                    href={"https://bschoolbuzz.in/login?redirect_to=" + encodeURIComponent(window.location.href)}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#14224f] transition-colors hover:text-[#0d1740] dark:text-white dark:hover:text-yellow-300"
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 fill-[#14224f] transition-colors dark:fill-white"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm10-6a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5.112 9.997c.758.488.721 1.552.031 2.132-1.39 1.168-3.184 1.872-5.142 1.872-1.945 0-3.728-.694-5.114-1.848a1 1 0 0 1 .972-1.54C8.815 15.145 10.254 15 12 15c1.755 0 3.202.136 4.331.595a3 3 0 0 1 .781.402Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    Login
                                </a>
                                <a
                                    href={"https://bschoolbuzz.in/signup?redirect_to=" + encodeURIComponent(window.location.href)}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#14224f] transition-colors hover:text-[#0d1740] dark:text-white dark:hover:text-yellow-300"
                                >
                                    <svg
                                        width="26"
                                        height="26"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 fill-[#172554] transition-colors dark:fill-white"
                                    >
                                        <path d="M4.5 8.552c0 1.995 1.505 3.5 3.5 3.5s3.5-1.505 3.5-3.5-1.505-3.5-3.5-3.5-3.5 1.505-3.5 3.5zM19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3zM4 19h10v-1c0-2.757-2.243-5-5-5H7c-2.757 0-5 2.243-5 5v1h2z" fill="currentColor" />
                                    </svg>
                                    Signup
                                </a>
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
                                    <div className="flex flex-col gap-2">
                                        <a
                                            href={"https://bschoolbuzz.in/login?redirect_to=" + encodeURIComponent(window.location.href)}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#14224f]/20 px-4 py-2 text-sm font-semibold text-[#14224f] transition-colors hover:border-[#0d1740]/40 hover:text-[#0d1740]"
                                            onClick={() => setMobileNavOpen(false)}
                                        >
                                            <User className="h-4 w-4" />
                                            Login
                                        </a>
                                        <a
                                            href={"https://bschoolbuzz.in/signup?redirect_to=" + encodeURIComponent(window.location.href)}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#14224f]/20 px-4 py-2 text-sm font-semibold text-[#14224f] transition-colors hover:border-[#0d1740]/40 hover:text-[#0d1740]"
                                            onClick={() => setMobileNavOpen(false)}
                                        >
                                            <UserPlus className="h-4 w-4" />
                                            Signup
                                        </a>
                                    </div>
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
            <footer className="relative bg-gray-900 text-white border-t border-gray-700">
                <div className="mx-auto max-w-screen-xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-md">
                        <h2 className="w-full text-center text-4xl font-bold md:text-7xl">
                            <span className="text-white">BSchool</span>
                            <span className="text-yellow-400">Buzz</span>
                        </h2>

                        <form className="mt-6" action="https://bschoolbuzz.in/newsletter" method="post">
                            <input type="hidden" name="_token" value="" autoComplete="off" />
                        </form>
                    </div>

                    <div className="mt-16 grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-16">
                        <div className="mx-auto max-w-sm lg:max-w-none">
                            <p className="mt-4 text-center text-base text-gray-400 lg:text-left lg:text-lg">
                                B School Buzz is a student-driven ed-tech startup founded with a vision to empower the next
                                generation of leaders by helping them make informed and confident career decisions.
                            </p>

                            <div className="mt-6 flex justify-center gap-4 lg:justify-start">
                                <a
                                    className="text-white transition hover:text-yellow-400"
                                    href="https://www.instagram.com/bschoolbuzz.in/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="fa-brands fa-instagram text-2xl transition-all duration-300 hover:scale-105" />
                                </a>
                                <a
                                    className="text-white transition hover:text-yellow-400"
                                    href="https://www.whatsapp.com/channel/0029VbAfktQGk1FpVZFPKX1j"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="fa-brands fa-whatsapp text-2xl transition-all duration-300 hover:scale-105" />
                                </a>
                                <a
                                    className="text-white transition hover:text-yellow-400"
                                    href="https://www.youtube.com/@bschoolbuzz"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="fa-brands fa-youtube text-2xl transition-all duration-300 hover:scale-105" />
                                </a>
                                <a
                                    className="text-white transition hover:text-yellow-400"
                                    href="https://www.facebook.com/people/Bschool-Buzz/pfbid0252Rq2ZdqsJhiok6PnyKbbmNWbNe3NFeBP1pLZk43fFWZcj4kUWgrVGxE6DnCtGuHl/?rdid=cWjQKbZRhZ7xUw8s&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1CK8R9TCVS%2F"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="fa-brands fa-facebook text-2xl transition-all duration-300 hover:scale-105" />
                                </a>
                                <a
                                    className="text-white transition hover:text-yellow-400"
                                    href="https://www.quora.com/profile/B-School-Buzz"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="fa-brands fa-quora text-2xl transition-all duration-300 hover:scale-105" />
                                </a>
                            </div>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-2 text-center lg:grid-cols-2 lg:text-left">
                            <div>
                                <strong className="text-xl font-bold text-white"> Quick Links </strong>

                                <ul className="mt-6 space-y-1">
                                    <li>
                                        <a
                                            className="text-white transition hover:text-yellow-400"
                                            href="https://bschoolbuzz.in"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Home
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className="text-white transition hover:text-yellow-400"
                                            href="https://bschoolbuzz.in/blogs"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Blogs
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className="text-white transition hover:text-yellow-400"
                                            href="https://bschoolbuzz.in/about-us"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            About Us
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className="text-white transition hover:text-yellow-400"
                                            href="https://bschoolbuzz.in/contact-us"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Contact Us
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className="text-white transition hover:text-yellow-400"
                                            href="https://bschoolbuzz.in/terms-and-conditions"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Terms &amp; Conditions
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <strong className="text-xl font-bold text-white"> Get in Touch </strong>

                                <ul className="mt-6 space-y-1">
                                    <li>
                                        <a
                                            className="text-lg font-semibold text-yellow-400"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            href="mailto:admin@bschoolbuzz.in"
                                        >
                                            Email :{' '}
                                            <span className="text-sm font-normal text-white">
                                                admin@bschoolbuzz.in
                                            </span>
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            className="text-lg font-semibold text-yellow-400"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            href="tel:+919045899102"
                                        >
                                            Phone :{' '}
                                            <span className="text-sm font-normal text-white">
                                                +91 9045899102
                                            </span>
                                        </a>
                                    </li>
                                    <li>
                                        <span className="text-lg font-semibold text-yellow-400">
                                            Address :{' '}
                                            <span className="text-sm font-normal text-white">
                                                Sector 1, Expressway Green, IMT Manesar M2, Haryana, India
                                            </span>
                                        </span>
                                    </li>
                                    <li>
                                        <span className="text-lg font-semibold text-yellow-400">
                                            Pin Code :{' '}
                                            <span className="text-sm font-normal text-white">
                                                122052
                                            </span>
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 border-t border-gray-800 pt-8">
                        <p className="text-center text-xs text-gray-400">
                            © BSchoolBuzz {new Date().getFullYear()}. All rights reserved.
                        </p>
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
