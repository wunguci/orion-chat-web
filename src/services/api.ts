import { getToken } from '../utils/token';

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
    };

    // thêm xác thực nếu token tồn tại
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // gộp các header tùy chọn
    if (options?.headers) {
        const optionHeaders = options.headers as Record<string, string>;
        Object.keys(optionHeaders).forEach((key) => {
            // chỉ thêm nếu chưa được thiết lập bởi chúng tôi
            if (!headers[key.toLowerCase()]) {
                headers[key] = optionHeaders[key];
            }
        });
    }

    try {
        const res = await fetch(buildUrl(path), {
            ...options,
            headers,
        });

        if (!res.ok) {
            const error = await res
                .json()
                .catch(() => ({ message: res.statusText }));
            const errorMessage =
                typeof error.message === 'string'
                    ? error.message.toLowerCase()
                    : '';

            // Kiểm tra nếu là lỗi xung đột phiên
            if (res.status === 401) {
                const isSessionMismatch =
                    errorMessage.includes('đã đăng nhập ở nơi khác') ||
                    errorMessage.includes('hoặc bạn đã đăng nhập') ||
                    errorMessage.includes('web khác') ||
                    errorMessage.includes('mobile khác');

                const isTokenExpired =
                    errorMessage.includes('token has expired') ||
                    errorMessage.includes('token expired') ||
                    errorMessage.includes('invalid token signature');

                console.log('[API] 401 Check:', {
                    isSessionMismatch,
                    isTokenExpired,
                    errorMessage,
                });

                if (isSessionMismatch) {
                    console.warn(
                        '[API] Session mismatch detected:',
                        errorMessage,
                    );
                    // Don't alert/logout here - let useTokenExpiry handle it
                    throw new Error(`Session mismatch: ${errorMessage}`);
                } else if (isTokenExpired) {
                    console.warn('Token hết hạn:', errorMessage);
                    // Don't logout here - let useTokenExpiry handle it
                    throw new Error(
                        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                    );
                }
            }

            throw new Error(error.message || 'API Error');
        }

        const text = await res.text();
        return text ? JSON.parse(text) : ({} as T);
    } catch (err) {
        console.error('Request API failed:', err);
        throw err;
    }
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
