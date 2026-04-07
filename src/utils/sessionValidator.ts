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
            },
        });

        if (response.status === 401) {
            const data = await response.json();
            if (
                data.message &&
                data.message.includes('Phiên làm việc đã hết hạn')
            ) {
                // Determine the reason for timeout
                const reason = data.message.includes('không hoạt động')
                    ? 'do không hoạt động'
                    : 'Bạn đã đăng nhập ở nơi khác';

                return {
                    isValid: false,
                    message: `Phiên làm việc đã hết hạn ${reason}.`,
                };
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

export async function handleSessionExpired(): Promise<void> {
    console.log('[Session] Handling expired session...');

    try {
        const token = getToken();
        if (token) {
            await logoutApi(token);
        }
    } catch (error) {
        console.error('[Session] Error during logout:', error);
    }

    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    // Get if this is from token expiry or other reason
    const fromTokenExpiry = !getToken();
    const message = fromTokenExpiry
        ? '⏰ Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.'
        : 'Phiên làm việc đã hết hạn.';

    console.warn('[Session]', message);

    // Show notification (minimal - don't block)
    // User can dismiss it or just wait for redirect
    if (fromTokenExpiry) {
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 500);
    } else {
        alert(message);
        setTimeout(() => {
            window.location.href = '/auth/login';
        }, 500);
    }
}
