/** eslint-disable */
import { handleSessionExpired } from './sessionValidator';

interface FetchOptions extends RequestInit {
    skipSessionCheck?: boolean;
}

/**
 * xác thực phiên tự động
 */
export async function apiFetch(
    url: string,
    options: FetchOptions = {},
): Promise<Response> {
    const { skipSessionCheck = false, ...fetchOptions } = options;

    try {
        const response = await fetch(url, fetchOptions);

        if (response.status === 401 && !skipSessionCheck) {
            try {
                const data = await response.clone().json();

                // nếu phiên làm việc đã hết hạn
                if (data.message) {
                    const messageText = String(data.message);
                    const isExpired = messageText.includes('hết hạn') || messageText.toLowerCase().includes('expired');
                    const isInactive = messageText.includes('không hoạt động') || messageText.toLowerCase().includes('inactivity') || messageText.toLowerCase().includes('inactive');
                    const isOtherLogin =
                        messageText.includes('đăng nhập') ||
                        messageText.includes('thiết bị') ||
                        messageText.toLowerCase().includes('logged in') ||
                        messageText.toLowerCase().includes('device') ||
                        messageText.toLowerCase().includes('conflict');

                    if (isExpired || isInactive || isOtherLogin) {
                        console.warn(
                            '[API Interceptor] Session expired detected:',
                            messageText,
                        );

                        void handleSessionExpired(
                            `Your session has expired or has been replaced.\n\n${messageText}\n\nPlease log in again.`,
                        );

                        throw new Error(messageText);
                    }
                }
            } catch (error) {
                if (
                    error instanceof Error &&
                    (error.message.includes('Phiên làm việc') ||
                     error.message.toLowerCase().includes('session'))
                ) {
                    throw error;
                }
            }
        }

        return response;
    } catch (error) {
        console.error('[API Interceptor] Fetch error:', error);
        throw error;
    }
}

// GET request wrapper
export function apiGet(url: string, options: FetchOptions = {}) {
    return apiFetch(url, {
        method: 'GET',
        ...options,
    });
}

// POST request wrapper
export function apiPost(
    url: string,
    body?: unknown,
    options: FetchOptions = {},
) {
    return apiFetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...options,
    });
}

// PUT request wrapper
export function apiPut(
    url: string,
    body?: unknown,
    options: FetchOptions = {},
) {
    return apiFetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...options,
    });
}

// DELETE request wrapper
export function apiDelete(url: string, options: FetchOptions = {}) {
    return apiFetch(url, {
        method: 'DELETE',
        ...options,
    });
}
