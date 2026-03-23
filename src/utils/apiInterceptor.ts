/** eslint-disable */
import { handleSessionExpired } from './sessionValidator';

interface FetchOptions extends RequestInit {
    skipSessionCheck?: boolean;
}

/**
 * Enhanced fetch wrapper with automatic session validation
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

                // If it's session expired, handle logout
                if (
                    data.message &&
                    data.message.includes('Phiên làm việc đã hết hạn')
                ) {
                    console.warn(
                        '[API Interceptor] Session expired detected:',
                        data.message,
                    );
                    handleSessionExpired();
                    throw new Error(data.message);
                }
            } catch (error) {
                // If response is not JSON or other error, just return the response
                if (
                    error instanceof Error &&
                    error.message.includes('Phiên làm việc')
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

/**
 * Wrapper for common GET requests
 */
export function apiGet(url: string, options: FetchOptions = {}) {
    return apiFetch(url, {
        method: 'GET',
        ...options,
    });
}

/**
 * Wrapper for common POST requests
 */
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

/**
 * Wrapper for common PUT requests
 */
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

/**
 * Wrapper for common DELETE requests
 */
export function apiDelete(url: string, options: FetchOptions = {}) {
    return apiFetch(url, {
        method: 'DELETE',
        ...options,
    });
}
