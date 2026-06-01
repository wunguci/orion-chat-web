import { useEffect } from 'react';
import { getToken, isTokenValid, logout } from '../utils/token';
import { handleSessionExpired } from '../utils/sessionValidator';
import { api } from '../services/api';

export function useTokenExpiry() {
    useEffect(() => {
        const checkTokenExpiry = () => {
            const token = getToken();

            if (!token) {
                console.log('[useTokenExpiry] No token found');
                return;
            }

            // kiểm tra tính hợp lệ của token
            if (!isTokenValid()) {
                // Token hết hạn - đăng xuất
                handleSessionExpired();
            } else {
                // token vẫn hợp lệ
                try {
                    const parts = token.split('.');
                    const payload = JSON.parse(atob(parts[1]));
                    const expiresAt = payload.exp
                        ? new Date(payload.exp * 1000)
                        : null;
                    const timeUntilExpiry = expiresAt
                        ? Math.floor(
                              (expiresAt.getTime() - Date.now()) / 1000 / 60,
                          )
                        : null;

                    if (timeUntilExpiry) {
                        console.log(
                            `[useTokenExpiry] Token valid, expires in ~${timeUntilExpiry} minutes`,
                        );
                    }
                } catch (error) {
                    console.error(
                        '[useTokenExpiry] Error parsing token:',
                        error,
                    );
                }
            }
        };

        // xác minh tính hợp lệ của phiên
        const verifySessionValidity = async () => {
            try {
                const token = getToken();
                if (!token) return;

                // Gọi verify-token để kiểm tra session
                await api.get('/auth/verify-token');
                console.log('[useTokenExpiry] Session verified with backend');
            } catch (error) {
                if (error instanceof Error) {
                    const errorMsg = error.message.toLowerCase();

                    // kiểm tra nếu là lỗi xung đột phiên
                    if (
                        errorMsg.includes('đã đăng nhập ở nơi khác') ||
                        errorMsg.includes('hoặc bạn đã đăng nhập') ||
                        errorMsg.includes('web khác') ||
                        errorMsg.includes('mobile khác') ||
                        errorMsg.includes('xung đột') ||
                        errorMsg.includes('logged in elsewhere') ||
                        errorMsg.includes('logged in from another') ||
                        errorMsg.includes('conflict') ||
                        errorMsg.includes('another device')
                    ) {
                        // Show alert to user
                        alert(
                            'Your account has been logged in from another location.\n\n' +
                                'The current session will end. Please log in again.',
                        );
                        // Logout immediately
                        logout();
                        window.location.href =
                            '/auth/login?session_expired=true';
                    } else if (
                        errorMsg.includes('token has expired') ||
                        errorMsg.includes('token expired') ||
                        errorMsg.includes('invalid')
                    ) {
                        console.warn(
                            '[useTokenExpiry] Token expired on backend',
                        );
                        handleSessionExpired();
                    }
                }
            }
        };

        // kiểm tra hết hạn token
        checkTokenExpiry();
        verifySessionValidity();

        // kiểm tra hết hạn token cục bộ
        const localCheckInterval = setInterval(checkTokenExpiry, 15 * 1000);

        // xác minh session với backend mỗi 2 giây (phát hiện session mismatch nhanh)
        const sessionCheckInterval = setInterval(
            verifySessionValidity,
            2 * 1000,
        );

        // Cleanup
        return () => {
            clearInterval(localCheckInterval);
            clearInterval(sessionCheckInterval);
        };
    }, []);
}
