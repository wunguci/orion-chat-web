// Call
import { io, Socket } from 'socket.io-client';

const RAW_SOCKET_URL =
  (import.meta.env["VITE_SOCKET_URL"] as string | undefined) ||
  "http://localhost:3000"; /* Đảm bảo không có dấu gạch chéo ở cuối */

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

    this.callSocket.on("connect", () => {
      console.log(
        `[SocketService] Call socket connected: ${this.callSocket?.id} (userId: ${userId})`,
      );
    });

    this.callSocket.on("disconnect", (reason) => {
      console.log(
        `[SocketService] Call socket disconnected. Reason: ${reason}`,
      );
    });

    this.callSocket.on("connect_error", (error) => {
      // console.error("[SocketService] Call socket connection error:", error);
      this.disconnectCall();
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

    this.presenceSocket.on("connect_error", (error) => {
      // console.error("[SocketService] Presence socket connection error:", error);
    });

        return this.presenceSocket;
    }

    getPresenceSocket(): Socket | null {
        return this.presenceSocket;
    }

  // disconnect all sockets
  disconnect() {
    console.log("[SocketService] Disconnecting all sockets");
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
    console.log("[SocketService] Disconnecting call socket");
    this.callSocket?.disconnect();
    this.callSocket = null;
    this.currentUserId = null;
  }

  disconnectPresence() {
    console.log("[SocketService] Disconnecting presence socket");
    this.presenceSocket?.disconnect();
    this.presenceSocket = null;
  }
}

export const socketService = new SocketService();
export default socketService;

// =============================
// Chat Socket Service (JWT-based)
// =============================

const CHAT_NAMESPACE_URL = `${SOCKET_BASE_URL}/chat`;

class ChatSocketService {
    private chatSocket: Socket | null = null;

