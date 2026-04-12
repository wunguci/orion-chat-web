import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import ChatSidebarWithConversationService from '../../components/chat/ChatSidebarWithConversationService';
import ChatHeader from '../../components/chat/ChatHeader';
import MessageList, {
    type SocketMessage,
} from '../../components/chat/MessageList';
import ChatInput from '../../components/chat/ChatInput';
import { ConversationInfoPanel } from '../../components/chat/ConversationInfoPanel';
import { SearchModal } from '../../components/chat/SearchModal';
import Modal from '../../components/common/Modal';
import { Dialog } from '../../components/common/Dialog';
import {
    joinConversation,
    sendMessage,
    offMessageNew,
    onMessageNew,
    onMessageReactionUpdated,
    onMessageRecalled,
    offMessageReactionUpdated,
    offMessageRecalled,
    disconnectSocket,
    chatSocketService,
} from '../../services/socket';
import {
    useConversations,
    useConversationDetail,
    useConversationMessages,
} from '../../hooks/useConversation';
import { conversationApi } from '../../services/conversationApi';
import { getCurrentUserId, getCurrentUserName } from '../../utils/auth';
import { debugAuthStatus } from '../../utils/token';
import { getUserInfo } from '../../services/userService';

const mergeMessageForRealtimePreview = (
    existing: SocketMessage,
    incoming: SocketMessage,
): SocketMessage => {
    return {
        ...existing,
        ...incoming,
        content: incoming.content || existing.content,
        fileUrl: incoming.fileUrl || existing.fileUrl,
        fileName: incoming.fileName || existing.fileName,
        fileType: incoming.fileType || existing.fileType,
        type: incoming.type || existing.type,
        isFile:
            typeof incoming.isFile === 'boolean'
                ? incoming.isFile
                : existing.isFile,
    };
};

