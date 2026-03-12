import React, { useEffect, useState, useRef } from 'react';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatHeader from '../../components/chat/ChatHeader';
import MessageList, {
    type SocketMessage,
} from '../../components/chat/MessageList';
import ChatInput from '../../components/chat/ChatInput';
import ConversationInfoPanel from '../../components/chat/ConversationInfoPanel';
import {
    connectSocket,
    disconnectSocket,
    sendMessage,
    onReceiveMessage,
    offReceiveMessage,
} from '../../services/socket';

// Tạo userId đơn giản từ localStorage (chưa có auth thật)
const USER_ID = (() => {
    let id = localStorage.getItem('chat_user_id');
    if (!id) {
        id = `user_${Math.random().toString(36).slice(2, 7)}`;
        localStorage.setItem('chat_user_id', id);
    }
    return id;
})();
const USERNAME = (() => {
    let name = localStorage.getItem('chat_username');
    if (!name) {
        name = `Guest_${USER_ID.slice(-4)}`;
        localStorage.setItem('chat_username', name);
    }
    return name;
})();

export const ChatPage: React.FC = () => {
    const [socketMessages, setSocketMessages] = useState<SocketMessage[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        connectSocket(USER_ID, USERNAME);

        onReceiveMessage((msg) => {
            setSocketMessages((prev) => [...prev, msg]);
        });

        return () => {
            offReceiveMessage();
            disconnectSocket();
        };
    }, []);

    // Tự scroll xuống khi có tin nhắn mới
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [socketMessages]);

    const handleSend = (text: string) => {
        sendMessage({
            senderId: USER_ID,
            senderName: USERNAME,
            content: text,
            timestamp: new Date().toISOString(),
        });
    };

    return (
        <div className="min-h-screen flex bg-var(--color-background) text-var(--color-text-primary)">
            <ChatSidebar />

            <div className="flex-1 flex flex-col">
                <ChatHeader />
                <MessageList
                    socketMessages={socketMessages}
                    currentUserId={USER_ID}
                />
                <div ref={bottomRef} />
                <ChatInput onSend={handleSend} />
            </div>

            <ConversationInfoPanel />
        </div>
    );
};

export default ChatPage;
