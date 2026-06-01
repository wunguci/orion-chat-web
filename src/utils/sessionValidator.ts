import { getToken } from '../utils/token';
import { logout as logoutApi } from '../services/authService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface CheckSessionResponse {
    isValid: boolean;
    message?: string;
}

export async function checkSessionValidity(): Promise<CheckSessionResponse> {
    try {
        const token = getToken();

        if (!token) {
            return {
                isValid: false,
                message: 'Token not found',
            };
        }

        const response = await fetch(`${API_BASE}/auth/verify-token`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'X-Platform': 'web',
            },
        });

        if (response.status === 401) {
            const data = await response.json();
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
                    const reason = isInactive
                        ? 'due to inactivity'
                        : isOtherLogin
                          ? 'due to login from another device'
                          : 'due to session expiration';

                    return {
                        isValid: false,
                        message: `Your session has expired ${reason}.`,
                    };
                }
            }
        }

        return {
            isValid: response.ok,
            message: response.ok ? 'Session valid' : 'Session invalid',
        };
    } catch (error) {
        console.error('[Session Check] Error:', error);
        return {
            isValid: false,
            message: 'Error verifying session',
        };
    }
}

export async function handleSessionExpired(
    message?: string,
    showAlert: boolean = true,
): Promise<void> {
    console.log('[Session] Handling expired session...');

    // Show mandatory alert - only OK button, user MUST click OK
    if (showAlert) {
        alert(
            message ||
                'Your session has expired.\n\nPlease log in again.',
        );
    }

    try {
        const token = getToken();
        if (token) {
            try {
                await logoutApi(token);
                console.log('[Session] Backend logout successful');
            } catch (error) {
                console.warn('[Session] Backend logout failed:', error);
            }
        }
    } catch (error) {
        console.error('[Session] Error during logout:', error);
    }

    // Clear all auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_session_id');
    localStorage.removeItem('auth_device_id');
    localStorage.removeItem('remembered_phone');
    localStorage.removeItem('rememberMe');

    // Clear sessionStorage
    sessionStorage.clear();

    // Dispatch logout event for multi-tab sync
    window.dispatchEvent(
        new StorageEvent('storage', {
            key: 'logout',
            oldValue: null,
            newValue: 'token_expired_' + Date.now(),
            storageArea: localStorage,
        }),
    );

    console.log('[Session] Redirecting to login page...');
    // Redirect ngay lập tức
    window.location.href = '/auth/login?session_expired=true';
}