export const ChatPage: React.FC = () => {
    type ChatSocketMessage = SocketMessage & {
        clientMessageId?: string;
        conversationId?: string;
        type?: 'text' | 'image' | 'file' | 'audio' | 'video';
    };

    type IncomingSocketPayload = {
        messageId?: string;
        id?: string;
        _id?: string;
        clientMessageId?: string;
        senderId?: string;
        senderBy?: string;
        senderName?: string;
        senderAvatar?: string;
        content?: string;
        timestamp?: string;
        createdAt?: string;
        isFile?: boolean;
        type?: 'text' | 'image' | 'file' | 'audio' | 'video';
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
        mimeType?: string;
        isDeleted?: boolean;
        isRecalled?: boolean;
        reactions?: Array<{
            userId?: string;
            emoji?: string;
            reactedAt?: string;
        }>;
        conversationId?: string;
        message?: Partial<IncomingSocketPayload>;
        data?: Partial<IncomingSocketPayload>;
    };

    // Chuẩn hóa message type để dùng chung cho mọi nguồn dữ liệu (socket/api)
    const normalizeMessageType = (rawType?: string) => {
        if (!rawType) return undefined;
        const normalized = rawType.toLowerCase();

        if (
            normalized === 'text' ||
            normalized === 'image' ||
            normalized === 'file' ||
            normalized === 'audio' ||
            normalized === 'video'
        ) {
            return normalized as 'text' | 'image' | 'file' | 'audio' | 'video';
        }

        return undefined;
    };

    // ✅ Get user ID inside component (after auth is loaded)
    const USER_ID = getCurrentUserId();
    const USERNAME = getCurrentUserName();
    const location = useLocation();

    const [socketMessages, setSocketMessages] = useState<ChatSocketMessage[]>(
        [],
    );
    const [isConnecting, setIsConnecting] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<
        string | null
    >(null);
    const [hiddenMessageKeys, setHiddenMessageKeys] = useState<Set<string>>(
        new Set(),
    );
    // Theo dõi các message đã thu hồi theo thời gian thực để áp dụng cho cả dữ liệu phân trang + socket.
    const [recalledMessageIds, setRecalledMessageIds] = useState<Set<string>>(
        new Set(),
    );
    const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
    const [forwardingMessage, setForwardingMessage] =
        useState<SocketMessage | null>(null);
    const [forwardTargetConversationId, setForwardTargetConversationId] =
        useState('');
    const [isForwarding, setIsForwarding] = useState(false);
    const [isRecallConfirmOpen, setIsRecallConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [pendingRecallMessage, setPendingRecallMessage] =
        useState<SocketMessage | null>(null);
    const [pendingDeleteMessage, setPendingDeleteMessage] =
        useState<SocketMessage | null>(null);
    const [reactionOverrides, setReactionOverrides] = useState<
        Record<string, NonNullable<SocketMessage['reactions']>>
    >({});
    const [iAmBlocked, setIAmBlocked] = useState(false); // Current user is blocked
    const [iAmTheBlocker, setIAmTheBlocker] = useState(false); // Current user is the blocker (can unblock)
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(true); // Track conversation info panel visibility
    const [isSearchOpen, setIsSearchOpen] = useState(false); // Track search panel visibility
    const messageListenerRef = useRef<
        ((msg: ChatSocketMessage) => void) | null
    >(null);

    // ✅ Fetch all conversations (for sidebar + forward modal)
    const {
        conversations,
        loading: conversationsLoading,
        error: conversationsError,
        refreshConversations,
    } = useConversations();

    // Fetch selected conversation detail
    // ✅ No need to pass USER_ID - JWT token from localStorage is used
    const { conversation: selectedConversation } = useConversationDetail(
        selectedConversationId || '',
    );

    // Fetch messages for selected conversation
    // ✅ No need to pass USER_ID - JWT token from localStorage is used
    const { messages: paginatedMessages } = useConversationMessages(
        selectedConversationId || '',
        30,
    );

    const getReceiverId = useCallback(() => {
        if (!selectedConversation) return '';

        const otherParticipant = selectedConversation.participants?.find(
            (p) => p.userId !== USER_ID,
        );
        return otherParticipant?.userId ?? USER_ID;
    }, [selectedConversation, USER_ID]);

    const getMessageKey = useCallback(
        (message: Pick<SocketMessage, 'id' | 'clientMessageId'>) =>
            message.clientMessageId || message.id,
        [],
    );

    // Đánh dấu message đã thu hồi theo realtime (dùng cho cả local optimistic và event từ socket).
    const markMessageAsRecalled = useCallback((messageId?: string) => {
        if (!messageId) return;

        setRecalledMessageIds((prev) => {
            const next = new Set(prev);
            next.add(messageId);
            return next;
        });
    }, []);

    // ✅ Helper function to load block status
    const loadBlockStatus = useCallback(
        async (convId?: string) => {
            const conversationId =
                convId || selectedConversation?.conversationId;
            if (!conversationId) {
                setIAmBlocked(false);
                setIAmTheBlocker(false);
                return;
            }

            try {
                const response =
                    await conversationApi.getBlockStatus(conversationId);
                // Backend response:
                // - iAmBlocked: current user bị chặn
                // - iAmTheBlocker: current user là người chặn (có nút bỏ chặn)
                setIAmBlocked(response?.iAmBlocked || false);
                setIAmTheBlocker(response?.iAmTheBlocker || false);
            } catch (error) {
                console.error('Error loading block status:', error);
                setIAmBlocked(false);
                setIAmTheBlocker(false);
            }
        },
        [selectedConversation?.conversationId],
    );

    // ✅ Load block status when conversation changes
    useEffect(() => {
        loadBlockStatus();
    }, [loadBlockStatus]);

    // ✅ Auto-select conversation from location state (e.g., from friend chat click)
    useEffect(() => {
        const state = location.state as {
            selectedConversationId?: string;
        } | null;
        if (state?.selectedConversationId && !selectedConversationId) {
            setSelectedConversationId(state.selectedConversationId);
        }
    }, [location.state, selectedConversationId]);

    // ✅ Poll block status every 5 seconds to detect when other user blocks/unblocks
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (selectedConversation?.conversationId) {
                loadBlockStatus();
            }
        }, 5000); // Poll mỗi 5 giây

        return () => clearInterval(intervalId);
    }, [loadBlockStatus, selectedConversation?.conversationId]);

    // ✅ Refresh conversations when navigating from friend page (new conversation created)
    useEffect(() => {
        if (location.state?.selectedConversationId) {
            // Wait a moment for backend to fully process conversation creation
            const timer = setTimeout(() => {
                refreshConversations();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [location.state?.selectedConversationId, refreshConversations]);

    const getReceiverIdByConversationId = useCallback(
        (conversationId: string) => {
            const conversation = conversations.find(
                (item) => item.conversationId === conversationId,
            );
            const otherParticipant = conversation?.participants?.find(
                (p) => p.userId !== USER_ID,
            );
            return otherParticipant?.userId || '';
        },
        [conversations, USER_ID],
    );

    // ✅ Handle unblock user - chỉ người chặn mới có thể mở chặn
    const handleUnblockUser = async () => {
        if (!selectedConversation?.conversationId) return;

        // Verify current user là người chặn (iAmTheBlocker)
        if (!iAmTheBlocker) {
            console.error('Only the person who blocked can unblock');
            return;
        }

        try {
            await conversationApi.unblockUser(
                selectedConversation.conversationId,
            );
            // Reload block status immediately để cả 2 bên đều biết
            await loadBlockStatus();
        } catch (error) {
            console.error('Error unblocking user:', error);
        }
    };

    const toSocketMessage = useCallback(
        (payload: IncomingSocketPayload): ChatSocketMessage => {
            const messageType = payload?.messageType || payload?.type;
            const normalizedMessageType = normalizeMessageType(
                typeof messageType === 'string' ? messageType : undefined,
            );
            const isImageType =
                messageType === 'IMAGE' ||
                messageType === 'image' ||
                payload?.fileType?.startsWith('image/') ||
                payload?.mimeType?.startsWith('image/');

            // ✅ Better fileType inference from messageType
            let inferredFileType = payload?.fileType || payload?.mimeType;
            if (!inferredFileType && messageType) {
                const type = messageType.toLowerCase();
                if (type === 'image') {
                    inferredFileType = 'image/jpeg'; // Default image MIME type
                } else if (type === 'video') {
                    inferredFileType = 'video/mp4'; // Default video MIME type
                }
            }

            // Get sender ID and use it as fallback for name
            const senderId =
                payload?.senderId || payload?.senderBy || 'unknown';

            return {
                id:
                    payload?.messageId ||
                    payload?.id ||
                    payload?._id ||
                    payload?.clientMessageId ||
                    `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                clientMessageId: payload?.clientMessageId,
                senderId: senderId,
                // Use senderName if provided, otherwise use senderId (phone/userId) as fallback
                senderName: payload?.senderName || senderId,
                senderAvatar: payload?.senderAvatar,
                content: payload?.content || '',
                timestamp:
                    payload?.timestamp ||
                    payload?.createdAt ||
                    new Date().toISOString(),
                isFile:
                    payload?.isFile ||
                    payload?.type === 'file' ||
                    payload?.type === 'image' ||
                    payload?.type === 'video' ||
                    messageType === 'FILE' ||
                    messageType === 'IMAGE' ||
                    messageType === 'VIDEO' ||
                    messageType === 'file' ||
                    messageType === 'image' ||
                    messageType === 'video',
                fileUrl: payload?.fileUrl || payload?.mediaUrl,
                fileName: payload?.fileName,
                fileType:
                    inferredFileType || (isImageType ? 'image/*' : undefined),
                isRecalled: payload?.isRecalled || payload?.isDeleted,
                reactions: Array.isArray(payload?.reactions)
                    ? payload.reactions
                          .filter((reaction) => !!reaction?.emoji)
                          .map((reaction) => ({
                              userId: reaction?.userId || '',
                              emoji: reaction?.emoji || '',
                              reactedAt: reaction?.reactedAt,
                          }))
                    : [],
                conversationId: payload?.conversationId,
                type: normalizedMessageType,
            };
        },
        [],
    );

    // Initialize socket connection
    useEffect(() => {
        const initializeSocket = async () => {
            try {
                setIsConnecting(true);

                // ✅ Debug: Check authentication status
                debugAuthStatus();

                // ✅ Connect using JWT token from localStorage (no userId parameter needed)
                chatSocketService.connect();

                const messageHandler = (payload: IncomingSocketPayload) => {
                    const rawPayload =
                        payload?.message || payload?.data || payload;
                    const msg = toSocketMessage(rawPayload);

                    const hasVisibleContent =
                        msg.isRecalled ||
                        msg.content.trim().length > 0 ||
                        (msg.isFile && !!msg.fileUrl);

                    if (!hasVisibleContent || !msg.conversationId) {
                        console.warn(
                            '[ChatPage] Message filtered out - no visible content or conversationId',
                        );
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
                            next[existingIndex] =
                                mergeMessageForRealtimePreview(
                                    next[existingIndex],
                                    msg,
                                );
                            return next;
                        }

                        return [...prev, msg];
                    });

                    // ✅ Update sidebar with latest message
                    refreshConversations();
                };

                const reactionHandler = (payload: {
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
                }) => {
                    if (payload.conversationId !== selectedConversationId)
                        return;

                    setSocketMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === payload.messageId
                                ? {
                                      ...msg,
                                      reactions: payload.reactions,
                                  }
                                : msg,
                        ),
                    );

                    setReactionOverrides((prev) => ({
                        ...prev,
                        [payload.messageId]: payload.reactions,
                    }));
                };

                const recallHandler = (payload: {
                    conversationId: string;
                    messageId: string;
                    revokedBy: string;
                    revokedAt: string;
                    isRevoked?: boolean;
                }) => {
                    if (payload.conversationId !== selectedConversationId)
                        return;

                    // Đảm bảo message từ API pagination cũng đổi trạng thái ngay mà không cần reload.
                    markMessageAsRecalled(payload.messageId);

                    setSocketMessages((prev) => {
                        // ✅ ONLY update existing messages - DO NOT push new placeholder messages
                        // This prevents duplicate "Tin nhắn đã được thu hồi" appearing
                        const updated = prev.map((msg) => {
                            // Check both id AND clientMessageId for proper matching
                            if (
                                msg.id === payload.messageId ||
                                msg.clientMessageId === payload.messageId
                            ) {
                                return {
                                    ...msg,
                                    isRecalled: true,
                                    // Keep original content in memory for auditing
                                };
                            }
                            return msg;
                        });

                        return updated;
                    });
                    // isRecalled property is now the single source of truth
                    // No redundant recalledMessageKeys Set tracking

                    // ✅ Update sidebar to show "Tin nhắn đã được thu hồi" in real-time
                    refreshConversations();
                };

                messageListenerRef.current = messageHandler;

                onMessageNew(messageHandler);

                onMessageReactionUpdated(reactionHandler);

                onMessageRecalled(recallHandler);

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
            offMessageReactionUpdated();
            offMessageRecalled();
            disconnectSocket();
        };
    }, [
        toSocketMessage,
        selectedConversationId,
        refreshConversations,
        markMessageAsRecalled,
    ]);

    // Handle conversation selection
    const handleSelectConversation = useCallback((conversationId: string) => {
        setSelectedConversationId(conversationId);
        setSocketMessages([]); // Clear socket messages on new conversation
    }, []);

    useEffect(() => {
        if (!selectedConversationId) return;
        joinConversation(`join_${Date.now()}`, selectedConversationId);
    }, [selectedConversationId]);

    useEffect(() => {
        // Reset override recall theo từng conversation để tránh ảnh hưởng chéo.
        setRecalledMessageIds(new Set());
    }, [selectedConversationId]);

    // Enhance sender names for messages that only have phone numbers (backward compatibility)
    // New messages from backend already include senderName
    useEffect(() => {
        if (socketMessages.length === 0) return;

        // Find messages with only phone numbers as sender names (need enrichment)
        const messagesToEnrich = socketMessages.filter(
            (msg) =>
                msg.senderName &&
                /^\d{10,11}$/.test(msg.senderName) && // Looks like a phone number
                msg.senderName === msg.senderId, // senderName is same as senderId (not enriched yet)
        );

        if (messagesToEnrich.length === 0) return;

        // Collect unique sender IDs that need enrichment
        const uniqueSenderIds = new Set(
            messagesToEnrich.map((msg) => msg.senderId),
        );

        // Fetch user info for senders with only phone numbers
        const enrichSenderNames = async () => {
            for (const senderId of uniqueSenderIds) {
                if (!senderId) continue;

                try {
                    const userInfo = await getUserInfo(senderId);
                    if (userInfo?.fullName && userInfo.fullName !== senderId) {
                        // Update messages with actual sender name
                        setSocketMessages((prev) =>
                            prev.map((msg) =>
                                msg.senderId === senderId &&
                                /^\d{10,11}$/.test(msg.senderName)
                                    ? { ...msg, senderName: userInfo.fullName }
                                    : msg,
                            ),
                        );
                    }
                } catch (err) {
                    console.warn(
                        `[ChatPage] Failed to enrich user info for ${senderId}:`,
                        err,
                    );
                }
            }
        };

        enrichSenderNames();
    }, [socketMessages]);

    const recallLocalMessage = useCallback(
        (message: SocketMessage) => {
            // Optimistic update: bên gửi thấy đổi ngay lập tức.
            markMessageAsRecalled(message.id);
            if (message.clientMessageId) {
                markMessageAsRecalled(message.clientMessageId);
            }

            setSocketMessages((prev) =>
                prev.map((msg) => {
                    const sameMessage =
                        (message.clientMessageId &&
                            msg.clientMessageId === message.clientMessageId) ||
                        msg.id === message.id;

                    if (!sameMessage) return msg;

                    return {
                        ...msg,
                        content: '',
                        isFile: false,
                        fileUrl: undefined,
                        fileName: undefined,
                        fileType: undefined,
                        isRecalled: true,
                    };
                }),
            );
        },
        [markMessageAsRecalled],
    );

    const executeRecallMessage = useCallback(
        async (message: SocketMessage) => {
            if (!selectedConversationId || message.senderId !== USER_ID) return;

            recallLocalMessage(message);

            if (message.id.startsWith('msg_')) return;

            try {
                await conversationApi.recallMessage(
                    selectedConversationId,
                    message.id,
                );
            } catch (err) {
                console.error('Error recalling message:', err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to recall message',
                );
            }
        },
        [selectedConversationId, recallLocalMessage, USER_ID],
    );

    const executeDeleteMessage = useCallback(
        async (message: SocketMessage) => {
            const messageKey = getMessageKey(message);
            setHiddenMessageKeys((prev) => {
                const next = new Set(prev);
                next.add(messageKey);
                return next;
            });

            if (!selectedConversationId || message.id.startsWith('msg_')) {
                return;
            }

            try {
                await conversationApi.deleteMessageForMe(
                    selectedConversationId,
                    message.id,
                );
            } catch (err) {
                setHiddenMessageKeys((prev) => {
                    const next = new Set(prev);
                    next.delete(messageKey);
                    return next;
                });
                console.error('Error deleting message for me:', err);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to delete message for me',
                );
            }
        },
        [getMessageKey, selectedConversationId],
    );

    const handleRequestRecallMessage = useCallback((message: SocketMessage) => {
        setPendingRecallMessage(message);
        setIsRecallConfirmOpen(true);
    }, []);

    const handleRequestDeleteMessage = useCallback((message: SocketMessage) => {
        setPendingDeleteMessage(message);
        setIsDeleteConfirmOpen(true);
    }, []);

    const handleConfirmRecallMessage = useCallback(async () => {
        if (!pendingRecallMessage) return;
        await executeRecallMessage(pendingRecallMessage);
        setPendingRecallMessage(null);
        setIsRecallConfirmOpen(false);
    }, [pendingRecallMessage, executeRecallMessage]);

    const handleConfirmDeleteMessage = useCallback(async () => {
        if (!pendingDeleteMessage) return;
        await executeDeleteMessage(pendingDeleteMessage);
        setPendingDeleteMessage(null);
        setIsDeleteConfirmOpen(false);
    }, [pendingDeleteMessage, executeDeleteMessage]);

    const handleReactMessage = useCallback(
        async (message: SocketMessage, emoji: string) => {
            if (!selectedConversationId || message.id.startsWith('msg_'))
                return;

            const messageKey = getMessageKey(message);

            const previousReactions =
                reactionOverrides[messageKey] || message.reactions || [];

            const existingMyReaction = previousReactions.find(
                (r) => r.userId === USER_ID,
            );

            const isRemoving = existingMyReaction?.emoji === emoji;

            const nextReactions = previousReactions.filter(
                (r) => r.userId !== USER_ID,
            );

            if (!isRemoving) {
                nextReactions.push({
                    userId: USER_ID,
                    emoji,
                    reactedAt: new Date().toISOString(),
                });
            }

            setReactionOverrides((prev) => ({
                ...prev,
                [messageKey]: nextReactions,
            }));

            try {
                let response;

                if (isRemoving) {
                    response = await conversationApi.removeReaction(
                        selectedConversationId,
                        message.id,
                    );
                } else {
                    response = await conversationApi.reactToMessage(
                        selectedConversationId,
                        message.id,
                        emoji,
                    );
                }

                const serverReactions = response?.reactions ?? nextReactions;

                setReactionOverrides((prev) => ({
                    ...prev,
                    [messageKey]: serverReactions,
                }));
            } catch (err) {
                setReactionOverrides((prev) => ({
                    ...prev,
                    [messageKey]: previousReactions,
                }));

                console.error('Error reacting:', err);
            }
        },
        [getMessageKey, reactionOverrides, selectedConversationId, USER_ID],
    );

    const handleOpenForwardModal = useCallback((message: SocketMessage) => {
        setForwardingMessage(message);
        setForwardTargetConversationId('');
        setIsForwardModalOpen(true);
    }, []);

    const handleForwardMessage = useCallback(async () => {
        if (!forwardingMessage || !forwardTargetConversationId) return;

        const receiverId = getReceiverIdByConversationId(
            forwardTargetConversationId,
        );
        if (!receiverId) {
            setError('Không tìm thấy người nhận cho cuộc trò chuyện này.');
            return;
        }

        if (forwardingMessage.fileUrl?.startsWith('blob:')) {
            setError('Không thể chuyển tiếp tệp khi chưa upload xong.');
            return;
        }

        try {
            setIsForwarding(true);
            const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

            if (forwardingMessage.id.startsWith('msg_')) {
                setError('Không thể chuyển tiếp tin nhắn chưa gửi xong.');
                return;
            }

            // Note: userId should be included in request headers via API interceptor
            await conversationApi.forwardMessage(
                forwardingMessage.id,
                forwardTargetConversationId,
                clientMessageId,
            );

            setIsForwardModalOpen(false);
            setForwardingMessage(null);
            setForwardTargetConversationId('');
        } catch (err) {
            console.error('Error forwarding message:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to forward message',
            );
        } finally {
            setIsForwarding(false);
        }
    }, [
        forwardingMessage,
        forwardTargetConversationId,
        getReceiverIdByConversationId,
    ]);

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
                const receiverId = getReceiverId();

                if (!receiverId) {
                    console.error(
                        '[ChatPage] Cannot send message: receiverId is empty',
                    );
                    setError('Cannot determine receiver. Please try again.');
                    return;
                }

                sendMessage({
                    requestId: `req_${Date.now()}`,
                    clientMessageId,
                    receiverId: receiverId,
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
        [selectedConversationId, getReceiverId, USER_ID, USERNAME],
    );

    // Handle sending file
    const handleSendFile = useCallback(
        async (file: File) => {
            if (!selectedConversationId) return;

            try {
                const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

                // Determine file type with VIDEO support
                const fileType = file.type;
                const isImage = fileType.startsWith('image/');
                const isVideo =
                    fileType.startsWith('video/') ||
                    /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|3gp)$/i.test(
                        file.name,
                    );
                const messageType = isImage
                    ? 'image'
                    : isVideo
                      ? 'video'
                      : 'file';

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
                    type: messageType as 'image' | 'file' | 'video',
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
        [selectedConversationId, getReceiverId, USER_ID, USERNAME],
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
        [selectedConversation, USER_ID, USERNAME],
    );

    const paginatedAsSocketMessages: SocketMessage[] = paginatedMessages.map(
        (m, idx) => {
            const senderRef = m.senderBy || m.senderId || 'unknown';

            return {
                id:
                    m.messageId ||
                    m._id ||
                    m.clientMessageId ||
                    `${m.senderBy || 'unknown'}_${String(m.createdAt || idx)}`,
                clientMessageId: m.clientMessageId,
                senderId: senderRef,
                senderName: getSenderName(senderRef),
                content: m.content || '',
                timestamp:
                    typeof m.createdAt === 'string'
                        ? m.createdAt
                        : (m.createdAt?.toISOString() ??
                          new Date().toISOString()),
                isFile:
                    m.messageType === 'FILE' ||
                    m.messageType === 'VIDEO' ||
                    m.messageType === 'IMAGE' ||
                    m.messageType === 'file' ||
                    m.messageType === 'video' ||
                    m.messageType === 'image',
                fileUrl: m.mediaUrl,
                fileName: m.fileName,
                // Giữ MIME hợp lý để MessageList nhận diện preview ngay cả khi URL không có extension
                fileType:
                    m.messageType === 'IMAGE' || m.messageType === 'image'
                        ? 'image/*'
                        : m.messageType === 'VIDEO' || m.messageType === 'video'
                          ? 'video/*'
                          : undefined,
                // ✅ Message is recalled if isRevoked=true (from backend)
                // Backend preserves message in DB with isRevoked flag
                isRecalled: m.isRevoked === true,
                reactions: Array.isArray(m.reactions)
                    ? m.reactions.map((reaction) => ({
                          userId: reaction.userId,
                          emoji: reaction.emoji,
                          reactedAt:
                              typeof reaction.reactedAt === 'string'
                                  ? reaction.reactedAt
                                  : reaction.reactedAt?.toISOString(),
                      }))
                    : [],
            };
        },
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
            message.isRecalled ||
            message.content.trim().length > 0 ||
            (message.isFile && !!message.fileUrl);
        if (!hasVisibleContent) continue;

        // ✅ Use message.id as primary key for deduplication
        // Prevents duplicate entries when message exists in both pagination and socket updates
        const key = message.id;

        // ✅ If already exists, prefer version with isRecalled=true (more recent from socket)
        if (messageMap.has(key)) {
            const existing = messageMap.get(key)!;
            if (message.isRecalled && !existing.isRecalled) {
                messageMap.set(key, message);
            }
        } else {
            messageMap.set(key, message);
        }
    }

    const displayMessages: SocketMessage[] = Array.from(messageMap.values())
        .filter((msg) => !hiddenMessageKeys.has(getMessageKey(msg)))
        .sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();

            const safeA = Number.isNaN(timeA) ? 0 : timeA;
            const safeB = Number.isNaN(timeB) ? 0 : timeB;

            return safeA - safeB;
        })
        .map((msg) => ({
            ...msg,
            // Ưu tiên trạng thái thu hồi realtime từ socket để không cần reload trang.
            isRecalled:
                msg.isRecalled ||
                recalledMessageIds.has(msg.id) ||
                (!!msg.clientMessageId &&
                    recalledMessageIds.has(msg.clientMessageId)),
            reactions: reactionOverrides[getMessageKey(msg)] || msg.reactions,
            senderId: msg.senderId || USER_ID,
            senderName: msg.senderName || getSenderName(msg.senderId),
        }));

    const forwardableConversations = conversations.filter(
        (conversation) =>
            conversation.type === 'PRIVATE' &&
            conversation.conversationId !== selectedConversationId,
    );

    const getConversationDisplayName = (conversationId: string) => {
        const conversation = conversations.find(
            (item) => item.conversationId === conversationId,
        );

        if (!conversation) return 'Unknown conversation';
        if (conversation.type === 'GROUP') {
            return conversation.groupInfo?.groupName || 'Group chat';
        }

        return (
            conversation.participants.find((p) => p.userId !== USER_ID)
                ?.fullName || 'Unknown user'
        );
    };

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
                            isBlocked={iAmBlocked || iAmTheBlocker}
                            onPanelToggle={() =>
                                setIsInfoPanelOpen(!isInfoPanelOpen)
                            }
                            onSearchClick={() => setIsSearchOpen(true)}
                        />

                        {/* Messages */}
                        <MessageList
                            socketMessages={displayMessages}
                            currentUserId={USER_ID}
                            conversationId={selectedConversationId}
                            onRecallMessage={handleRequestRecallMessage}
                            onDeleteMessage={handleRequestDeleteMessage}
                            onForwardMessage={handleOpenForwardModal}
                            onReactMessage={handleReactMessage}
                        />

                        {/* Input */}
                        <ChatInput
                            onSend={handleSend}
                            onSendFile={handleSendFile}
                            isBlocked={iAmBlocked || iAmTheBlocker}
                            canUnblock={iAmTheBlocker}
                            onUnblock={handleUnblockUser}
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

            {/* Search panel or Conversation info panel */}
            {selectedConversation && isSearchOpen && (
                <SearchModal
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    messages={displayMessages}
                    currentUserId={USER_ID}
                    onSelectMessage={(messageId: string) => {
                        // Try to scroll to message element in the DOM
                        const messageElement = document.getElementById(
                            `message-${messageId}`,
                        );
                        if (messageElement) {
                            messageElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                            });
                            // Highlight the message briefly
                            messageElement.classList.add('bg-yellow-100');
                            setTimeout(() => {
                                messageElement.classList.remove(
                                    'bg-yellow-100',
                                );
                            }, 2000);
                        }
                    }}
                />
            )}

            {selectedConversation && !isSearchOpen && isInfoPanelOpen && (
                <ConversationInfoPanel
                    isSidebarOpen={isInfoPanelOpen}
                    selectedConversation={selectedConversation}
                    displayMessages={displayMessages}
                    currentUserId={USER_ID}
                    onBlockStatusChange={loadBlockStatus}
                    onJumpToMessage={(messageId: string) => {
                        // Try to scroll to message element in the DOM
                        const messageElement = document.getElementById(
                            `message-${messageId}`,
                        );
                        if (messageElement) {
                            messageElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                            });
                            // Highlight the message briefly
                            messageElement.classList.add('bg-yellow-100');
                            setTimeout(() => {
                                messageElement.classList.remove(
                                    'bg-yellow-100',
                                );
                            }, 2000);
                        }
                    }}
                    onForwardMessage={handleOpenForwardModal}
                    onPinStatusChange={refreshConversations}
                />
            )}

            <Modal
                isOpen={isForwardModalOpen}
                onClose={() => {
                    setIsForwardModalOpen(false);
                    setForwardingMessage(null);
                    setForwardTargetConversationId('');
                }}
                title="Chuyển tiếp tin nhắn"
                size="sm"
            >
                <div className="p-4 space-y-4">
                    {forwardingMessage && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                            {forwardingMessage.isFile
                                ? `File: ${forwardingMessage.fileName || 'Đính kèm'}`
                                : forwardingMessage.content}
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                            Chọn cuộc trò chuyện riêng
                        </label>
                        <select
                            value={forwardTargetConversationId}
                            onChange={(e) =>
                                setForwardTargetConversationId(e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        >
                            <option value="">-- Chọn cuộc trò chuyện --</option>
                            {forwardableConversations.map((conversation) => (
                                <option
                                    key={conversation.conversationId}
                                    value={conversation.conversationId}
                                >
                                    {getConversationDisplayName(
                                        conversation.conversationId,
                                    )}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsForwardModalOpen(false);
                                setForwardingMessage(null);
                                setForwardTargetConversationId('');
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleForwardMessage}
                            disabled={
                                !forwardTargetConversationId ||
                                isForwarding ||
                                forwardableConversations.length === 0
                            }
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isForwarding ? 'Đang chuyển...' : 'Chuyển tiếp'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Dialog
                isOpen={isRecallConfirmOpen}
                onClose={() => {
                    setIsRecallConfirmOpen(false);
                    setPendingRecallMessage(null);
                }}
                onConfirm={handleConfirmRecallMessage}
                title="Thu hồi tin nhắn?"
                message="Tin nhắn sẽ hiển thị là đã thu hồi với cả hai bên."
                confirmText="Thu hồi"
                cancelText="Hủy"
                type="warning"
            />

            <Dialog
                isOpen={isDeleteConfirmOpen}
                onClose={() => {
                    setIsDeleteConfirmOpen(false);
                    setPendingDeleteMessage(null);
                }}
                onConfirm={handleConfirmDeleteMessage}
                title="Xóa tin nhắn ở phía bạn?"
                message="Tin nhắn sẽ chỉ bị ẩn ở thiết bị của bạn."
                confirmText="Xóa"
                cancelText="Hủy"
                type="danger"
            />
        </div>
    );
};
