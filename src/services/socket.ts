import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const connectSocket = (userId: string, username: string): Socket => {
    if (socket?.connected) return socket;

    socket = io(SERVER_URL, { transports: ['websocket'] });

    socket.on('connect', () => {
        console.log('✅ WebSocket connected:', socket?.id);
        socket?.emit('register', { userId, username });
    });

    socket.on('connect_error', (err) => {
        console.error('❌ Lỗi kết nối:', err.message);
    });

    return socket;
};

export const disconnectSocket = () => {
    socket?.disconnect();
    socket = null;
};
export const getSocket = () => socket;

export const sendMessage = (data: {
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
}) => socket?.emit('send_message', data);

export const onReceiveMessage = (
    callback: (msg: {
        id: string;
        senderId: string;
        senderName: string;
        content: string;
        timestamp: string;
    }) => void,
) => socket?.on('receive_message', callback);

export const offReceiveMessage = () => socket?.off('receive_message');

export const onOnlineUsers = (
    callback: (users: { userId: string; username: string }[]) => void,
) => socket?.on('online_users', callback);

export const uploadFile = async (
    file: File,
): Promise<{
    url: string;
    name: string;
    type: string;
}> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${SERVER_URL}/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) throw new Error('Upload thất bại');
    return res.json();
};

export const sendFileMessage = (data: {
    senderId: string;
    senderName: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    timestamp: string;
}) => socket?.emit('send_message', { ...data, content: '', isFile: true });