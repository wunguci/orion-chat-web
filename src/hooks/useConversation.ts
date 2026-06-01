import { useState, useCallback, useRef, useEffect } from 'react';
import { isAxiosError } from 'axios';
import type { ConversationView, MessageDetail } from '../types/conversation';
import { conversationApi } from '../services/conversationApi';
import { groupManagementService } from '../services/groupManagementService';

const isConversationActive = (conversation: ConversationView) =>
    !conversation.conversationStatus ||
    conversation.conversationStatus === 'active';

const shouldAutoDeleteGroup = (conversation: ConversationView) =>
    conversation.type === 'GROUP' &&
    (conversation.participants?.length || 0) <= 2;

const isVisibleConversation = (conversation: ConversationView) =>
    isConversationActive(conversation) && !shouldAutoDeleteGroup(conversation);

const emitForbiddenConversationEvent = (conversationId: string) => {
    if (!conversationId) return;

    window.dispatchEvent(
        new CustomEvent('chat:conversation_forbidden', {
            detail: { conversationId },
        }),
    );
};

interface UseConversationsResult {
    conversations: ConversationView[];
    loading: boolean;
    error: string | null;
    fetchConversations: () => Promise<void>;
    refreshConversations: () => Promise<void>;
    updateConversationLastMessage: (
        conversationId: string,
        lastMessage: NonNullable<ConversationView['lastMessage']>,
    ) => void;
    markConversationLastMessageRecalled: (
        conversationId: string,
        messageId: string,
    ) => void;
}

interface UseConversationDetailResult {
    conversation: ConversationView | null;
    loading: boolean;
    error: string | null;
    fetchDetail: () => Promise<void>;
}

interface UseConversationMessagesResult {
    messages: MessageDetail[];
    isLoading: boolean;
    hasMore: boolean;
    error: string | null;
    nextCursor: string | null;
    loadMessages: () => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    addMessage: (message: MessageDetail) => void;
    updateMessage: (messageId: string, updates: Partial<MessageDetail>) => void;
    deleteMessage: (messageId: string) => void;
    clear: () => void;
}

export const useConversations = (): UseConversationsResult => {
    const [conversations, setConversations] = useState<ConversationView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const autoDeleteRequestedGroupIdsRef = useRef<Set<string>>(new Set());
    const hasFetchedConversationsRef = useRef(false);

    const requestGroupAutoDelete = useCallback(
        async (conversation: ConversationView) => {
            if (conversation.type !== 'GROUP') return;

            const groupId = conversation.conversationId;
            if (
                !groupId ||
                autoDeleteRequestedGroupIdsRef.current.has(groupId)
            ) {
                return;
            }

            if ((conversation.participants?.length || 0) > 2) {
                return;
            }

            autoDeleteRequestedGroupIdsRef.current.add(groupId);

            try {
                await groupManagementService.disbandGroup(groupId);
            } catch (err) {
                console.warn(
                    '[useConversations] Failed to auto-delete small group conversation:',
                    groupId,
                    err,
                );
            }
        },
        [],
    );

    const fetchConversations = useCallback(async () => {
        try {
            setLoading(!hasFetchedConversationsRef.current);
            setError(null);
            const data = await conversationApi.findAll();

            const visibleConversations = data.filter(isVisibleConversation);
            setConversations(visibleConversations);
            hasFetchedConversationsRef.current = true;

            for (const conversation of data) {
                if (shouldAutoDeleteGroup(conversation)) {
                    void requestGroupAutoDelete(conversation);
                }
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch conversations',
            );
            console.error('Error fetching conversations:', err);
        } finally {
            setLoading(false);
        }
    }, [requestGroupAutoDelete]);

    const refreshConversations = useCallback(async () => {
        await fetchConversations();
    }, [fetchConversations]);

    const updateConversationLastMessage = useCallback(
        (
            conversationId: string,
            lastMessage: NonNullable<ConversationView['lastMessage']>,
        ) => {
            setConversations((prev) =>
                prev.map((conversation) =>
                    conversation.conversationId === conversationId
                        ? {
                              ...conversation,
                              // Cập nhật lastMessage ngay để ChatSidebar render real-time.
                              lastMessage,
                          }
                        : conversation,
                ),
            );
        },
        [],
    );

    const markConversationLastMessageRecalled = useCallback(
        (conversationId: string, messageId: string) => {
            setConversations((prev) =>
                prev.map((conversation) => {
                    if (conversation.conversationId !== conversationId) {
                        return conversation;
                    }

                    if (!conversation.lastMessage) {
                        return conversation;
                    }

                    const last = conversation.lastMessage as
                        | (typeof conversation.lastMessage & {
                          messageId?: string;
                              id?: string;
                              _id?: string;
                              clientMessageId?: string;
                          })
                        | null;

                    const isSameLastMessage =
                        last?.messageId === messageId ||
                        last?.id === messageId ||
                        last?._id === messageId ||
                        last?.clientMessageId === messageId;

                    const hasAnyLastMessageId =
                        !!last?.messageId ||
                        !!last?.id ||
                        !!last?._id ||
                        !!last?.clientMessageId;

                    // Nếu backend không trả id cho lastMessage thì fallback: vẫn cập nhật realtime cho preview.
                    if (!isSameLastMessage && hasAnyLastMessageId) {
                        return conversation;
                    }

                    return {
                        ...conversation,
                        lastMessage: {
                            ...conversation.lastMessage,
                            content: 'Tin nhắn đã được thu hồi',
                            isRecalled: true,
                            // Giữ nguyên metadata còn lại để sidebar vẫn sort theo thời gian cũ.
                        },
                    };
                }),
            );
        },
        [],
    );

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    return {
        conversations,
        loading,
        error,
        fetchConversations,
        refreshConversations,
        updateConversationLastMessage,
        markConversationLastMessageRecalled,
    };
};

