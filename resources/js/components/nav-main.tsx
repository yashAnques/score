import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

type NavMainProps = {
    items?: NavItem[];
    label?: string;
};

const resolveHref = (href: NavItem['href']) =>
    typeof href === 'string' ? href : href.url;

const buildStartsWith = (path: string) => {
    if (path.endsWith('/')) {
        return path;
    }

    return `${path}/`;
};

const isQueryMatch = (targetSearch: string, currentSearch: string) => {
    const targetParams = new URLSearchParams(targetSearch);
    const currentParams = new URLSearchParams(currentSearch);

    if ([...targetParams.keys()].length === 0) {
        return [...currentParams.keys()].length === 0;
    }

    for (const [key, value] of targetParams.entries()) {
        if (currentParams.get(key) !== value) {
            return false;
        }
    }

    return true;
};

export function NavMain({ items = [], label = 'Platform' }: NavMainProps) {
    const page = usePage();
    const [currentPath, currentSearch = ''] = page.url.split('?');

    return (
        <SidebarGroup className="px-2 py-0">
            {label !== undefined && items.length > 0 && (
                <SidebarGroupLabel>{label}</SidebarGroupLabel>
            )}
            <SidebarMenu>
                {items.map((item) => {
                    const target = resolveHref(item.href);
                    const [targetPath, targetSearch = ''] = target.split('?');

                    let isActive = false;

                    if (targetSearch.length > 0) {
                        isActive =
                            currentPath === targetPath &&
                            isQueryMatch(targetSearch, currentSearch);
                    } else if (targetPath === '/') {
                        isActive = currentPath === '/';
                    } else {
                        isActive =
                            currentPath === targetPath ||
                            currentPath.startsWith(
                                buildStartsWith(targetPath),
                            );
                    }

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
