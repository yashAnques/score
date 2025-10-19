export const isAdmin = (authEmail?: string): boolean => {
    if (!authEmail) {
        return false;
    }

    if (typeof window === 'undefined') {
        return false;
    }

    const emails = (window as any).__ADMIN_EMAILS__ as string[] | undefined;

    if (Array.isArray(emails) && emails.length > 0) {
        return emails.includes(authEmail);
    }

    const flag = (window as any).__IS_ADMIN__;

    if (typeof flag === 'boolean') {
        return flag;
    }

    return false;
};
