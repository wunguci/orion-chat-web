import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { presenceSocketService } from '../services/websocket/presenceSocket';
import { handleSessionExpired } from '../utils/sessionValidator';

/**
 * Khi tài khoản đăng nhập trên thiết bị khác cùng platform, tự động logout
 * Mobile conflicts không ảnh hưởng web và ngược lại
 */
export function useSessionConflictDetection() {
    const navigate = useNavigate();
    useEffect(() => {
        const presenceSocket = presenceSocketService.getSocket();

        if (!presenceSocket) {
            console.log('[useSessionConflictDetection] socket not connected');
            return;
        }

        const handleSessionConflict = (data: {
            message: string;
            oldPlatform: string;
            newPlatform: string;
            timestamp: string;
        }) => {
            console.log(
                '[useSessionConflictDetection] Received session conflict event:',
                data,
            );

            // chỉ xử lý xung đột từ nền tảng web
            if (data.oldPlatform !== 'web') {
                console.log(
                    '[useSessionConflictDetection] Ignore non-web conflict:',
                    data.oldPlatform,
                );
                return;
            }

            try {
                handleSessionExpired(undefined, false).catch((error) => {
                    console.error(
                        '[useSessionConflictDetection] Error logging out:',
                        error,
                    );
                });
            } catch (error) {
                console.error(
                    '[useSessionConflictDetection] Error handling conflict:',
                    error,
                );
                navigate('/auth/login', { replace: true });
            }
        };

        presenceSocket.on('session:conflict', handleSessionConflict);

        return () => {
            presenceSocket.off('session:conflict', handleSessionConflict);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
