import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../services/socket';
import { handleSessionExpired } from '../utils/sessionValidator';

/**
 * Khi tài khoản đăng nhập trên thiết bị khác cùng platform, tự động logout
 * Mobile conflicts không ảnh hưởng web và ngược lại
 */
export function useSessionConflictDetection() {
    const navigate = useNavigate();
    useEffect(() => {
        const presenceSocket = socketService.getPresenceSocket();

        if (!presenceSocket) {
            console.log('[useSessionConflictDetection] socket chưa kết nối');
            return;
        }

        const handleSessionConflict = (data: {
            message: string;
            oldPlatform: string;
            newPlatform: string;
            timestamp: string;
        }) => {
            console.log(
                '[useSessionConflictDetection] Nhận sự kiện xung đột phiên:',
                data,
            );

            // chỉ xử lý xung đột từ nền tảng web
            if (data.oldPlatform !== 'web') {
                console.log(
                    '[useSessionConflictDetection] Bỏ qua xung đột không phải web:',
                    data.oldPlatform,
                );
                return;
            }

            try {
                handleSessionExpired(undefined, false).catch((error) => {
                    console.error(
                        '[useSessionConflictDetection] Lỗi khi logout:',
                        error,
                    );
                });
            } catch (error) {
                console.error(
                    '[useSessionConflictDetection] Lỗi khi xử lý xung đột:',
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
