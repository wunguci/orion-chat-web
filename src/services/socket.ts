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
const PRESENCE_NAMESPACE_URL = `${SOCKET_BASE_URL}/presence`;
const NOTIFICATION_NAMESPACE_URL = `${SOCKET_BASE_URL}/notifications`;

class SocketService {
    private socket: Socket | null = null;
    private callSocket: Socket | null = null;
    private presenceSocket: Socket | null = null;
    private notificationSocket: Socket | null = null;
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
            query: { userId, platform: 'web' },
            auth: { token },
            transports: ['websocket'],
        });

        this.presenceSocket.on('connect', () => {
            console.log(
                `[SocketService] Presence socket connected: ${this.presenceSocket?.id} (userId: ${userId}, platform: web)`,
            );
        });

        this.presenceSocket.on('disconnect', (reason) => {
            console.log(
                `[SocketService] Presence socket disconnected. Reason: ${reason}`,
            );
        });

        this.presenceSocket.on('connect_error', (error) => {
            // console.error("[SocketService] Presence socket connection error:", error);
        });

    this.presenceSocket.on("disconnect", (reason) => {
      console.log(
        `[SocketService] Presence socket disconnected. Reason: ${reason}`,
      );
    });

        this.presenceSocket.on('connect_error', () => {
            // console.error("[SocketService] Presence socket connection error:", error);
        });

        return this.presenceSocket;
    }

    getPresenceSocket(): Socket | null {
        return this.presenceSocket;
    }

    connectNotification(userId: string, token?: string) {
        if (this.notificationSocket?.connected) {
            return this.notificationSocket;
        }

        this.notificationSocket = io(NOTIFICATION_NAMESPACE_URL, {
            query: { userId },
            auth: { token },
            transports: ['websocket'],
        });

        this.notificationSocket.on('connect', () => {
            console.log(
                `[SocketService] Notification socket connected: ${this.notificationSocket?.id}`,
            );
            this.notificationSocket?.emit('notifications:join', { userId });
        });

        this.notificationSocket.on('disconnect', (reason) => {
            console.log(
                `[SocketService] Notification socket disconnected. Reason: ${reason}`,
            );
        });

        return this.notificationSocket;
    }

    getNotificationSocket(): Socket | null {
        return this.notificationSocket;
    }

    // disconnect all sockets
    disconnect() {
        console.log('[SocketService] Disconnecting all sockets');
        this.socket?.disconnect();
        this.callSocket?.disconnect();
        this.presenceSocket?.disconnect();
        this.notificationSocket?.disconnect();
        this.socket = null;
        this.callSocket = null;
        this.presenceSocket = null;
        this.notificationSocket = null;
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

    disconnectNotification() {
        console.log('[SocketService] Disconnecting notification socket');
        this.notificationSocket?.disconnect();
        this.notificationSocket = null;
    }
}

export const socketService = new SocketService();
export default socketService;

// Chat Socket Service (JWT-based)

const CHAT_NAMESPACE_URL = `${SOCKET_BASE_URL}/chat`;

type SocketAckSuccess<T> = {
    ok: true;
    requestId: string;
    data: T;
};

type SocketAckError = {
    ok: false;
    requestId: string;
    error: {
        code: string;
        message: string;
        retriable: boolean;
    };
};

type SocketAckResponse<T> = SocketAckSuccess<T> | SocketAckError;

type ChatSendMessagePayload = {
    requestId: string;
    clientMessageId: string;
    conversationId: string;
    receiverId?: string;
    type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'call';
    content: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToMessageId?: string;
    forwardedFromMessageId?: string;
    callData?: {
        callType?: 'audio' | 'video';
        callStatus?: 'completed' | 'missed' | 'declined';
        duration?: number;
        isInitiator?: boolean;
        wasRejected?: boolean;
    };
};

type ChatMessageSeenPayload = {
    conversationId: string;
    messageId: string;
    userId: string;
    seenAt: string;
};

type ChatMessageDeletedPayload = {
    conversationId: string;
    messageId: string;
    deletedBy: string;
    isDeleted: boolean;
    at: string;
};

type ChatTypingPayload = {
    conversationId: string;
    userId: string;
    isTyping: boolean;
    at: string;
};

type ChatMessageReactionPayload = {
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
};

type ChatMessageRecalledPayload = {
    conversationId: string;
    messageId: string;
    revokedBy: string;
    revokedAt: string;
    isDeleted: boolean;
};

type GroupAutoDeleteUpdatedPayload = {
    groupId: string;
    autoDeleteDuration: number;
    updatedBy: string;
    updatedAt: string;
};

