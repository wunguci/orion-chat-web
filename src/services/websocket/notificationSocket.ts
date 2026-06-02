/*eslint-disable*/
import { io, Socket } from 'socket.io-client';

const RAW_SOCKET_URL =
    (import.meta.env['VITE_SOCKET_URL'] as string | undefined) ||
    'http://localhost:3000'; /* Đảm bảo không có dấu gạch chéo ở cuối */

const normalizeSocketBaseUrl = (url: string) =>
    url.replace(/\/$/, '').replace(/\/call$/, '');

const SOCKET_BASE_URL = normalizeSocketBaseUrl(RAW_SOCKET_URL);
const NOTIFICATION_NAMESPACE_URL = `${SOCKET_BASE_URL}/notifications`;

class NotificationSocketService {
    private notificationSocket: Socket | null = null;
    private notificationUserId: string | null = null;

    connect(userId: string, token?: string) {
        if (
            this.notificationSocket?.connected &&
            this.notificationUserId === userId
        ) {
            this.notificationSocket.emit('notifications:join', { userId });
            return this.notificationSocket;
        }

        // Disconnect socket cũ (đang connecting hoặc disconnected) trước khi tạo mới
        if (this.notificationSocket && this.notificationUserId !== userId) {
            console.log(
                `[SocketService] Notification userId changed from ${this.notificationUserId} to ${userId}, reconnecting...`,
            );
            this.disconnect();
        }

        if (this.notificationSocket) {
            return this.notificationSocket;
        }

        this.notificationUserId = userId;
        this.notificationSocket = io(NOTIFICATION_NAMESPACE_URL, {
            query: { userId },
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.notificationSocket.on('connect', () => {
            console.log(
                `[SocketService] Notification socket connected: ${this.notificationSocket?.id} (userId: ${userId})`,
            );
            this.notificationSocket?.emit('notifications:join', { userId });
        });

        this.notificationSocket.on('disconnect', (reason) => {
            console.log(
                `[SocketService] Notification socket disconnected. Reason: ${reason}`,
            );
        });

        this.notificationSocket.on('connect_error', (error: Error) => {
            console.error(
                '[SocketService] Notification socket connection error:',
                error?.message || error,
            );
        });

        return this.notificationSocket;
    }

    getSocket(): Socket | null {
        return this.notificationSocket;
    }

    disconnect() {
        console.log('[SocketService] Disconnecting notification socket');
        this.notificationSocket?.disconnect();
        this.notificationSocket = null;
        this.notificationUserId = null;
    }
}

export const notificationSocketService = new NotificationSocketService();
export default notificationSocketService;
