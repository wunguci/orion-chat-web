import React, { useEffect, useState, useRef, useCallback } from 'react';
import ChatSidebarWithConversationService from '../../components/chat/ChatSidebarWithConversationService';
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
    onMessageNew,
    offMessageNew,
} from '../../services/socket';
import {
    useConversations,
    useConversationDetail,
    useConversationMessages,
} from '../../hooks/useConversation';
import { conversationApi } from '../../services/conversationApi';
import type { MessageDetail } from '../../types/conversation';

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
    type ChatSocketMessage = SocketMessage & {
        conversationId?: string;
        type?: 'text' | 'image' | 'file' | 'audio';
    };

    type IncomingSocketPayload = {
        id?: string;
        _id?: string;
        clientMessageId?: string;
        senderId?: string;
        senderBy?: string;
        senderName?: string;
        content?: string;
        timestamp?: string;
        createdAt?: string;
        isFile?: boolean;
        type?: 'text' | 'image' | 'file' | 'audio';
        messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO';
        fileUrl?: string;
        mediaUrl?: string;
        fileName?: string;
        fileType?: string;
        conversationId?: string;
    };

    const [socketMessages, setSocketMessages] = useState<ChatSocketMessage[]>(
        [],
    );
    const [isConnecting, setIsConnecting] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<
        string | null
    >(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const messageListenerRef = useRef<
        ((msg: ChatSocketMessage) => void) | null
    >(null);

    // Fetch conversations
    const {
        conversations,
        loading: conversationsLoading,
        error: conversationsError,
        refreshConversations,
    } = useConversations(USER_ID);

    // Fetch selected conversation detail
    const { conversation: selectedConversation } = useConversationDetail(
        selectedConversationId || '',
        USER_ID,
    );

    // Fetch messages for selected conversation
    const { messages: paginatedMessages, addMessage: addPaginatedMessage } =
        useConversationMessages(selectedConversationId || '', USER_ID, 30);

    const getReceiverId = useCallback(() => {
        if (!selectedConversation) return '';

        const otherParticipant = selectedConversation.participants.find(
            (p) => p.userId !== USER_ID,
        );
        return otherParticipant?.userId ?? USER_ID;
    }, [selectedConversation]);

    const toSocketMessage = useCallback(
        (payload: IncomingSocketPayload): ChatSocketMessage => ({
            id:
                payload?.id ||
                payload?._id ||
                payload?.clientMessageId ||
                `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            senderId: payload?.senderId || payload?.senderBy || 'unknown',
            senderName:
                payload?.senderName ||
                selectedConversation?.participants.find(
                    (p) =>
                        p.userId === (payload?.senderId || payload?.senderBy),
                )?.fullName ||
                'Unknown',
            content: payload?.content || '',
            timestamp:
                payload?.timestamp ||
                payload?.createdAt ||
                new Date().toISOString(),
            isFile:
                payload?.isFile ||
                payload?.type === 'file' ||
                payload?.messageType === 'FILE',
            fileUrl: payload?.fileUrl || payload?.mediaUrl,
            fileName: payload?.fileName,
            fileType: payload?.fileType,
            conversationId: payload?.conversationId,
            type: payload?.type,
        }),
        [selectedConversation],
    );

    // Initialize socket connection
    useEffect(() => {
        const initializeSocket = async () => {
            try {
                setIsConnecting(true);
                await connectSocket(USER_ID);

                const messageHandler = (payload: IncomingSocketPayload) => {
                    const msg = toSocketMessage(payload);
                    setSocketMessages((prev) => [...prev, msg]);

                    // If message is for selected conversation, add it to paginated messages
                    if (
                        selectedConversationId &&
                        msg.conversationId === selectedConversationId
                    ) {
                        const messageDetail: MessageDetail = {
                            content: msg.content,
                            senderBy: msg.senderId,
                            conversationId: msg.conversationId,
                            messageType: msg.isFile ? 'FILE' : 'TEXT',
                            messageStatus: 'DELIVERED',
                            createdAt: msg.timestamp,
                            seenBy: [],
                            fileName: msg.fileName,
                            mediaUrl: msg.fileUrl,
                        };
                        addPaginatedMessage(messageDetail);
                    }
                };

                messageListenerRef.current = messageHandler;
                onMessageNew(messageHandler);
                setError(null);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to connect to chat',
                );
                console.error('Socket connection error:', err);
            } finally {
                setIsConnecting(false);
            }
        };

        initializeSocket();

        return () => {
            if (messageListenerRef.current) {
                offMessageNew();
            }
            disconnectSocket();
        };
    }, [selectedConversationId, addPaginatedMessage, toSocketMessage]);

    // Auto scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [socketMessages, paginatedMessages]);

    // Handle conversation selection
    const handleSelectConversation = useCallback((conversationId: string) => {
        setSelectedConversationId(conversationId);
        setSocketMessages([]); // Clear socket messages on new conversation
    }, []);

    // Handle sending message
    const handleSend = useCallback(
        async (text: string) => {
            if (!text.trim() || !selectedConversationId) return;

            try {
                // Send via socket
                sendMessage({
                    requestId: `req_${Date.now()}`,
                    clientMessageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    receiverId: getReceiverId(),
                    type: 'text',
                    content: text,
                    conversationId: selectedConversationId,
                });

                // Also save to backend via API
                await conversationApi.sendMessage(
                    selectedConversationId,
                    USER_ID,
                    text,
                    {
                        messageType: 'TEXT',
                    },
                );

                // Refresh conversations to update last message
                await refreshConversations();
            } catch (err) {
                console.error('Error sending message:', err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to send message',
                );
            }
        },
        [selectedConversationId, refreshConversations, getReceiverId],
    );

    // Handle sending file
    const handleSendFile = useCallback(
        async (file: File) => {
            if (!selectedConversationId) return;

            try {
                sendMessage({
                    requestId: `req_${Date.now()}`,
                    clientMessageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                    receiverId: getReceiverId(),
                    type: 'file',
                    content: file.name,
                    conversationId: selectedConversationId,
                });

                // Save to backend
                await conversationApi.sendMessage(
                    selectedConversationId,
                    USER_ID,
                    file.name,
                    {
                        messageType: 'FILE',
                        fileName: file.name,
                        fileSize: file.size,
                    },
                );

                await refreshConversations();
            } catch (err) {
                console.error('Error sending file:', err);
                setError(
                    err instanceof Error ? err.message : 'Failed to send file',
                );
            }
        },
        [selectedConversationId, refreshConversations, getReceiverId],
    );

    // Combine paginated messages and socket messages
    const getSenderName = useCallback(
        (senderId?: string) => {
            if (!senderId) return 'Unknown';
            if (senderId === USER_ID) return USERNAME;

            return (
                selectedConversation?.participants.find(
                    (p) => p.userId === senderId,
                )?.fullName || 'Unknown'
            );
        },
        [selectedConversation],
    );

    const paginatedAsSocketMessages: SocketMessage[] = paginatedMessages.map(
        (m, idx) => ({
            id:
                m.clientMessageId ||
                `${m.senderBy || 'unknown'}_${String(m.createdAt || idx)}`,
            senderId: m.senderBy || 'unknown',
            senderName: getSenderName(m.senderBy),
            content: m.content || '',
            timestamp:
                typeof m.createdAt === 'string'
                    ? m.createdAt
                    : (m.createdAt?.toISOString() ?? new Date().toISOString()),
            isFile: m.messageType === 'FILE' || m.messageType === 'IMAGE',
            fileUrl: m.mediaUrl,
            fileName: m.fileName,
            fileType: m.messageType === 'IMAGE' ? 'image/*' : undefined,
        }),
    );

    const displayMessages: SocketMessage[] = [
        ...paginatedAsSocketMessages,
        ...socketMessages.filter(
            (sm) =>
                sm.conversationId === selectedConversationId ||
                !selectedConversationId,
        ),
    ];

    return (
        <div className="flex h-screen gap-4 bg-gray-50 p-4">
            {/* Sidebar */}
            <ChatSidebarWithConversationService
                conversations={conversations}
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleSelectConversation}
                loading={conversationsLoading}
                error={conversationsError}
            />

            {/* Main chat area */}
            <div className="flex flex-1 flex-col rounded-lg bg-white shadow-sm">
                {isConnecting && (
                    <div className="border-b border-gray-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                        Connecting to chat...
                    </div>
                )}

                {error && (
                    <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-2 text-red-600 hover:text-red-700"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {selectedConversation ? (
                    <>
                        {/* Header */}
                        <ChatHeader
                            name={
                                selectedConversation.groupInfo?.groupName ||
                                selectedConversation.participants.find(
                                    (p) => p.userId !== USER_ID,
                                )?.fullName ||
                                'Conversation'
                            }
                        />

                        {/* Messages */}
                        <MessageList
                            socketMessages={displayMessages}
                            currentUserId={USER_ID}
                        />

                        {/* Input */}
                        <ChatInput
                            onSend={handleSend}
                            onSendFile={handleSendFile}
                        />

                        <div ref={bottomRef} />
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-gray-400">
                        {conversationsLoading ? (
                            <div>Loading conversations...</div>
                        ) : conversations.length === 0 ? (
                            <div>No conversations yet. Start a new chat!</div>
                        ) : (
                            <div>Select a conversation to start chatting</div>
                        )}
                    </div>
                )}
            </div>

            {/* Conversation info panel */}
            {selectedConversation && <ConversationInfoPanel />}
        </div>
    );
};
