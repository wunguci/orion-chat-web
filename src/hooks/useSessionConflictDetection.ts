import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../services/socket';
import { useAuth } from './useAuth';

/**
 * Khi tài khoản đăng nhập trên thiết bị khác cùng platform, tự động logout
 * Mobile conflicts không ảnh hưởng web và ngược lại
 */
export function useSessionConflictDetection() {
    const navigate = useNavigate();
    const { logout } = useAuth();

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
                // Tự động đăng xuất khỏi thiết bị này
                logout();

                // Hiển thị thông báo
                alert(
                    `Phiên đăng nhập bị chiếm dụng\n\n${data.message}\n\nBạn sẽ được điều hướng về trang đăng nhập.`,
                );

                // Điều hướng về trang đăng nhập
                navigate('/login', { replace: true });
            } catch (error) {
                console.error(
                    '[useSessionConflictDetection] Lỗi khi xử lý xung đột:',
                    error,
                );
                navigate('/login', { replace: true });
            }
        };

        presenceSocket.on('session:conflict', handleSessionConflict);

        return () => {
            presenceSocket.off('session:conflict', handleSessionConflict);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
