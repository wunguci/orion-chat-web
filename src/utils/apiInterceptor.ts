/** eslint-disable */

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
                if (
                    data.message &&
                    data.message.includes('Phiên làm việc đã hết hạn !!!')
                ) {
                    console.warn('Session expired detected:', data.message);

                    throw new Error(data.message);
                }
            } catch (error) {
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
