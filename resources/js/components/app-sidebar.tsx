import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { scoreCalculator as catScoreCalculator } from '@/routes/cat';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const page = usePage<SharedData>();
    const logoHref = catScoreCalculator();
    const url = page.url ?? '';
    const authUser = page.props?.auth?.user;
    const isAdminUser = Boolean(authUser?.is_admin);

    let navItems: NavItem[] = [];
    let navLabel: string | undefined;

    if (isAdminUser) {
        navItems = [
            {
                title: 'Overview',
                href: '/admin/overview',
                icon: LayoutGrid,
            },
        ];
        navLabel = 'Admin';
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={logoHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} label={navLabel} />
            </SidebarContent>

            <SidebarFooter> 
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
