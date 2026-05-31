import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import { getToken, removeToken } from '../../utils/token';
import { chatSocketService } from '../../services/websocket/chatSocket';
import { notificationSocketService } from '../../services/websocket/notificationSocket';
import { presenceSocketService } from '../../services/websocket/presenceSocket';

export default function LogoutPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            try {
                const token = getToken();
                if (token) {
                    // Call logout API
                    await logout(token);
                    console.log('[LogoutPage] Logout API called successfully');
                }
            } catch (error) {
                console.error('[LogoutPage] Error calling logout API:', error);
            } finally {
                chatSocketService.disconnect();
                notificationSocketService.disconnect();
                presenceSocketService.disconnect();

                // Clear every local/session auth token.
                removeToken();

                console.log('[LogoutPage] Local storage cleared');

                // Redirect to login
                setTimeout(() => {
                    navigate('/auth/login');
                }, 1500);
            }
        };

        performLogout();
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <div className="mb-4">
                    <div className="inline-block">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Đang đăng xuất...
                </h2>
                <p className="text-gray-600">Vui lòng chờ</p>
            </div>
        </div>
    );
}
