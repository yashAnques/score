import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface MarketingLink {
    label: string | null;
    text: string | null;
    url: string | null;
    meta?: Record<string, unknown> | null;
}

export interface MarketingLinksPayload {
    nav: MarketingLink[];
    whatsapp: MarketingLink | null;
    otp?: OtpSettings;
    navigationLayout?: 'horizontal' | 'vertical';
}

export interface OtpSettings {
    enabled: boolean;
    msg91_api_key: string;
    msg91_sender_id: string;
    msg91_template_id: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    marketingLinks?: MarketingLinksPayload;
    otpSettings?: OtpSettings;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    phone_number?: string | null;
    phone_verified_at?: string | null;
    avatar?: string;
    is_admin?: boolean;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
