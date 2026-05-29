/*eslint-disable*/
import { io, Socket } from 'socket.io-client';

const RAW_SOCKET_URL =
    (import.meta.env['VITE_SOCKET_URL'] as string | undefined) ||
    'http://localhost:3000'; /* Đảm bảo không có dấu gạch chéo ở cuối */

const normalizeSocketBaseUrl = (url: string) =>
    url.replace(/\/$/, '').replace(/\/call$/, '');

const SOCKET_BASE_URL = normalizeSocketBaseUrl(RAW_SOCKET_URL);
const PRESENCE_NAMESPACE_URL = `${SOCKET_BASE_URL}/presence`;

class PresenceSocketService {
    private presenceSocket: Socket | null = null;
    private presenceHeartbeatTimer: ReturnType<typeof setInterval> | null =
        null;

    // connect presence socket (namespace /presence)
    connect(userId: string, token?: string) {
        if (this.presenceSocket && this.presenceSocket.connected) {
            return this.presenceSocket;
        }

        if (this.presenceSocket) {
            this.presenceSocket.disconnect();
            this.presenceSocket = null;
        }

        this.presenceSocket = io(PRESENCE_NAMESPACE_URL, {
            query: { userId, platform: 'web' },
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.presenceSocket.on('connect', () => {
            console.log(
                `[SocketService] Presence socket connected: ${this.presenceSocket?.id} (userId: ${userId}, platform: web)`,
            );

            // Prime online list right after connect/reconnect.
            this.presenceSocket?.emit('presence:get-online');

            if (this.presenceHeartbeatTimer) {
                clearInterval(this.presenceHeartbeatTimer);
            }

            this.presenceHeartbeatTimer = setInterval(() => {
                this.presenceSocket?.emit('presence:heartbeat', { userId });
            }, 15000);
        });

        this.presenceSocket.on('disconnect', (reason) => {
            console.log(
                `[SocketService] Presence socket disconnected. Reason: ${reason}`,
            );

            if (this.presenceHeartbeatTimer) {
                clearInterval(this.presenceHeartbeatTimer);
                this.presenceHeartbeatTimer = null;
            }
        });

        this.presenceSocket.on('connect_error', () => {
            // console.error("[SocketService] Presence socket connection error:", error);
        });

        return this.presenceSocket;
    }

    getSocket(): Socket | null {
        return this.presenceSocket;
    }

    disconnect() {
        console.log('[SocketService] Disconnecting presence socket');
        this.presenceSocket?.disconnect();
        this.presenceSocket = null;

        if (this.presenceHeartbeatTimer) {
            clearInterval(this.presenceHeartbeatTimer);
            this.presenceHeartbeatTimer = null;
        }
    }
}

export const presenceSocketService = new PresenceSocketService();
export default presenceSocketService;