    /**
     * Kết nối socket chat sử dụng JWT token từ localStorage
     * Tự động handle authentication mà không cần userId parameter
     */
    connect(): Socket {
        if (this.chatSocket?.connected) {
            console.log('[ChatSocketService] Already connected');
            return this.chatSocket;
        }

        const token = localStorage.getItem('auth_token');

        if (!token) {
            console.error(
                '[ChatSocketService] No auth token found, redirecting to login',
            );
            window.location.href = '/login';
            throw new Error('No auth token found');
        }

        console.log(
            `[ChatSocketService] Connecting to chat namespace: ${CHAT_NAMESPACE_URL}`,
        );
        console.log(
            `[ChatSocketService] Using JWT token: ${token.substring(0, 20)}...`,
        );

        this.chatSocket = io(CHAT_NAMESPACE_URL, {
            transports: ['websocket'],
            auth: { token }, // ✅ Sử dụng JWT token
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        this.chatSocket.on('connect', () => {
            console.log(
                `[ChatSocketService] ✅ Connected: ${this.chatSocket?.id}`,
            );
        });

        this.chatSocket.on('disconnect', (reason) => {
            console.warn(`[ChatSocketService] ⚠️ Disconnected: ${reason}`);

            // Log disconnect reasons
            if (reason === 'io server disconnect') {
                console.error(
                    '[ChatSocketService] Server disconnected - likely auth/validation error',
                );
            } else if (reason === 'io client disconnect') {
                console.log('[ChatSocketService] Client initiated disconnect');
            }
        });

        this.chatSocket.on('connect_error', (err: any) => {
            console.error(
                '[ChatSocketService] ❌ Connection error:',
                err?.message || err,
            );
            console.error('[ChatSocketService] Error data:', err?.data);

            // ✅ Handle 401 - redirect to login
            if (
                err?.message?.includes('Authentication') ||
                err?.data?.message?.includes('Authentication')
            ) {
                console.error(
                    '[ChatSocketService] Auth failed - clearing token and redirecting',
                );
                localStorage.removeItem('auth_token');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            }
        });

        this.chatSocket.on('error', (error: any) => {
            console.error('[ChatSocketService] ❌ Socket error:', error);
        });

        return this.chatSocket;
    }

    disconnect() {
        console.log('[ChatSocketService] Disconnecting');
        this.chatSocket?.disconnect();
        this.chatSocket = null;
    }

    getSocket(): Socket | null {
        return this.chatSocket;
    }

    // ===== Chat Event Emitters =====

    joinConversation(requestId: string, conversationId: string) {
        if (!this.chatSocket) return;
        this.chatSocket.emit('chat:join_conversation', {
            requestId,
            conversationId,
        });
    }

    sendMessage(data: {
        requestId: string;
        clientMessageId: string;
        conversationId: string;
        receiverId: string;
        type: 'text' | 'image' | 'file' | 'audio' | 'call';
        content: string;
        mediaUrl?: string;
        fileName?: string;
        fileSize?: number;
        replyToMessageId?: string;
        callData?: {
            callType?: 'audio' | 'video';
            callStatus?: 'completed' | 'missed' | 'declined';
            duration?: number;
            isInitiator?: boolean;
            wasRejected?: boolean;
        };
    }) {
        if (!this.chatSocket) {
            console.error(
                '[ChatSocketService] ❌ Socket not initialized! Call connect() first.',
            );
            return;
        }

        if (!this.chatSocket.connected) {
            console.error(
                `[ChatSocketService] ⚠️ Socket not connected. Status: connected=${this.chatSocket.connected}`,
            );
            console.error(
                '[ChatSocketService] Try reconnecting or check socket connection status',
            );

            // Attempt to reconnect
            if (this.chatSocket.disconnected) {
                console.log('[ChatSocketService] Attempting to reconnect...');
                this.chatSocket.connect();
            }
            return;
        }

        console.log(
            `[ChatSocketService] 📤 Sending message: clientId=${data.clientMessageId}, to=${data.receiverId}, conversationId=${data.conversationId}`,
        );
        console.log('[ChatSocketService] Message content:', data.content);

        this.chatSocket.emit('chat:send_message', data);
        console.log(
            '[ChatSocketService] ✅ Message emitted successfully via socket',
        );
    }

    fetchMessages(data: {
        requestId: string;
        conversationId: string;
        cursor?: string | null;
        limit?: number;
    }) {
        if (!this.chatSocket) return;
        this.chatSocket.emit('chat:fetch_messages', data);
    }

    sendTyping(conversationId: string, isTyping: boolean) {
        if (!this.chatSocket) return;
        this.chatSocket.emit('chat:typing', { conversationId, isTyping });
    }

    // ===== Chat Event Listeners =====

    onAck(cb: (ack: any) => void) {
        if (!this.chatSocket) return;
        this.chatSocket.on('chat:ack', cb);
    }

    offAck() {
        if (!this.chatSocket) return;
        this.chatSocket.off('chat:ack');
    }

    onMessageNew(cb: (payload: any) => void) {
        if (!this.chatSocket) {
            console.warn(
                '[ChatSocketService] onMessageNew: Socket not initialized',
            );
            return;
        }

        console.log('[ChatSocketService] Registering onMessageNew listener');
        this.chatSocket.on('chat:message_new', (payload) => {
            console.log(
                '[ChatSocketService] chat:message_new event received:',
                payload,
            );
            cb(payload);
        });
    }

    offMessageNew() {
        if (!this.chatSocket) return;
        this.chatSocket.off('chat:message_new');
    }

    onTyping(cb: (payload: any) => void) {
        if (!this.chatSocket) return;
        this.chatSocket.on('chat:typing', cb);
    }

    offTyping() {
        if (!this.chatSocket) return;
        this.chatSocket.off('chat:typing');
    }

    onMessageReactionUpdated(
        cb: (payload: {
            conversationId: string;
            messageId: string;
            reactions: Array<{
                userId: string;
                emoji: string;
                reactedAt: string;
            }>;
            actedBy: string;
            action: 'set' | 'remove';
            emoji?: string;
            at: string;
        }) => void,
    ) {
        if (!this.chatSocket) return;
        this.chatSocket.on('chat:message_reaction_updated', cb);
    }

    offMessageReactionUpdated() {
        if (!this.chatSocket) return;
        this.chatSocket.off('chat:message_reaction_updated');
    }

    onMessageRecalled(
        cb: (payload: {
            conversationId: string;
            messageId: string;
            revokedBy: string;
            revokedAt: string;
            isDeleted: boolean;
        }) => void,
    ) {
        if (!this.chatSocket) return;
        this.chatSocket.on('chat:message_recalled', cb);
    }

    offMessageRecalled() {
        if (!this.chatSocket) return;
        this.chatSocket.off('chat:message_recalled');
    }
}

// ===== Factory Instance =====
export const chatSocketService = new ChatSocketService();

// ===== Legacy Backward-Compatible Exports (for ChatPageWithConversationService) =====
/**
 * @deprecated Use chatSocketService.connect() instead
 * Kept for backward compatibility
 */
export const connectSocket = (): Socket => {
    return chatSocketService.connect();
};

export const disconnectSocket = () => {
    chatSocketService.disconnect();
};

export const getSocket = (): Socket | null => {
    return chatSocketService.getSocket();
};

export const joinConversation = (requestId: string, conversationId: string) => {
    chatSocketService.joinConversation(requestId, conversationId);
};

export const sendMessage = (data: {
    requestId: string;
    clientMessageId: string;
    conversationId: string;
    receiverId: string;
    type: 'text' | 'image' | 'file' | 'audio' | 'call';
    content: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToMessageId?: string;
    callData?: {
        callType?: 'audio' | 'video';
        callStatus?: 'completed' | 'missed' | 'declined';
        duration?: number;
        isInitiator?: boolean;
        wasRejected?: boolean;
    };
}) => {
    chatSocketService.sendMessage(data);
};

export const fetchMessages = (data: {
    requestId: string;
    conversationId: string;
    cursor?: string | null;
    limit?: number;
}) => {
    chatSocketService.fetchMessages(data);
};

export const sendTyping = (conversationId: string, isTyping: boolean) => {
    chatSocketService.sendTyping(conversationId, isTyping);
};

export const onAck = (cb: (ack: any) => void) => {
    chatSocketService.onAck(cb);
};

export const offAck = () => {
    chatSocketService.offAck();
};

export const onMessageNew = (cb: (payload: any) => void) => {
    chatSocketService.onMessageNew(cb);
};

export const offMessageNew = () => {
    chatSocketService.offMessageNew();
};

export const onTyping = (cb: (payload: any) => void) => {
    chatSocketService.onTyping(cb);
};

export const offTyping = () => {
    chatSocketService.offTyping();
};

export const onMessageReactionUpdated = (
    cb: (payload: {
        conversationId: string;
        messageId: string;
        reactions: Array<{ userId: string; emoji: string; reactedAt: string }>;
        actedBy: string;
        action: 'set' | 'remove';
        emoji?: string;
        at: string;
    }) => void,
) => {
    chatSocketService.onMessageReactionUpdated(cb);
};

export const offMessageReactionUpdated = () => {
    chatSocketService.offMessageReactionUpdated();
};

export const onMessageRecalled = (
    cb: (payload: {
        conversationId: string;
        messageId: string;
        revokedBy: string;
        revokedAt: string;
        isDeleted: boolean;
    }) => void,
) => {
    chatSocketService.onMessageRecalled(cb);
};

export const offMessageRecalled = () => {
    chatSocketService.offMessageRecalled();
};