/**
 * Hook to fetch conversation details
 * ✅ No userId parameter needed - JWT token from localStorage is used
 */
export const useConversationDetail = (
    conversationId: string,
): UseConversationDetailResult => {
    const [conversation, setConversation] = useState<ConversationView | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetail = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // ✅ conversationApi.findDetailById() uses JWT token from localStorage
            const data = await conversationApi.findDetailById(conversationId);

            if (shouldAutoDeleteGroup(data)) {
                void groupManagementService.disbandGroup(data.conversationId);
                setConversation(null);
                emitForbiddenConversationEvent(conversationId);
                setError('Conversation is no longer available');
                return;
            }

            if (!isConversationActive(data)) {
                setConversation(null);
                emitForbiddenConversationEvent(conversationId);
                setError('Conversation is no longer available');
                return;
            }

            setConversation(data);
        } catch (err) {
            if (isAxiosError(err) && err.response?.status === 403) {
                setConversation(null);
                emitForbiddenConversationEvent(conversationId);
            }
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch conversation detail',
            );
            console.error('Error fetching conversation detail:', err);
        } finally {
            setLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        if (conversationId) {
            fetchDetail();
        } else {
            setConversation(null);
            setError(null);
            setLoading(false);
        }
    }, [conversationId, fetchDetail]);

    return {
        conversation,
        loading,
        error,
        fetchDetail,
    };
};

/**
 * Hook for paginated messages in a conversation
 * ✅ No userId parameter needed - JWT token from localStorage is used
 */
export const useConversationMessages = (
    conversationId: string,
    pageSize = 30,
): UseConversationMessagesResult => {
    const [messages, setMessages] = useState<MessageDetail[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    const cursorRef = useRef<string | undefined>(undefined);

    const loadMessages = useCallback(async () => {
        if (!conversationId) return;

        try {
            setIsLoading(true);
            setError(null);
            cursorRef.current = undefined;

            // ✅ conversationApi.getMessagesByConversation() uses JWT token from localStorage
            const result = await conversationApi.getMessagesByConversation({
                conversationId,
                cursor: undefined,
                limit: pageSize,
            });

            setMessages(result.items);
            setNextCursor(result.nextCursor);
            cursorRef.current = result.nextCursor ?? undefined;
            setHasMore(!!result.nextCursor);
        } catch (err) {
            if (isAxiosError(err) && err.response?.status === 403) {
                setMessages([]);
                setNextCursor(null);
                setHasMore(false);
                cursorRef.current = undefined;
                emitForbiddenConversationEvent(conversationId);
            }
            setError(
                err instanceof Error ? err.message : 'Failed to load messages',
            );
            console.error('Error loading messages:', err);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, pageSize]);

    const loadMoreMessages = useCallback(async () => {
        if (!conversationId || !cursorRef.current || isLoading) return;

        try {
            setIsLoading(true);
            setError(null);

            const result = await conversationApi.getMessagesByConversation({
                conversationId,
                cursor: cursorRef.current,
                limit: pageSize,
            });

            setMessages((prev) => [...prev, ...result.items]);
            setNextCursor(result.nextCursor);
            cursorRef.current = result.nextCursor ?? undefined;
            setHasMore(!!result.nextCursor);
        } catch (err) {
            if (isAxiosError(err) && err.response?.status === 403) {
                setHasMore(false);
                cursorRef.current = undefined;
                emitForbiddenConversationEvent(conversationId);
            }
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load more messages',
            );
            console.error('Error loading more messages:', err);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, pageSize, isLoading]);

    const clear = useCallback(() => {
        setMessages([]);
        setNextCursor(null);
        setHasMore(true);
        cursorRef.current = undefined;
        setError(null);
    }, []);

    // Load messages whenever conversation changes
    useEffect(() => {
        if (conversationId) {
            loadMessages();
        } else {
            clear();
        }
    }, [clear, conversationId, loadMessages]);

    const addMessage = useCallback((message: MessageDetail) => {
        setMessages((prev) => [message, ...prev]);
    }, []);

    const updateMessage = useCallback(
        (messageId: string, updates: Partial<MessageDetail>) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === messageId || msg.clientMessageId === messageId
                        ? { ...msg, ...updates }
                        : msg,
                ),
            );
        },
        [],
    );

    const deleteMessage = useCallback((messageId: string) => {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    }, []);

    return {
        messages,
        isLoading,
        hasMore,
        error,
        nextCursor,
        loadMessages,
        loadMoreMessages,
        addMessage,
        updateMessage,
        deleteMessage,
        clear,
    };
};
