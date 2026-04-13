import { getToken, logout } from '../utils/token';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(
    /\/+$/,
    '',
);

const buildUrl = (path: string) =>
    `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const token = getToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Platform': 'web',
        'ngrok-skip-browser-warning': 'true',
    };

    // Add authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge with any additional headers from options (but don't override our defaults)
    if (options?.headers) {
        const optionHeaders = options.headers as Record<string, string>;
        Object.keys(optionHeaders).forEach((key) => {
            // Only add if not already set by us
            if (!headers[key.toLowerCase()]) {
                headers[key] = optionHeaders[key];
            }
        });
    }

    const res = await fetch(buildUrl(path), {
        ...options,
        headers,
        credentials: options?.credentials ?? 'include',
    });

    if (!res.ok) {
        const error = await res
            .json()
            .catch(() => ({ message: res.statusText }));
        const errorMessage =
            typeof error.message === 'string'
                ? error.message.toLowerCase()
                : '';

        if (
            res.status === 401 &&
            (errorMessage.includes('token has expired') ||
                errorMessage.includes('token expired') ||
                errorMessage.includes('invalid token signature'))
        ) {
            logout();
            throw new Error(
                'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
            );
        }

        throw new Error(error.message || 'API Error');
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
}

export const api = {
    get: <T>(path: string) => request<T>(path),

    post: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

    patch: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

    put: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
