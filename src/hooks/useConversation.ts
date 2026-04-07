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

export const useConversations = (): UseConversationsResult => {
    const [conversations, setConversations] = useState<ConversationView[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConversations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await conversationApi.findAll();
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
    }, []);

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
    }, [conversationId]);

    useEffect(() => {
        if (conversationId) {
            fetchDetail();
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

    // Load messages whenever conversation changes
    useEffect(() => {
        if (conversationId) {
            loadMessages();
        }
    }, [conversationId, loadMessages]);

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
