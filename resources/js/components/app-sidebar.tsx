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
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const logoHref = catScoreCalculator();

    const navItems: NavItem[] = [];
    const navLabel = undefined;

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
