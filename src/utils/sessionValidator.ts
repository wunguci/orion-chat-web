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
                message: 'Không tìm thấy token',
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
                const isExpired = messageText.includes('hết hạn');
                const isInactive = messageText.includes('không hoạt động');
                const isOtherLogin =
                    messageText.includes('đăng nhập') ||
                    messageText.includes('thiết bị');

                if (isExpired || isInactive || isOtherLogin) {
                    const reason = isInactive
                        ? 'do không hoạt động'
                        : isOtherLogin
                          ? 'do đăng nhập ở thiết bị khác'
                          : 'do phiên đã hết hạn';

                    return {
                        isValid: false,
                        message: `Phiên làm việc đã hết hạn ${reason}.`,
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
            message: 'Lỗi kiểm tra phiên làm việc',
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
                'Phiên đăng nhập của bạn đã hết hạn.\n\nVui lòng đăng nhập lại.',
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
