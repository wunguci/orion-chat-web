/*eslint-disable*/
// Call
import { io, Socket } from 'socket.io-client';

const RAW_SOCKET_URL =
    (import.meta.env['VITE_SOCKET_URL'] as string | undefined) ||
    'http://localhost:3000'; /* Đảm bảo không có dấu gạch chéo ở cuối */

const normalizeSocketBaseUrl = (url: string) =>
    url.replace(/\/$/, '').replace(/\/call$/, '');

const SOCKET_BASE_URL = normalizeSocketBaseUrl(RAW_SOCKET_URL);
const CALL_NAMESPACE_URL = `${SOCKET_BASE_URL}/call`;

class CallSocketService {
    private callSocket: Socket | null = null;
    private currentUserId: string | null = null; // Track userId hiện tại

    // kết nối call socket (namespace /call)
    connect(userId: string, token?: string) {
        // nếu userId thay đổi, ngắt kết nối socket cũ.
        if (this.currentUserId && this.currentUserId !== userId) {
            console.log(
                `[SocketService] UserId changed from ${this.currentUserId} to ${userId}, reconnecting...`,
            );
            this.disconnect();
        }

        // nếu đã kết nối hoặc đang kết nối với cùng userId, trả về socket hiện có.
        if (this.callSocket && this.currentUserId === userId) {
            console.log(`[SocketService] Already connected/connecting as ${userId}`);
            return this.callSocket;
        }

        console.log(
            `[SocketService] Connecting call socket for userId: ${userId} via ${CALL_NAMESPACE_URL}`,
        );
        this.currentUserId = userId;

        this.callSocket = io(CALL_NAMESPACE_URL, {
            query: { userId },
            auth: { token },
            forceNew: true, // buộc kết nối mới
            transports: ['websocket'],
        });

        this.callSocket.on('connect', () => {
            console.log(
                `[SocketService] Call socket connected: ${this.callSocket?.id} (userId: ${userId})`,
            );
        });

        this.callSocket.on('disconnect', (reason) => {
            console.log(
                `[SocketService] Call socket disconnected. Reason: ${reason}`,
            );
        });

        this.callSocket.on('connect_error', (error: any) => {
            console.error(
                '[SocketService] Call socket connection error:',
                error?.message || error,
            );
            if (error) {
                console.error('[SocketService] Connection error details:', {
                    message: error.message,
                    code: error.code,
                    type: error.type,
                    reason: error.reason,
                });
            }

            this.disconnect();
        });

        return this.callSocket;
    }

    getSocket(): Socket | null {
        return this.callSocket;
    }

    // wait for call socket to be connected
    async waitForConnection(
        timeoutMs: number = 6000,
    ): Promise<boolean> {
        if (!this.callSocket) {
            console.log('[SocketService] Call socket not initialized');
            return false;
        }

        if (this.callSocket.connected) {
            console.log('[SocketService] Call socket already connected');
            return true;
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.error('[SocketService] Call socket connection timeout');
                if (this.callSocket) {
                    this.callSocket.off('connect', handleConnect);
                }
                resolve(false);
            }, timeoutMs);

            const handleConnect = () => {
                clearTimeout(timeout);
                if (this.callSocket) {
                    this.callSocket.off('connect', handleConnect);
                }
                console.log('[SocketService] Call socket connected (waited)');
                resolve(true);
            };

            if (this.callSocket) {
                this.callSocket.on('connect', handleConnect);
            }
        });
    }

    disconnect() {
        console.log('[SocketService] Disconnecting call socket');
        this.callSocket?.disconnect();
        this.callSocket = null;
        this.currentUserId = null;
    }
}

export const callSocketService = new CallSocketService();
export default callSocketService;
