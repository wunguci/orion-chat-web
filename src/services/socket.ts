import { io, Socket } from 'socket.io-client';

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

export const onTyping = (cb: (payload: any) => void) => {
    if (!socket) return;
    socket.on('chat:typing', cb);
};

export const offTyping = () => {
    if (!socket) return;
    socket.off('chat:typing');
};