type GroupMemberLeftPayload = {
    groupId: string;
    userId: string;
    leftAt: string;
    groupDeleted: boolean;
};

type GroupAdminTransferredPayload = {
    groupId: string;
    oldAdminUserId: string;
    newAdminUserId: string;
    transferredAt: string;
};

type GroupDissolvedPayload = {
    groupId: string;
    dissolvedBy: string;
    dissolvedAt: string;
};

type ConversationHiddenUpdatedPayload = {
    conversationId: string;
    userId: string;
    hidden: boolean;
    updatedAt: string;
};

type ConversationHistoryClearedPayload = {
    conversationId: string;
    userId: string;
    deletedMessagesCount: number;
    clearedAt: string;
};

class ChatSocketService {
    private chatSocket: Socket | null = null;
    private joinedConversationIds = new Set<string>();
    private listenersBound = false;

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
      transports: ["websocket"],
      auth: { token }, // Sử dụng JWT token
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

        this.bindLifecycleListeners();

        this.chatSocket.on('connect', () => {
            console.log(
                `[ChatSocketService] Connected: ${this.chatSocket?.id}`,
            );
            this.resubscribeJoinedRooms();
        });

    this.chatSocket.on("disconnect", (reason) => {
      console.warn(`[ChatSocketService] Disconnected: ${reason}`);

            // Log disconnect reasons
            if (reason === 'io server disconnect') {
                console.error(
                    '[ChatSocketService] Server disconnected - likely auth/validation error',
                );
            } else if (reason === 'io client disconnect') {
                console.log('[ChatSocketService] Client initiated disconnect');
            }
        });

        this.chatSocket.on(
            'connect_error',
            (err: { message?: string; data?: { message?: string } }) => {
                console.error(
                    '[ChatSocketService] Connection error:',
                    err?.message || err,
                );
                console.error('[ChatSocketService] Error data:', err?.data);

                // Handle 401 - redirect to login
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
            },
        );

        this.chatSocket.on('error', (error: unknown) => {
            console.error('[ChatSocketService] Socket error:', error);
        });

