export const BSCHOOL_BASE_URL = import.meta.env.VITE_BSCHOOL_BASE_URL ?? 'https://bschoolbuzz.in';

export const buildBschoolUrl = (path = ''): string => {
    if (!path) {
        return BSCHOOL_BASE_URL;
    }
    if (path.startsWith('http')) {
        return path;
    }
    const base = BSCHOOL_BASE_URL.endsWith('/') ? BSCHOOL_BASE_URL.slice(0, -1) : BSCHOOL_BASE_URL;
    const suffix = path.startsWith('/') ? path : `/${path}`;
    return `${base}${suffix}`;
};
