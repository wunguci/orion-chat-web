// Call
import { io, Socket } from 'socket.io-client';

const RAW_SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const normalizeSocketBaseUrl = (url: string) =>
    url.replace(/\/$/, '').replace(/\/call$/, '');

const SOCKET_BASE_URL = normalizeSocketBaseUrl(RAW_SOCKET_URL);
const CALL_NAMESPACE_URL = `${SOCKET_BASE_URL}/call`;
const PRESENCE_NAMESPACE_URL = `${SOCKET_BASE_URL}/presence`;

class SocketService {
    private socket: Socket | null = null;
    private callSocket: Socket | null = null;
    private presenceSocket: Socket | null = null;
    private currentUserId: string | null = null; // Track userId hiện tại

    // connect main socket
    connect(userId: string, token?: string) {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(SOCKET_BASE_URL, {
            query: { userId },
            auth: { token }, // nếu có authentication
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('Main socket connected:', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Main socket disconnected');
        });

        return this.socket;
    }

    // kết nối call socket (namespace /call)
    connectCall(userId: string, token?: string) {
        // nếu userId thay đổi, ngắt kết nối socket cũ.
        if (this.currentUserId && this.currentUserId !== userId) {
            console.log(
                `[SocketService] UserId changed from ${this.currentUserId} to ${userId}, reconnecting...`,
            );
            this.disconnectCall();
        }

        // nếu đã kết nối với cùng userId, trả về socket hiện có.
        if (this.callSocket?.connected && this.currentUserId === userId) {
            console.log(`[SocketService] Already connected as ${userId}`);
            return this.callSocket;
        }

        // ngắt kết nối nếu tồn tại nhưng chưa được kết nối.
        if (this.callSocket && !this.callSocket.connected) {
            this.callSocket.disconnect();
            this.callSocket = null;
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

        this.callSocket.on('connect_error', (error) => {
            console.error(
                '[SocketService] Call socket connection error:',
                error,
            );
        });

        return this.callSocket;
    }

    // get main socket instance
    getSocket(): Socket | null {
        return this.socket;
    }

    // get call socket instance
    getCallSocket(): Socket | null {
        return this.callSocket;
    }

    // connect presence socket (namespace /presence)
    connectPresence(userId: string, token?: string) {
        if (this.presenceSocket?.connected) {
            return this.presenceSocket;
        }

        this.presenceSocket = io(PRESENCE_NAMESPACE_URL, {
            query: { userId },
            auth: { token },
            transports: ['websocket'],
        });

        this.presenceSocket.on('connect', () => {
            console.log(
                `[SocketService] Presence socket connected: ${this.presenceSocket?.id} (userId: ${userId})`,
            );
        });

        this.presenceSocket.on('disconnect', (reason) => {
            console.log(
                `[SocketService] Presence socket disconnected. Reason: ${reason}`,
            );
        });

        this.presenceSocket.on('connect_error', (error) => {
            console.error(
                '[SocketService] Presence socket connection error:',
                error,
            );
        });

        return this.presenceSocket;
    }

    getPresenceSocket(): Socket | null {
        return this.presenceSocket;
    }

    // disconnect all sockets
    disconnect() {
        console.log('[SocketService] Disconnecting all sockets');
        this.socket?.disconnect();
        this.callSocket?.disconnect();
        this.presenceSocket?.disconnect();
        this.socket = null;
        this.callSocket = null;
        this.presenceSocket = null;
        this.currentUserId = null;
    }

    // disconnect only call socket
    disconnectCall() {
        console.log('[SocketService] Disconnecting call socket');
        this.callSocket?.disconnect();
        this.callSocket = null;
        this.currentUserId = null;
    }

    disconnectPresence() {
        console.log('[SocketService] Disconnecting presence socket');
        this.presenceSocket?.disconnect();
        this.presenceSocket = null;
    }
}

export const socketService = new SocketService();
export default socketService;

// Chat
// import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';
let socket: Socket | null = null;

export const connectSocket = (userId: string): Socket => {
    if (socket && socket.connected) return socket;

    socket = io(SERVER_URL + '/chat', {
        transports: ['websocket'],
        auth: { userId },
    });

    socket.on('connect', () => {
        console.log('Socket connected:', socket ? socket.id : '');
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connect error:', err.message);
    });

    return socket;
};

export const disconnectSocket = () => {
    if (socket) socket.disconnect();
    socket = null;
};

export const getSocket = () => socket;

export const joinConversation = (requestId: string, conversationId: string) => {
    if (!socket) return;
    socket.emit('chat:join_conversation', { requestId, conversationId });
};

export const sendMessage = (data: {
    requestId: string;
    clientMessageId: string;
    conversationId: string;
    receiverId: string;
    type: 'text' | 'image' | 'file' | 'audio';
    content: string;
    replyToMessageId?: string;
}) => {
    if (!socket) return;
    socket.emit('chat:send_message', data);
};

export const fetchMessages = (data: {
    requestId: string;
    conversationId: string;
    cursor?: string | null;
    limit?: number;
}) => {
    if (!socket) return;
    socket.emit('chat:fetch_messages', data);
};

export const sendTyping = (conversationId: string, isTyping: boolean) => {
    if (!socket) return;
    socket.emit('chat:typing', { conversationId, isTyping });
};

export const onAck = (cb: (ack: any) => void) => {
    if (!socket) return;
    socket.on('chat:ack', cb);
};

export const offAck = () => {
    if (!socket) return;
    socket.off('chat:ack');
};

export const onMessageNew = (cb: (payload: any) => void) => {
    if (!socket) return;
    socket.on('chat:message_new', cb);
};

export const offMessageNew = () => {
    if (!socket) return;
    socket.off('chat:message_new');
};

export const sendFileMessage = (data: {
    senderId: string;
    senderName: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    timestamp: string;
}) => socket?.emit('send_message', { ...data, content: '', isFile: true });

export const onTyping = (cb: (payload: any) => void) => {
    if (!socket) return;
    socket.on('chat:typing', cb);
};

export const offTyping = () => {
    if (!socket) return;
    socket.off('chat:typing');
};