/**
 * Route paths constants - Giúp tránh typo và dễ refactor
 */
export const ROUTES = {
    HOME: '/',
    AUTH: {
        ROOT: '/auth',
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        FORGOT_PASSWORD: '/auth/forgot-password',
    },
    CHAT: {
        ROOT: '/chat',
        GROUP: '/chat/group',
        CONTACTS: '/chat/contacts',
        CONVERSATION: (id: string) => `/chat/conversation/${id}`,
    },
    NOTE: '/notes',
    SETTINGS: '/settings',
    PROFILE: '/profile',
    NOT_FOUND: '*',
};

/**
 * Route metadata - Dùng cho breadcrumb, title, permissions
 */
export type RouteMetadata = {
    title?: string;
    requireAuth?: boolean;
    roles: string[];
};
