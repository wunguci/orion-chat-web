import { useState, useCallback, useRef, useEffect } from 'react';
import type { ConversationView, MessageDetail } from '../types/conversation';
import { conversationApi } from '../services/conversationApi';

interface UseConversationsResult {
    conversations: ConversationView[];
    loading: boolean;
    error: string | null;
    fetchConversations: () => Promise<void>;
    refreshConversations: () => Promise<void>;
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

/**
 * Hook to fetch all conversations for current user
 */
export const useConversations = (userId: string): UseConversationsResult => {
    const [conversations, setConversations] = useState<ConversationView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConversations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await conversationApi.findAllByUserId(userId);
            setConversations(data);
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
    }, [userId]);

    const refreshConversations = useCallback(async () => {
        await fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    return {
        conversations,
        loading,
        error,
        fetchConversations,
        refreshConversations,
    };
};

/**
 * Hook to fetch conversation details
 */
export const useConversationDetail = (
    conversationId: string,
    userId: string,
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
            const data = await conversationApi.findDetailById(
                conversationId,
                userId,
            );
            setConversation(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch conversation detail',
            );
            console.error('Error fetching conversation detail:', err);
        } finally {
            setLoading(false);
        }
    }, [conversationId, userId]);

    useEffect(() => {
        if (conversationId && userId) {
            fetchDetail();
        }
    }, [conversationId, userId, fetchDetail]);

    return {
        conversation,
        loading,
        error,
        fetchDetail,
    };
};

/**
 * Hook for paginated messages in a conversation
 */
export const useConversationMessages = (
    conversationId: string,
    userId: string,
    pageSize = 30,
): UseConversationMessagesResult => {
    const [messages, setMessages] = useState<MessageDetail[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    const cursorRef = useRef<string | undefined>(undefined);

    const loadMessages = useCallback(async () => {
        if (!conversationId || !userId) return;

        try {
            setIsLoading(true);
            setError(null);
            cursorRef.current = undefined;

            const result = await conversationApi.getMessagesByConversation({
                conversationId,
                userId,
                cursor: undefined,
                limit: pageSize,
            });

            setMessages(result.items);
            setNextCursor(result.nextCursor);
            cursorRef.current = result.nextCursor ?? undefined;
            setHasMore(!!result.nextCursor);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load messages',
            );
            console.error('Error loading messages:', err);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, userId, pageSize]);

    const loadMoreMessages = useCallback(async () => {
        if (!conversationId || !userId || !cursorRef.current || isLoading)
            return;

        try {
            setIsLoading(true);
            setError(null);

            const result = await conversationApi.getMessagesByConversation({
                conversationId,
                userId,
                cursor: cursorRef.current,
                limit: pageSize,
            });

            setMessages((prev) => [...prev, ...result.items]);
            setNextCursor(result.nextCursor);
            cursorRef.current = result.nextCursor ?? undefined;
            setHasMore(!!result.nextCursor);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load more messages',
            );
            console.error('Error loading more messages:', err);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId, userId, pageSize, isLoading]);

    // Load messages whenever conversation or user changes
    useEffect(() => {
        if (conversationId && userId) {
            loadMessages();
        }
    }, [conversationId, userId, loadMessages]);

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

    const clear = useCallback(() => {
        setMessages([]);
        setNextCursor(null);
        setHasMore(true);
        cursorRef.current = undefined;
        setError(null);
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
