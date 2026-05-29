import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    chatSocketService,
    joinConversation,
    leaveConversation,
    markMessageRead,
    sendMessage,
    sendTyping,
} from '../services/websocket/chatSocket';

export type ChatRoomJoinStatus = 'idle' | 'joining' | 'joined' | 'error';

type UseChatRoomOptions = {
    conversationId?: string | null;
    enabled?: boolean;
    onJoinError?: (message: string) => void;
};

export function useChatRoom({
    conversationId,
    enabled = true,
    onJoinError,
}: UseChatRoomOptions) {
    const [isConnected, setIsConnected] = useState(false);
    const [joinStatus, setJoinStatus] = useState<ChatRoomJoinStatus>('idle');
    const joinedConversationIdRef = useRef<string | null>(null);

    const socket = useMemo(() => chatSocketService.connect(), []);

    const joinRoom = useCallback(
        async (targetConversationId?: string | null) => {
            if (!enabled) return null;
            const nextConversationId = targetConversationId || conversationId;
            if (!nextConversationId) return null;

            setJoinStatus('joining');
            const requestId = `join_${nextConversationId}_${Date.now()}`;
            const ack = await joinConversation(requestId, nextConversationId);

            if (ack?.ok) {
                joinedConversationIdRef.current = nextConversationId;
                setJoinStatus('joined');
                return ack;
            }

            const errorMessage =
                ack?.ok === false
                    ? ack.error.message
                    : 'Failed to join conversation';
            setJoinStatus('error');
            onJoinError?.(errorMessage);
            return ack;
        },
        [conversationId, enabled, onJoinError],
    );

    const leaveRoom = useCallback(
        async (targetConversationId?: string | null) => {
            const nextConversationId = targetConversationId || conversationId;
            if (!nextConversationId) return null;

            const requestId = `leave_${nextConversationId}_${Date.now()}`;
            const ack = await leaveConversation(requestId, nextConversationId);

            if (
                ack?.ok &&
                joinedConversationIdRef.current === nextConversationId
            ) {
                joinedConversationIdRef.current = null;
                setJoinStatus('idle');
            }

            return ack;
        },
        [conversationId],
    );

    useEffect(() => {
        const handleConnect = () => {
            setIsConnected(true);
            void joinRoom(conversationId);
        };

        const handleDisconnect = () => {
            setIsConnected(false);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        if (socket.connected) {
            setIsConnected(true);
            void joinRoom(conversationId);
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, [conversationId, joinRoom, socket]);

    useEffect(() => {
        return () => {
            const currentConversationId = joinedConversationIdRef.current;
            if (currentConversationId) {
                void leaveRoom(currentConversationId);
            }
        };
    }, [leaveRoom]);

    useEffect(() => {
        if (!conversationId || !isConnected) return;

        if (joinedConversationIdRef.current === conversationId) return;

        void joinRoom(conversationId);
    }, [conversationId, isConnected, joinRoom]);

    const reconnectRoom = useCallback(() => {
        if (joinedConversationIdRef.current) {
            void joinRoom(joinedConversationIdRef.current);
        }
    }, [joinRoom]);

    const emitTyping = useCallback(
        (isTyping: boolean) => {
            if (!conversationId) return;
            sendTyping(conversationId, isTyping);
        },
        [conversationId],
    );

    const emitRead = useCallback(
        (messageId: string) => {
            if (!conversationId || !messageId) return Promise.resolve(null);

            return markMessageRead({
                requestId: `read_${conversationId}_${messageId}_${Date.now()}`,
                conversationId,
                messageId,
            });
        },
        [conversationId],
    );

    return {
        socket,
        isConnected,
        joinStatus,
        joinRoom,
        leaveRoom,
        reconnectRoom,
        emitTyping,
        emitRead,
        sendMessage,
    };
}
