import { useEffect } from 'react';
import { handleSessionExpired } from '../utils/sessionValidator';

/**
 * Configuration for session timeout
 */
export const SESSION_TIMEOUT_CONFIG = {
    // Timeout sau 15 phút không hoạt động (frontend warning)
    FRONTEND_TIMEOUT: 15 * 60 * 1000,

    // Timeout sau 14 phút (để backend có thời gian để xử lý - 1 phút buffer)
    BACKEND_TIMEOUT: 14 * 60 * 1000,

    // Events để theo dõi hoạt động
    ACTIVITY_EVENTS: [
        'mousedown',
        'keydown',
        'scroll',
        'touchstart',
        'click',
    ] as const,
};

/**
 * Hook to track user activity and logout after inactivity
 * @param timeoutMinutes - Timeout in minutes (default: 15)
 */
export function useActivityTimeout(timeoutMinutes: number = 15) {
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;

        const timeoutMs = timeoutMinutes * 60 * 1000;

        const resetTimer = () => {
            // Clear existing timer
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            // Set new timer
            timeoutId = setTimeout(() => {
                console.warn(
                    `[Activity Timeout] No activity detected for ${timeoutMinutes} minutes`,
                );

                // Show confirmation dialog before logout
                const shouldLogout = window.confirm(
                    `Phiên làm việc sẽ hết hạn do không hoạt động. Nhấn OK để tiếp tục, hoặc Hủy để đăng xuất.`,
                );

                if (!shouldLogout) {
                    // User clicked Cancel -> logout
                    handleSessionExpired();
                } else {
                    // User clicked OK -> reset timer
                    resetTimer();
                }
            }, timeoutMs);

            // Log activity
            console.log(
                '[Activity Timeout] Activity detected, timer reset. Timeout: ' +
                    timeoutMinutes +
                    ' minutes',
            );
        };

        // Add listeners for activity events
        SESSION_TIMEOUT_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
            window.addEventListener(event, resetTimer);
        });

        // Initialize timer
        resetTimer();

        // Cleanup
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            SESSION_TIMEOUT_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [timeoutMinutes]);
}