        return this.chatSocket;
    }

    disconnect() {
        console.log('[ChatSocketService] Disconnecting');
        this.chatSocket?.disconnect();
        this.chatSocket = null;
        this.joinedConversationIds.clear();
        this.listenersBound = false;
    }

    getSocket(): Socket | null {
        return this.chatSocket;
    }

    // ===== Chat Event Emitters =====

    private emitWithAck<T>(
        event: string,
        data: Record<string, unknown>,
    ): Promise<SocketAckResponse<T>> {
        return new Promise((resolve, reject) => {
            if (!this.chatSocket) {
                reject(new Error('Chat socket is not initialized'));
                return;
            }

            this.chatSocket
                .timeout(10000)
                .emit(
                    event,
                    data,
                    (error: Error | null, response: SocketAckResponse<T>) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve(response);
                    },
                );
        });
    }

    private bindLifecycleListeners() {
        if (!this.chatSocket || this.listenersBound) {
            return;
        }

        this.listenersBound = true;
        this.chatSocket.on('reconnect', () => {
            this.resubscribeJoinedRooms();
        });
    }

    private resubscribeJoinedRooms() {
        if (!this.chatSocket?.connected) return;

        for (const conversationId of this.joinedConversationIds) {
            this.chatSocket.emit('chat:join_conversation', {
                requestId: `rejoin_${conversationId}_${Date.now()}`,
                conversationId,
            });
        }
    }

    async joinConversation(requestId: string, conversationId: string) {
        if (!this.chatSocket) return null;

        const response = await this.emitWithAck<{ conversationId: string }>(
            'chat:join_conversation',
            {
                requestId,
                conversationId,
            },
        );

        if (response.ok) {
            this.joinedConversationIds.add(conversationId);
        }

        return response;
    }

    async leaveConversation(requestId: string, conversationId: string) {
        if (!this.chatSocket) return null;

        const response = await this.emitWithAck<{ conversationId: string }>(
            'chat:leave_conversation',
            {
                requestId,
                conversationId,
            },
        );

        if (response.ok) {
            this.joinedConversationIds.delete(conversationId);
        }

        return response;
    }

    async sendMessage(data: ChatSendMessagePayload) {
        if (!this.chatSocket) {
            console.error(
                '[ChatSocketService] Socket not initialized! Call connect() first.',
            );
            throw new Error('Socket not initialized');
        }

    if (!this.chatSocket.connected) {
      console.error(
        `[ChatSocketService] Socket not connected. Status: connected=${this.chatSocket.connected}`,
      );
      console.error(
        "[ChatSocketService] Try reconnecting or check socket connection status",
      );

            // Attempt to reconnect
            if (this.chatSocket.disconnected) {
                console.log('[ChatSocketService] Attempting to reconnect...');
                this.chatSocket.connect();
            }
            throw new Error('Socket not connected');
        }

        console.log(
            `[ChatSocketService] Sending message: clientId=${data.clientMessageId}, to=${data.receiverId}, conversationId=${data.conversationId}`,
        );
        console.log('[ChatSocketService] Message content:', data.content);

        const response = await this.emitWithAck<{
            messageId: string;
            clientMessageId: string;
            timestamp: string;
        }>('chat:send_message', data);

        console.log(
            '[ChatSocketService] Message emitted successfully via socket',
        );
        return response;
    }

    async markMessageRead(data: {
        requestId: string;
        conversationId: string;
        messageId: string;
    }) {
        if (!this.chatSocket) return null;

        return this.emitWithAck<{
            conversationId: string;
            messageId: string;
            seenAt: string;
        }>('chat:message_read', data);
    }

    sendTyping(conversationId: string, isTyping: boolean) {
        if (!this.chatSocket) return;
        this.chatSocket.emit('chat:typing', { conversationId, isTyping });
    }

    // ===== Chat Event Listeners =====

    onAck(cb: (ack: unknown) => void) {
        if (!this.chatSocket) return;
        this.chatSocket.on('chat:ack', cb);
    }

    offAck() {
        if (!this.chatSocket) return;
        this.chatSocket.off('chat:ack');
    }

    onMessageNew(cb: (payload: unknown) => void) {
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

    onTyping(cb: (payload: ChatTypingPayload) => void) {
        if (!this.chatSocket) return;
        this.chatSocket.on('chat:typing', cb);
    }

    offTyping() {
        if (!this.chatSocket) return;
        this.chatSocket.off('chat:typing');
    }

    onMessageReactionUpdated(
        cb: (payload: ChatMessageReactionPayload) => void,
    ) {
        if (!this.chatSocket) return;
        this.chatSocket.on('chat:message_reaction_updated', cb);
    }

    offMessageReactionUpdated() {
        if (!this.chatSocket) return;
        this.chatSocket.off('chat:message_reaction_updated');
    }

    onMessageRecalled(cb: (payload: ChatMessageRecalledPayload) => void) {
        if (!this.chatSocket) return;
        this.chatSocket.on('chat:message_recalled', cb);
    }

    offMessageRecalled() {
        if (!this.chatSocket) return;
        this.chatSocket.off('chat:message_recalled');
    }

    onMessageDeleted(cb: (payload: ChatMessageDeletedPayload) => void) {
        if (!this.chatSocket) return;
        this.chatSocket.on('chat:message_deleted', cb);
    }

    offMessageDeleted() {
        if (!this.chatSocket) return;
        this.chatSocket.off('chat:message_deleted');
    }

    onMessageSeen(cb: (payload: ChatMessageSeenPayload) => void) {
        if (!this.chatSocket) return;
        this.chatSocket.on('chat:message_seen', cb);
    }

    offMessageSeen() {
        if (!this.chatSocket) return;
        this.chatSocket.off('chat:message_seen');
    }

    onGroupAutoDeleteUpdated(
        cb: (payload: GroupAutoDeleteUpdatedPayload) => void,
    ) {
        if (!this.chatSocket) return;
        this.chatSocket.on('group:auto_delete_updated', cb);
    }

    offGroupAutoDeleteUpdated() {
        if (!this.chatSocket) return;
        this.chatSocket.off('group:auto_delete_updated');
    }

    onGroupMemberLeft(cb: (payload: GroupMemberLeftPayload) => void) {
        if (!this.chatSocket) return;
        this.chatSocket.on('group:member_left', cb);
    }

    offGroupMemberLeft() {
        if (!this.chatSocket) return;
        this.chatSocket.off('group:member_left');
    }

    onGroupAdminTransferred(
        cb: (payload: GroupAdminTransferredPayload) => void,
    ) {
        if (!this.chatSocket) return;
        this.chatSocket.on('group:admin_transferred', cb);
    }

    offGroupAdminTransferred() {
        if (!this.chatSocket) return;
        this.chatSocket.off('group:admin_transferred');
    }

    onGroupDissolved(cb: (payload: GroupDissolvedPayload) => void) {
        if (!this.chatSocket) return;
        this.chatSocket.on('group:dissolved', cb);
    }

    offGroupDissolved() {
        if (!this.chatSocket) return;
        this.chatSocket.off('group:dissolved');
    }

    onConversationHiddenUpdated(
        cb: (payload: ConversationHiddenUpdatedPayload) => void,
    ) {
        if (!this.chatSocket) return;
        this.chatSocket.on('conversation:hidden_updated', cb);
    }

    offConversationHiddenUpdated() {
        if (!this.chatSocket) return;
        this.chatSocket.off('conversation:hidden_updated');
    }

    onConversationHistoryCleared(
        cb: (payload: ConversationHistoryClearedPayload) => void,
    ) {
        if (!this.chatSocket) return;
        this.chatSocket.on('conversation:history_cleared', cb);
    }

    offConversationHistoryCleared() {
        if (!this.chatSocket) return;
        this.chatSocket.off('conversation:history_cleared');
    }

    onReconnect(cb: () => void) {
        if (!this.chatSocket) return;
        this.chatSocket.on('reconnect', cb);
    }

    offReconnect(cb: () => void) {
        if (!this.chatSocket) return;
        this.chatSocket.off('reconnect', cb);
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
    return chatSocketService.joinConversation(requestId, conversationId);
};

export const sendMessage = (data: {
    requestId: string;
    clientMessageId: string;
    conversationId: string;
    receiverId?: string;
    type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'call';
    content: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToMessageId?: string;
    forwardedFromMessageId?: string;
    callData?: {
        callType?: 'audio' | 'video';
        callStatus?: 'completed' | 'missed' | 'declined';
        duration?: number;
        isInitiator?: boolean;
        wasRejected?: boolean;
    };
}) => {
    return chatSocketService.sendMessage(data);
};

export const leaveConversation = (
    requestId: string,
    conversationId: string,
) => {
    return chatSocketService.leaveConversation(requestId, conversationId);
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

export const markMessageRead = (data: {
    requestId: string;
    conversationId: string;
    messageId: string;
}) => {
    return chatSocketService.markMessageRead(data);
};

export const onAck = (cb: (ack: unknown) => void) => {
    chatSocketService.onAck(cb);
};

export const offAck = () => {
    chatSocketService.offAck();
};

export const onMessageNew = (cb: (payload: unknown) => void) => {
    chatSocketService.onMessageNew(cb);
};

export const offMessageNew = () => {
    chatSocketService.offMessageNew();
};

export const onTyping = (cb: (payload: unknown) => void) => {
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

export const onMessageDeleted = (
    cb: (payload: ChatMessageDeletedPayload) => void,
) => {
    chatSocketService.onMessageDeleted(cb);
};

export const offMessageDeleted = () => {
    chatSocketService.offMessageDeleted();
};

export const onMessageSeen = (
    cb: (payload: ChatMessageSeenPayload) => void,
) => {
    chatSocketService.onMessageSeen(cb);
};

export const offMessageSeen = () => {
    chatSocketService.offMessageSeen();
};

export const onGroupAutoDeleteUpdated = (
    cb: (payload: GroupAutoDeleteUpdatedPayload) => void,
) => {
    chatSocketService.onGroupAutoDeleteUpdated(cb);
};

export const offGroupAutoDeleteUpdated = () => {
    chatSocketService.offGroupAutoDeleteUpdated();
};

export const onGroupMemberLeft = (
    cb: (payload: GroupMemberLeftPayload) => void,
) => {
    chatSocketService.onGroupMemberLeft(cb);
};

export const offGroupMemberLeft = () => {
    chatSocketService.offGroupMemberLeft();
};

export const onGroupAdminTransferred = (
    cb: (payload: GroupAdminTransferredPayload) => void,
) => {
    chatSocketService.onGroupAdminTransferred(cb);
};

export const offGroupAdminTransferred = () => {
    chatSocketService.offGroupAdminTransferred();
};

export const onGroupDissolved = (
    cb: (payload: GroupDissolvedPayload) => void,
) => {
    chatSocketService.onGroupDissolved(cb);
};

export const offGroupDissolved = () => {
    chatSocketService.offGroupDissolved();
};

export const onConversationHiddenUpdated = (
    cb: (payload: ConversationHiddenUpdatedPayload) => void,
) => {
    chatSocketService.onConversationHiddenUpdated(cb);
};

export const offConversationHiddenUpdated = () => {
    chatSocketService.offConversationHiddenUpdated();
};

export const onConversationHistoryCleared = (
    cb: (payload: ConversationHistoryClearedPayload) => void,
) => {
    chatSocketService.onConversationHistoryCleared(cb);
};

export const offConversationHistoryCleared = () => {
    chatSocketService.offConversationHistoryCleared();
};
