/* eslint-disable no-useless-catch */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    BellOff,
    Bot,
    Image,
    Lock,
    MoreVertical,
    Phone,
    PhoneOff,
    Pin,
    SmilePlus,
    Sparkles,
    UserPlus,
    UsersRound,
    UserRoundPlus,
    Video,
} from 'lucide-react';
import { getCurrentUserId } from '../../utils/auth';
import type { ConversationView } from '../../types/conversation';
import { RevealConversationModal } from './RevealConversationModal';
import { conversationApi } from '../../services/conversationApi';
import { groupManagementService } from '../../services/groupManagementService';
import ChatAvatar from '../common/ChatAvatar';
import GroupAvatar from './GroupAvatar';
import {
    onGroupInfoUpdated,
    offGroupInfoUpdated,
    chatSocketService,
} from '../../services/websocket/chatSocket';
import type { LastMessage } from '../../types/conversation';

const MEDIA_BASE_URL =
    import.meta.env.VITE_MEDIA_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    'http://localhost:3000';

const toAbsoluteMediaUrl = (url?: string | null): string | undefined => {
    if (!url) return undefined;

    const mediaBase = MEDIA_BASE_URL.replace(/\/$/, '');

    if (url.startsWith('http://') || url.startsWith('https://')) {
        if (url.includes('/uploads/')) {
            const uploadsPath = url.split('/uploads/').pop();
            if (uploadsPath) {
                return `${mediaBase}/${uploadsPath.replace(/^\/+/, '')}`;
            }
        }
        return url;
    }

    if (url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }

    const normalizedPath = url.replace(/^\/?uploads\//, '/');
    return `${mediaBase}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
};

interface ChatSidebarProps {
    conversations: ConversationView[];
    selectedConversationId: string | null;
    onSelectConversation: (conversationId: string) => void;
    loading?: boolean;
    error?: string | null;
    onNewConversation?: () => void;
    onAddFriendClick?: () => void;
    onCreateGroupClick?: () => void;
    onConversationRevealed?: (conversationId: string) => void;
    onAISummarizeConversation?: (
        conversationId: string,
        mode: 'range' | 'unread',
        rangeMonths?: 1 | 2 | 3,
    ) => void;
    onAIReplySuggestions?: (conversationId: string) => void;
}

export const ChatSidebarWithConversationService: React.FC<ChatSidebarProps> = ({
    conversations,
    selectedConversationId,
    onSelectConversation,
    loading = false,
    error = null,
    onNewConversation,
    onAddFriendClick,
    onCreateGroupClick,
    onConversationRevealed,
    onAISummarizeConversation,
    onAIReplySuggestions,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [revealModalOpen, setRevealModalOpen] = useState(false);
    const [selectedHiddenConversation, setSelectedHiddenConversation] =
        useState<ConversationView | null>(null);
    const [showJoinGroupBox, setShowJoinGroupBox] = useState(false);
    const [joinGroupCode, setJoinGroupCode] = useState('');
    const [joinGroupMessage, setJoinGroupMessage] = useState('');
    const [isJoinGroupSubmitting, setIsJoinGroupSubmitting] = useState(false);
    const [joinGroupError, setJoinGroupError] = useState<string | null>(null);
    const [joinGroupSuccess, setJoinGroupSuccess] = useState<string | null>(
        null,
    );
    const [unreadByConversation, setUnreadByConversation] = useState<
        Record<string, number>
    >(() => {
        const globalWindow = window as Window & {
            __unreadByConversation?: Record<string, number>;
        };

        return globalWindow.__unreadByConversation || {};
    });
    const [openAiMenuId, setOpenAiMenuId] = useState<string | null>(null);
    const [lastMessageOverrides, setLastMessageOverrides] = useState<
        Record<string, LastMessage>
    >({});
    const [mutedConversationIds, setMutedConversationIds] = useState<
        Set<string>
    >(() => {
        try {
            return new Set(
                JSON.parse(
                    localStorage.getItem('chat_muted_conversation_ids') ||
                        '[]',
                ) as string[],
            );
        } catch {
            return new Set();
        }
    });

    const currentUserId = getCurrentUserId();
    const [groupInfoOverrides, setGroupInfoOverrides] = useState<
        Record<string, { groupName?: string; groupAvatar?: string }>
    >({});

    useEffect(() => {
        const handleGroupInfoUpdatedRealtime = (payload: {
            groupId: string;
            groupName?: string;
            groupAvatar?: string;
        }) => {
            setGroupInfoOverrides((prev) => {
                const previousForGroup = prev[payload.groupId] || {};

                return {
                    ...prev,
                    [payload.groupId]: {
                        ...previousForGroup,
                        ...(payload.groupName
                            ? { groupName: payload.groupName }
                            : {}),
                        ...(payload.groupAvatar
                            ? {
                                  groupAvatar: toAbsoluteMediaUrl(
                                      payload.groupAvatar,
                                  ),
                              }
                            : {}),
                    },
                };
            });
        };

        onGroupInfoUpdated(handleGroupInfoUpdatedRealtime);
        return () => {
            offGroupInfoUpdated(handleGroupInfoUpdatedRealtime);
        };
    }, []);

    const getEffectiveGroupInfo = useCallback(
        (conversation: ConversationView) => {
            if (conversation.type !== 'GROUP') {
                return null;
            }

            const override = groupInfoOverrides[conversation.conversationId];

            return {
                groupName:
                    override?.groupName ||
                    conversation.groupInfo?.groupName ||
                    'Group Chat',
                groupAvatar:
                    override?.groupAvatar ||
                    toAbsoluteMediaUrl(conversation.groupInfo?.groupAvatar),
            };
        },
        [groupInfoOverrides],
    );

    useEffect(() => {
        const handleUnreadByConversation = (event: Event) => {
            const customEvent = event as CustomEvent<{
                unreadByConversation?: Record<string, number>;
            }>;

            setUnreadByConversation(
                customEvent.detail?.unreadByConversation || {},
            );
        };

        window.addEventListener(
            'notifications:unread_by_conversation',
            handleUnreadByConversation,
        );

        window.dispatchEvent(
            new CustomEvent('notifications:request_unread_by_conversation'),
        );

        return () => {
            window.removeEventListener(
                'notifications:unread_by_conversation',
                handleUnreadByConversation,
            );
        };
    }, []);

    useEffect(() => {
        const socket = chatSocketService.getSocket();
        if (!socket) return;

        const handleMessageNew = (rawPayload: unknown) => {
            const msg = rawPayload as {
                conversationId?: string;
                _id?: string;
                messageId?: string;
                content?: string;
                messageType?: string;
                type?: string;
                senderBy?: string;
                senderId?: string;
                createdAt?: string;
                isRecalled?: boolean;
                isRevoked?: boolean;
                callData?: LastMessage['callData'];
            };

            if (!msg?.conversationId) return;

            setLastMessageOverrides((prev) => ({
                ...prev,
                [msg.conversationId!]: {
                    messageId: msg._id || msg.messageId,
                    content: msg.content,
                    messageType: (msg.messageType ||
                        msg.type) as LastMessage['messageType'],
                    senderBy: msg.senderBy || msg.senderId,
                    createdAt: msg.createdAt || new Date().toISOString(),
                    isRecalled: msg.isRecalled || msg.isRevoked || false,
                    callData: msg.callData,
                },
            }));
        };

        socket.on('chat:message_new', handleMessageNew);
        return () => {
            socket.off('chat:message_new', handleMessageNew);
        };
    }, []);

    useEffect(() => {
        const handleMuteChanged = (event: Event) => {
            const customEvent = event as CustomEvent<{
                conversationId?: string;
                muted?: boolean;
            }>;
            const conversationId = customEvent.detail?.conversationId;
            if (!conversationId) return;

            setMutedConversationIds((prev) => {
                const next = new Set(prev);
                if (customEvent.detail?.muted) {
                    next.add(conversationId);
                } else {
                    next.delete(conversationId);
                }
                localStorage.setItem(
                    'chat_muted_conversation_ids',
                    JSON.stringify(Array.from(next)),
                );
                return next;
            });
        };

        window.addEventListener(
            'chat:conversation_mute_changed',
            handleMuteChanged,
        );
        return () => {
            window.removeEventListener(
                'chat:conversation_mute_changed',
                handleMuteChanged,
            );
        };
    }, []);

    // const getEffectiveConversation = useCallback(
    //     (conv: ConversationView): ConversationView => ({
    //         ...conv,
    //         lastMessage:
    //             lastMessageOverrides[conv.conversationId] ?? conv.lastMessage,
    //     }),
    //     [lastMessageOverrides],
    // );

    // ✅ Filter and sort conversations
    // 1. Filter by search query and hidden status
    // 2. Sort by: pinned status (descending) -> pinnedAt (newer first) -> lastMessage.createdAt (newer first)
    const filteredConversations = useMemo(() => {
        const query = searchQuery.toLowerCase();

        const filtered = conversations.filter((conv) => {
            const conversationName =
                conv.type === 'GROUP'
                    ? getEffectiveGroupInfo(conv)?.groupName || 'Group Chat'
                    : conv.participants.find((p) => p.userId !== currentUserId)
                          ?.fullName || 'Unknown';

            const matchesSearch = conversationName
                .toLowerCase()
                .includes(query);

            // If searching, return matching conversations (including hidden ones)
            if (query.trim()) {
                return matchesSearch;
            }

            // If not searching, hide hidden conversations
            return !conv.myIsHidden && matchesSearch;
        });

        // ✅ Sort by: pinned status -> pinnedAt (newer first) -> lastMessage.createdAt (newer first)
        return filtered.sort((a, b) => {
            // First, sort by pinned status (pinned conversations first)
            if (a.myIsPinned !== b.myIsPinned) {
                return a.myIsPinned ? -1 : 1;
            }

            // If both are pinned or both are not pinned, sort by pinnedAt (if pinned)
            if (a.myIsPinned && b.myIsPinned) {
                const pinnedAtA = new Date(a.myPinnedAt || 0).getTime();
                const pinnedAtB = new Date(b.myPinnedAt || 0).getTime();
                return pinnedAtB - pinnedAtA; // Newer pinned first
            }

            // If both are not pinned, sort by lastMessage.createdAt (use real-time override if available)
            const effA =
                lastMessageOverrides[a.conversationId] ?? a.lastMessage;
            const effB =
                lastMessageOverrides[b.conversationId] ?? b.lastMessage;
            const dateA = new Date(
                effA?.createdAt || a.createdAt || 0,
            ).getTime();
            const dateB = new Date(
                effB?.createdAt || b.createdAt || 0,
            ).getTime();
            return dateB - dateA; // Newer messages first
        });
    }, [
        conversations,
        searchQuery,
        currentUserId,
        getEffectiveGroupInfo,
        lastMessageOverrides,
    ]);

    const getConversationDisplayName = (conversation: ConversationView) => {
        if (conversation.type === 'GROUP') {
            return (
                getEffectiveGroupInfo(conversation)?.groupName || 'Group Chat'
            );
        }

        // For private conversations, show the other participant's name
        const otherParticipant = conversation.participants.find(
            (p) => p.userId !== currentUserId,
        );
        return otherParticipant?.fullName || 'Unknown User';
    };

    const getConversationAvatar = (
        conversation: ConversationView,
    ): string | undefined => {
        if (conversation.type === 'GROUP') {
            return getEffectiveGroupInfo(conversation)?.groupAvatar;
        }

        const otherParticipant = conversation.participants.find(
            (p) => p.userId !== currentUserId,
        );
        return toAbsoluteMediaUrl(otherParticipant?.avatarUrl);
    };

    const getLastMessagePreview = (conversation: ConversationView) => {
        const lastMessage =
            lastMessageOverrides[conversation.conversationId] ??
            conversation.lastMessage;

        if (!lastMessage) {
            return 'Chưa có tin nhắn';
        }

        const { content, senderBy, messageType, isRecalled, callData } =
            lastMessage;

        if (isRecalled || content === 'Tin nhắn đã được thu hồi') {
            return 'Tin nhắn đã được thu hồi';
        }

        if (messageType === 'FILE' || messageType === 'file') {
            return 'Tệp đính kèm';
        }

        if (messageType?.toLowerCase() === 'image') {
            return (
                <span className="inline-flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    Hình ảnh
                </span>
            );
        }

        if (messageType === 'CALL' || messageType === 'call' || (lastMessage.callData && !content)) {
            const isMe = senderBy === currentUserId;
            const callStatus = callData?.callStatus || 'completed';
            const callType = callData?.callType || 'audio';

            const preview =
                callStatus === 'completed'
                    ? {
                          text: `Cuộc gọi ${callType === 'video' ? 'video' : 'thoại'} ${isMe ? 'đi' : 'đến'}`,
                          Icon: callType === 'video' ? Video : Phone,
                          colorClass: 'text-[var(--chat-primary)]',
                      }
                    : callStatus === 'missed'
                      ? {
                            text: isMe ? 'Bạn đã hủy' : 'Bạn bị nhỡ',
                            Icon: PhoneOff,
                            colorClass: 'text-red-500',
                        }
                      : {
                            text: isMe ? 'Người nhận từ chối' : 'Bạn đã từ chối',
                            Icon: PhoneOff,
                            colorClass: 'text-orange-500',
                        };

            return (
                <span className={`inline-flex items-center gap-1 ${preview.colorClass}`}>
                    <preview.Icon className="h-3.5 w-3.5" />
                    <span className="truncate">{preview.text}</span>
                </span>
            );
        }

        const senderLabel = senderBy === currentUserId ? 'Bạn: ' : '';
        return `${senderLabel}${content || 'Đã gửi tin nhắn'}`.substring(0, 50);
    };

    const formatMessageTime = (date: Date | string | undefined) => {
        if (!date) return '';

        const messageDate = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - messageDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút`;
        if (diffHours < 24) return `${diffHours} giờ`;
        if (diffDays < 7) return `${diffDays} ngày`;

        return messageDate.toLocaleDateString('vi-VN', {
            month: '2-digit',
            day: 'numeric',
        });
    };

    const handleConversationSelect = (conversation: ConversationView) => {
        // If conversation is hidden and user is searching, show reveal modal
        if (conversation.myIsHidden && searchQuery.trim()) {
            setSelectedHiddenConversation(conversation);
            setRevealModalOpen(true);
        } else {
            // Otherwise select normally
            setUnreadByConversation((prev) => {
                if (!prev[conversation.conversationId]) return prev;

                const next = { ...prev };
                delete next[conversation.conversationId];
                return next;
            });
            onSelectConversation(conversation.conversationId);
        }
    };

    const handleRevealConversation = async (password: string) => {
        if (!selectedHiddenConversation) return;

        try {
            await conversationApi.unhideConversation(
                selectedHiddenConversation.conversationId,
                password,
            );

            // Close modal and proceed to select conversation
            setRevealModalOpen(false);
            setSelectedHiddenConversation(null);

            // Notify parent to refresh conversation list
            if (onConversationRevealed) {
                onConversationRevealed(
                    selectedHiddenConversation.conversationId,
                );
            }

            // Select the conversation
            onSelectConversation(selectedHiddenConversation.conversationId);
        } catch (err) {
            // Error will be displayed in modal
            throw err;
        }
    };

    const handleRequestJoinGroupByCode = async () => {
        const groupId = joinGroupCode.trim();
        if (!groupId) {
            setJoinGroupError('Vui lòng nhập mã group hợp lệ');
            return;
        }

        try {
            setIsJoinGroupSubmitting(true);
            setJoinGroupError(null);
            setJoinGroupSuccess(null);

            await groupManagementService.createJoinRequest(
                groupId,
                joinGroupMessage.trim() || undefined,
            );

            setJoinGroupSuccess('Đã gửi yêu cầu tham gia group thành công');
            setJoinGroupMessage('');
        } catch (error) {
            setJoinGroupError(
                error instanceof Error
                    ? error.message
                    : 'Không thể gửi yêu cầu tham gia group',
            );
        } finally {
            setIsJoinGroupSubmitting(false);
        }
    };

    return (
        <div className="flex w-80 flex-col gap-4 rounded-lg bg-white p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Tin nhắn</h2>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onAddFriendClick}
                        className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                        title="Thêm bạn bè"
                    >
                        <UserPlus size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={onCreateGroupClick}
                        className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                        title="Tạo nhóm"
                    >
                        <UsersRound size={16} />
                    </button>

                    {onNewConversation && (
                        <button
                            onClick={onNewConversation}
                            className="cursor-pointer rounded-lg bg-[var(--chat-primary)] p-2 text-white hover:bg-[var(--chat-primary-hover)]"
                            title="New conversation"
                        >
                            ✎
                        </button>
                    )}
                </div>
            </div>

            {/* Search box + join group button */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--chat-primary)] focus:outline-none"
                />
                <button
                    type="button"
                    onClick={() => {
                        setShowJoinGroupBox((prev) => !prev);
                        setJoinGroupError(null);
                        setJoinGroupSuccess(null);
                    }}
                    className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-100"
                    title="Tham gia group"
                >
                    <UserRoundPlus size={18} />
                </button>
            </div>

            {showJoinGroupBox && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col gap-3">
                    <span className="font-semibold text-gray-primary">
                        Tham gia group bằng mã
                    </span>

                    <input
                        type="text"
                        value={joinGroupCode}
                        onChange={(e) => setJoinGroupCode(e.target.value)}
                        placeholder="Nhập mã group (vd: 9fbcd750-cab0-4fca-8b0e-22be6f017dea)"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--chat-primary)]"
                        disabled={isJoinGroupSubmitting}
                    />

                    <textarea
                        value={joinGroupMessage}
                        onChange={(e) => setJoinGroupMessage(e.target.value)}
                        placeholder="Lời nhắn (tùy chọn)"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--chat-primary)] resize-none"
                        rows={3}
                        disabled={isJoinGroupSubmitting}
                    />

                    {joinGroupError && (
                        <p className="text-sm text-red-500">{joinGroupError}</p>
                    )}

                    {joinGroupSuccess && (
                        <p className="text-sm text-[var(--chat-primary)]">
                            {joinGroupSuccess}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleRequestJoinGroupByCode}
                        disabled={isJoinGroupSubmitting}
                        className="rounded-lg bg-[var(--chat-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--chat-primary-hover)] disabled:opacity-60"
                    >
                        {isJoinGroupSubmitting
                            ? 'Đang gửi...'
                            : 'Yêu cầu tham gia group'}
                    </button>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[var(--chat-primary)]" />
                </div>
            )}

            {/* Conversations list */}
            {!loading && (
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-center text-gray-400">
                            {conversations.length === 0
                                ? 'No conversations yet'
                                : 'No results found'}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredConversations.map((conversation) => {
                                const unreadCount =
                                    unreadByConversation[
                                        conversation.conversationId
                                    ] || 0;
                                const effectiveLastMessage =
                                    lastMessageOverrides[
                                        conversation.conversationId
                                    ] ?? conversation.lastMessage;
                                const isMuted = mutedConversationIds.has(
                                    conversation.conversationId,
                                );

                                return (
                                    <div
                                        key={conversation.conversationId}
                                        onClick={() =>
                                            handleConversationSelect(
                                                conversation,
                                            )
                                        }
                                        className={`w-full rounded-lg px-3 py-2 text-left transition-colors relative ${
                                            selectedConversationId ===
                                            conversation.conversationId
                                                ? 'bg-[var(--chat-primary-bg)] text-[var(--chat-primary)]'
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Avatar */}
                                            <div className="relative">
                                                {conversation.type ===
                                                'GROUP' ? (
                                                    <GroupAvatar
                                                        name={getConversationDisplayName(
                                                            conversation,
                                                        )}
                                                        avatarUrl={getConversationAvatar(
                                                            conversation,
                                                        )}
                                                        members={
                                                            conversation.participants
                                                        }
                                                        size={40}
                                                    />
                                                ) : (
                                                    <ChatAvatar
                                                        name={getConversationDisplayName(
                                                            conversation,
                                                        )}
                                                        avatarUrl={getConversationAvatar(
                                                            conversation,
                                                        )}
                                                        sizeClassName="h-10 w-10"
                                                    />
                                                )}
                                                {/* ✅ Pin indicator */}
                                                {conversation.myIsPinned && (
                                                    <div className="absolute -right-1 -bottom-1 bg-[var(--chat-primary)] rounded-full p-1 shadow-sm border border-white">
                                                        <Pin
                                                            size={12}
                                                            className="text-white fill-current"
                                                        />
                                                    </div>
                                                )}
                                                {/* Hidden indicator */}
                                                {conversation.myIsHidden &&
                                                    !conversation.myIsPinned && (
                                                        <div className="absolute -right-1 -bottom-1 bg-yellow-400 rounded-full p-1 shadow-sm">
                                                            <Lock
                                                                size={12}
                                                                className="text-gray-700"
                                                            />
                                                        </div>
                                                    )}
                                            </div>

                                            {/* Content */}
                                            <div className="min-w-0 flex-1 overflow-hidden cursor-pointer">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="truncate font-semibold text-gray-900">
                                                        {getConversationDisplayName(
                                                            conversation,
                                                        )}
                                                    </h3>
                                                    <div className="relative ml-2 flex w-16 shrink-0 items-start justify-end gap-1 pt-0.5 text-right">
                                                        <span className="whitespace-nowrap text-[11px] leading-4 text-gray-500">
                                                            {formatMessageTime(
                                                                effectiveLastMessage
                                                                    ?.createdAt ||
                                                                    conversation.createdAt,
                                                            )}
                                                        </span>
                                                        {(onAISummarizeConversation ||
                                                            onAIReplySuggestions) && (
                                                            <button
                                                                type="button"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    setOpenAiMenuId(
                                                                        (
                                                                            prev,
                                                                        ) =>
                                                                            prev ===
                                                                            conversation.conversationId
                                                                                ? null
                                                                                : conversation.conversationId,
                                                                    );
                                                                }}
                                                                className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-slate-700"
                                                                title="AI actions"
                                                            >
                                                                <MoreVertical
                                                                    size={14}
                                                                />
                                                            </button>
                                                        )}
                                                        <span
                                                            className={`absolute right-0 top-7 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold transition-opacity ${
                                                                unreadCount > 0
                                                                    ? 'bg-red-500 text-white opacity-100'
                                                                    : 'opacity-0'
                                                            }`}
                                                            aria-hidden={
                                                                unreadCount ===
                                                                0
                                                            }
                                                        >
                                                            {unreadCount > 99
                                                                ? '99+'
                                                                : unreadCount ||
                                                                  '0'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="truncate text-sm text-gray-600">
                                                    {conversation.myIsHidden
                                                        ? '🔒 Trò chuyện đã ẩn'
                                                        : getLastMessagePreview(
                                                              conversation,
                                                          )}
                                                </p>
                                                {isMuted && (
                                                    <div className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                                                        <BellOff size={12} />
                                                        <span className="truncate">
                                                            Đã tắt thông báo
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {openAiMenuId ===
                                            conversation.conversationId && (
                                            <div
                                                className="absolute right-2 top-12 z-30 min-w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    disabled={
                                                        unreadCount === 0 ||
                                                        !onAISummarizeConversation
                                                    }
                                                    onClick={() => {
                                                        onAISummarizeConversation?.(
                                                            conversation.conversationId,
                                                            'unread',
                                                        );
                                                        setOpenAiMenuId(null);
                                                    }}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Bot size={14} />
                                                    Tóm tắt tin chưa đọc
                                                </button>
                                                {[1, 2, 3].map((month) => (
                                                    <button
                                                        key={month}
                                                        type="button"
                                                        disabled={
                                                            !onAISummarizeConversation
                                                        }
                                                        onClick={() => {
                                                            onAISummarizeConversation?.(
                                                                conversation.conversationId,
                                                                'range',
                                                                month as
                                                                    | 1
                                                                    | 2
                                                                    | 3,
                                                            );
                                                            setOpenAiMenuId(
                                                                null,
                                                            );
                                                        }}
                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <Sparkles size={14} />
                                                        Tóm tắt {month} tháng
                                                    </button>
                                                ))}
                                                <div className="my-1 border-t border-slate-100" />
                                                <button
                                                    type="button"
                                                    disabled={
                                                        !onAIReplySuggestions
                                                    }
                                                    onClick={() => {
                                                        onAIReplySuggestions?.(
                                                            conversation.conversationId,
                                                        );
                                                        setOpenAiMenuId(null);
                                                    }}
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <SmilePlus size={14} />
                                                    Gợi ý trả lời
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Reveal conversation modal */}
            <RevealConversationModal
                isOpen={revealModalOpen}
                onClose={() => {
                    setRevealModalOpen(false);
                    setSelectedHiddenConversation(null);
                }}
                onConfirm={handleRevealConversation}
                conversationName={
                    selectedHiddenConversation
                        ? getConversationDisplayName(selectedHiddenConversation)
                        : 'Trò chuyện'
                }
            />
        </div>
    );
};

export default ChatSidebarWithConversationService;
