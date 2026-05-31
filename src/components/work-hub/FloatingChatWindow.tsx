import React, { useEffect, useState, useRef, useCallback } from 'react';
import { conversationApi } from '../../services/conversationApi';
import ChatInput from '../chat/ChatInput';
import MessageList, { type SocketMessage } from '../chat/MessageList';
import { useDraggable } from '../../hooks/useDraggable';
import { Minus, X, Phone, Video } from 'lucide-react';
import { onMessageNew, offMessageNew } from '../../services/websocket/chatSocket';
import type { User } from '../../types/work-hub.types';
import { mapConversationMessage } from './FloatingWorkHubChat';
import ChatAvatar from '../common/ChatAvatar';
import { useGroupCallContext } from '../../hooks/useGroupCallContext';

interface FloatingChatWindowProps {
    user: User;
    currentUserId: string;
    onClose: () => void;
    onMinimize: () => void;
    initialPosition?: { x: number; y: number };
}

const FloatingChatWindow: React.FC<FloatingChatWindowProps> = ({
    user,
    currentUserId,
    onClose,
    onMinimize,
    initialPosition = { x: window.innerWidth - 450, y: window.innerHeight - 650 },
}) => {
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<SocketMessage[]>([]);
    const headerRef = useRef<HTMLDivElement>(null);
    
    // Custom dragging logic hooked to the header
    const { position } = useDraggable({
        initialPosition,
        handleRef: headerRef,
    });

    const { startCall } = useGroupCallContext();

    useEffect(() => {
        let isMounted = true;
        const initConversation = async () => {
            try {
                const conversation = await conversationApi.getOrCreatePrivateConversation(user.id);
                if (!isMounted) return;
                
                const nextConversationId = conversation.conversationId as string;
                setConversationId(nextConversationId);
                
                const result = await conversationApi.getMessagesByConversation({
                    conversationId: nextConversationId,
                    limit: 30,
                });
                if (!isMounted) return;
                
                const items = Array.isArray(result.items) ? result.items : [];
                setMessages(items.map(mapConversationMessage));
            } catch (err) {
                console.error("Failed to init conversation", err);
            }
        };
        initConversation();
        
        return () => {
            isMounted = false;
        };
    }, [user.id]);

    useEffect(() => {
        if (!conversationId) return;

        const handleNewMessage = (payload: any) => {
            if (payload.conversationId === conversationId) {
                setMessages((prev) => {
                    const mapped = mapConversationMessage(payload);
                    if (prev.some((m) => m.id === mapped.id)) return prev;
                    return [...prev, mapped];
                });
            }
        };

        onMessageNew(handleNewMessage);
        return () => {
            offMessageNew(handleNewMessage);
        };
    }, [conversationId]);

    const handleSend = async (text: string) => {
        if (!conversationId || !text.trim()) return;
        const sent = await conversationApi.sendMessage(conversationId, text.trim());
        setMessages((prev) => {
            const mapped = mapConversationMessage(sent);
            if (prev.some((m) => m.id === mapped.id)) return prev;
            return [...prev, mapped];
        });
    };

    const handleSendFiles = async (files: File[]) => {
        if (!conversationId) return;
        const response = await conversationApi.sendBatchFiles({
            files,
            conversationId,
            clientMessageIdPrefix: `workhub-${Date.now()}`,
        });
        setMessages((prev) => {
            const newMessages = (response.items || []).map((item) =>
                mapConversationMessage({ ...item, conversationId }),
            );
            return [...prev, ...newMessages];
        });
    };

    const handleCall = (type: 'audio' | 'video') => {
        if (!conversationId) return;
        startCall({
            conversationId,
            conversationName: user.name,
            conversationAvatar: user.avatar,
            isGroup: false,
            isVideo: type === 'video',
            members: [],
        });
    };

    return (
        <div
            className="fixed z-[50] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            style={{
                left: position.x,
                top: position.y,
                width: '400px',
                height: '600px',
                minWidth: '300px',
                minHeight: '400px',
                resize: 'both',
            }}
        >
            <div
                ref={headerRef}
                className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 cursor-move hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative shrink-0">
                        <ChatAvatar name={user.name} avatarUrl={user.avatar} sizeClassName="w-10 h-10" />
                        {user.status === 'online' && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                            {user.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                            {user.status === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCall('audio'); }}
                        className="h-8 w-8 rounded-full text-wh-green-primary hover:bg-emerald-50 flex items-center justify-center"
                        title="Gọi thoại"
                    >
                        <Phone className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCall('video'); }}
                        className="h-8 w-8 rounded-full text-wh-green-primary hover:bg-emerald-50 flex items-center justify-center"
                        title="Gọi video"
                    >
                        <Video className="w-4 h-4" />
                    </button>
                    <div className="w-px h-5 bg-slate-200 mx-1"></div>
                    <button
                        onClick={(e) => { e.stopPropagation(); onMinimize(); }}
                        className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 flex items-center justify-center"
                        title="Thu nhỏ"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="h-8 w-8 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 flex items-center justify-center"
                        title="Đóng"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 relative">
                <MessageList
                    socketMessages={messages}
                    currentUserId={currentUserId}
                    conversationId={conversationId}
                />
            </div>
            
            <div className="bg-white border-t border-slate-200">
                <ChatInput
                    onSend={(text) => void handleSend(text)}
                    onSendFiles={handleSendFiles}
                />
            </div>
        </div>
    );
};

export default FloatingChatWindow;
