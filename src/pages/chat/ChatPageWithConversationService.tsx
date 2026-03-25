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
    joinConversation,
    onMessageNew,
    offMessageNew,
} from '../../services/socket';
import {
    useConversations,
    useConversationDetail,
    useConversationMessages,
} from '../../hooks/useConversation';
import { conversationApi } from '../../services/conversationApi';
import { getCurrentUserId, getCurrentUserName } from '../../utils/auth';

const USER_ID = getCurrentUserId();
const USERNAME = getCurrentUserName();

export const ChatPage: React.FC = () => {
    type ChatSocketMessage = SocketMessage & {
        clientMessageId?: string;
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
        messageType?:
            | 'TEXT'
            | 'IMAGE'
            | 'FILE'
            | 'VIDEO'
            | 'AUDIO'
            | 'text'
            | 'image'
            | 'file'
            | 'video'
            | 'audio';
        fileUrl?: string;
        mediaUrl?: string;
        fileName?: string;
        fileType?: string;
        conversationId?: string;
        message?: Partial<IncomingSocketPayload>;
        data?: Partial<IncomingSocketPayload>;
    };

    const [socketMessages, setSocketMessages] = useState<ChatSocketMessage[]>(
        [],
    );
    const [isConnecting, setIsConnecting] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<
        string | null
    >(null);
    const messageListenerRef = useRef<
        ((msg: ChatSocketMessage) => void) | null
    >(null);

    // Fetch conversations
    const {
        conversations,
        loading: conversationsLoading,
        error: conversationsError,
    } = useConversations(USER_ID);

    // Fetch selected conversation detail
    const { conversation: selectedConversation } = useConversationDetail(
        selectedConversationId || '',
        USER_ID,
    );

    // Fetch messages for selected conversation
    const { messages: paginatedMessages } = useConversationMessages(
        selectedConversationId || '',
        USER_ID,
        30,
    );

    const getReceiverId = useCallback(() => {
        if (!selectedConversation) return '';

        const otherParticipant = selectedConversation.participants?.find(
            (p) => p.userId !== USER_ID,
        );
        return otherParticipant?.userId ?? USER_ID;
    }, [selectedConversation]);

    const toSocketMessage = useCallback(
        (payload: IncomingSocketPayload): ChatSocketMessage => {
            const messageType = payload?.messageType || payload?.type;
            const isImageType =
                messageType === 'IMAGE' ||
                messageType === 'image' ||
                payload?.fileType?.startsWith('image/');

            return {
                id:
                    payload?.id ||
                    payload?._id ||
                    payload?.clientMessageId ||
                    `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                clientMessageId: payload?.clientMessageId,
                senderId: payload?.senderId || payload?.senderBy || 'unknown',
                senderName: payload?.senderName || 'Unknown',
                content: payload?.content || '',
                timestamp:
                    payload?.timestamp ||
                    payload?.createdAt ||
                    new Date().toISOString(),
                isFile:
                    payload?.isFile ||
                    payload?.type === 'file' ||
                    payload?.type === 'image' ||
                    messageType === 'FILE' ||
                    messageType === 'IMAGE' ||
                    messageType === 'file' ||
                    messageType === 'image',
                fileUrl: payload?.fileUrl || payload?.mediaUrl,
                fileName: payload?.fileName,
                fileType:
                    payload?.fileType || (isImageType ? 'image/*' : undefined),
                conversationId: payload?.conversationId,
                type: payload?.type,
            };
        },
        [],
    );

    // Initialize socket connection
    useEffect(() => {
        const initializeSocket = async () => {
            try {
                setIsConnecting(true);
                await connectSocket(USER_ID);

                const messageHandler = (payload: IncomingSocketPayload) => {
                    const rawPayload =
                        payload?.message || payload?.data || payload;
                    const msg = toSocketMessage(rawPayload);

                    const hasVisibleContent =
                        msg.content.trim().length > 0 ||
                        (msg.isFile && !!msg.fileUrl);

                    if (!hasVisibleContent || !msg.conversationId) {
                        return;
                    }

                    setSocketMessages((prev) => {
                        const existingIndex = prev.findIndex(
                            (p) =>
                                (!!msg.clientMessageId &&
                                    p.clientMessageId ===
                                        msg.clientMessageId) ||
                                p.id === msg.id,
                        );

                        if (existingIndex >= 0) {
                            const next = [...prev];
                            next[existingIndex] = {
                                ...next[existingIndex],
                                ...msg,
                            };
                            return next;
                        }

                        return [...prev, msg];
                    });
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
    }, [toSocketMessage]);

    // Handle conversation selection
    const handleSelectConversation = useCallback((conversationId: string) => {
        setSelectedConversationId(conversationId);
        setSocketMessages([]); // Clear socket messages on new conversation
    }, []);

    useEffect(() => {
        if (!selectedConversationId) return;
        joinConversation(`join_${Date.now()}`, selectedConversationId);
    }, [selectedConversationId]);

    // Handle sending message
    const handleSend = useCallback(
        async (text: string) => {
            if (!text.trim() || !selectedConversationId) return;

            try {
                const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

                setSocketMessages((prev) => [
                    ...prev,
                    {
                        id: clientMessageId,
                        clientMessageId,
                        senderId: USER_ID,
                        senderName: USERNAME,
                        content: text,
                        timestamp: new Date().toISOString(),
                        conversationId: selectedConversationId,
                        type: 'text',
                    },
                ]);

                // Send via socket
                sendMessage({
                    requestId: `req_${Date.now()}`,
                    clientMessageId,
                    receiverId: getReceiverId(),
                    type: 'text',
                    content: text,
                    conversationId: selectedConversationId,
                });
            } catch (err) {
                console.error('Error sending message:', err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to send message',
                );
            }
        },
        [selectedConversationId, getReceiverId],
    );

    // Handle sending file
    const handleSendFile = useCallback(
        async (file: File) => {
            if (!selectedConversationId) return;

            try {
                const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

                // Determine file type
                const fileType = file.type;
                const isImage = fileType.startsWith('image/');
                const messageType = isImage ? 'image' : 'file';

                // Create local preview URL for immediate display
                const tempFileUrl = URL.createObjectURL(file);

                // Add temporary message with local preview
                setSocketMessages((prev) => [
                    ...prev,
                    {
                        id: clientMessageId,
                        clientMessageId,
                        senderId: USER_ID,
                        senderName: USERNAME,
                        content: file.name,
                        timestamp: new Date().toISOString(),
                        conversationId: selectedConversationId,
                        type: messageType,
                        isFile: true,
                        fileName: file.name,
                        fileUrl: tempFileUrl, // Use blob URL for immediate display
                        fileType: fileType,
                    },
                ]);

                // Upload file first because backend requires mediaUrl for media messages
                let serverFileUrl = '';
                let uploadedFileType = fileType;

                try {
                    const uploadResponse = await conversationApi.uploadFile(
                        file,
                        selectedConversationId,
                        USER_ID,
                    );
                    serverFileUrl = uploadResponse.mediaUrl;
                    uploadedFileType = uploadResponse.mimeType || fileType;

                    // Update the message with server URL after successful upload
                    setSocketMessages((prev) =>
                        prev.map((msg) =>
                            msg.clientMessageId === clientMessageId
                                ? {
                                      ...msg,
                                      fileUrl: serverFileUrl,
                                      fileType: uploadedFileType,
                                  }
                                : msg,
                        ),
                    );
                } catch (uploadErr) {
                    URL.revokeObjectURL(tempFileUrl);
                    setSocketMessages((prev) =>
                        prev.filter(
                            (msg) => msg.clientMessageId !== clientMessageId,
                        ),
                    );
                    throw uploadErr;
                }

                // Send message via socket with file URL
                sendMessage({
                    requestId: `req_${Date.now()}`,
                    clientMessageId,
                    receiverId: getReceiverId(),
                    type: messageType as 'image' | 'file',
                    content: file.name,
                    mediaUrl: serverFileUrl,
                    fileName: file.name,
                    fileSize: file.size,
                    conversationId: selectedConversationId,
                });
            } catch (err) {
                console.error('Error sending file:', err);
                setError(
                    err instanceof Error ? err.message : 'Failed to send file',
                );
            }
        },
        [selectedConversationId, getReceiverId],
    );

    // Combine paginated messages and socket messages
    const getSenderName = useCallback(
        (senderId?: string) => {
            if (!senderId) return 'Unknown';
            if (senderId === USER_ID) return USERNAME;

            return (
                selectedConversation?.participants?.find(
                    (p) => p.userId === senderId,
                )?.fullName || 'Unknown'
            );
        },
        [selectedConversation],
    );

    const paginatedAsSocketMessages: SocketMessage[] = paginatedMessages.map(
        (m, idx) => ({
            id:
                m._id ||
                m.clientMessageId ||
                `${m.senderBy || 'unknown'}_${String(m.createdAt || idx)}`,
            clientMessageId: m.clientMessageId,
            senderId: m.senderBy || 'unknown',
            senderName: getSenderName(m.senderBy),
            content: m.content || '',
            timestamp:
                typeof m.createdAt === 'string'
                    ? m.createdAt
                    : (m.createdAt?.toISOString() ?? new Date().toISOString()),
            isFile:
                m.messageType === 'FILE' ||
                m.messageType === 'IMAGE' ||
                m.messageType === 'file' ||
                m.messageType === 'image',
            fileUrl: m.mediaUrl,
            fileName: m.fileName,
            fileType:
                m.messageType === 'IMAGE' || m.messageType === 'image'
                    ? 'image/*'
                    : undefined,
        }),
    );

    const mergedMessages: SocketMessage[] = [
        ...paginatedAsSocketMessages,
        ...socketMessages.filter(
            (sm) => sm.conversationId === selectedConversationId,
        ),
    ];

    const messageMap = new Map<string, SocketMessage>();
    for (const message of mergedMessages) {
        const hasVisibleContent =
            message.content.trim().length > 0 ||
            (message.isFile && !!message.fileUrl);
        if (!hasVisibleContent) continue;

        const key =
            (message as ChatSocketMessage).clientMessageId ||
            message.id ||
            `${message.senderId}_${message.timestamp}_${message.content}_${message.fileUrl || ''}`;

        if (!messageMap.has(key)) {
            messageMap.set(key, message);
        }
    }

    const displayMessages: SocketMessage[] = Array.from(messageMap.values())
        .sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();

            const safeA = Number.isNaN(timeA) ? 0 : timeA;
            const safeB = Number.isNaN(timeB) ? 0 : timeB;

            return safeA - safeB;
        })
        .map((msg) => ({
            ...msg,
            senderId: msg.senderId || USER_ID,
            senderName: msg.senderName || getSenderName(msg.senderId),
        }));

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
                                selectedConversation.participants?.find(
                                    (p) => p.userId !== USER_ID,
                                )?.fullName ||
                                'Conversation'
                            }
                        />

                        {/* Messages */}
                        <MessageList
                            socketMessages={displayMessages}
                            currentUserId={USER_ID}
                            conversationId={selectedConversationId}
                        />

                        {/* Input */}
                        <ChatInput
                            onSend={handleSend}
                            onSendFile={handleSendFile}
                        />
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
