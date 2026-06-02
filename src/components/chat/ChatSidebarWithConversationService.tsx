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
    Video,
    Plus,
} from 'lucide-react';
import { FaRegAddressBook } from "react-icons/fa";
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
import { friendListService, type FriendApiItem } from '../../services/friendListService';
import Modal from '../common/Modal';
import ProfileModal from '../friend/ProfileModal';

const RECENT_FRIEND_SEARCH_KEY = 'chat_recent_friend_searches';
const MAX_RECENT_FRIENDS = 5;
const INITIAL_SUGGESTED_LIMIT = 3;

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
    const [addFriendModalOpen, setAddFriendModalOpen] = useState(false);
    const [friendQuery, setFriendQuery] = useState('');
    const [friendResults, setFriendResults] = useState<FriendApiItem[]>([]);
    const [friendSearchLoading, setFriendSearchLoading] = useState(false);
    const [friendActionMessage, setFriendActionMessage] = useState<string | null>(null);
    const [sendingFriendRequestId, setSendingFriendRequestId] = useState<string | null>(null);
    const [sentFriendRequestIds, setSentFriendRequestIds] = useState<Set<string>>(
        new Set(),
    );
    const [selectedProfileFriend, setSelectedProfileFriend] =
        useState<FriendApiItem | null>(null);
    const [suggestedFriends, setSuggestedFriends] = useState<FriendApiItem[]>([]);
    const [suggestedVisibleCount, setSuggestedVisibleCount] = useState(
        INITIAL_SUGGESTED_LIMIT,
    );
    const [recentFriendSearches, setRecentFriendSearches] = useState<
        FriendApiItem[]
    >(() => {
        try {
            const raw = localStorage.getItem(RECENT_FRIEND_SEARCH_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw) as FriendApiItem[];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });
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
        const socket = chatSocketService.getSocket();
        if (!socket) return;

        const handleMessageRecalled = (payload: {
            conversationId?: string;
            messageId?: string;
            id?: string;
            _id?: string;
        }) => {
            const recalledMessageId =
                payload?.messageId || payload?.id || payload?._id;

            if (!payload?.conversationId || !recalledMessageId) return;

            setLastMessageOverrides((prev) => {
                const conversation = conversations.find(
                    (item) =>
                        item.conversationId === payload.conversationId,
                );
                type LastMessageWithAliases = LastMessage & {
                    id?: string;
                    _id?: string;
                    clientMessageId?: string;
                };

                const current = prev[
                    payload.conversationId!
                ] as LastMessageWithAliases | undefined;
                const fallbackLast = conversation?.lastMessage as
                    | LastMessageWithAliases
                    | null
                    | undefined;
                const effectiveLast = (current || fallbackLast) as
                    | LastMessageWithAliases
                    | undefined;

                const matchesMessageId =
                    effectiveLast?.messageId === recalledMessageId ||
                    effectiveLast?.id === recalledMessageId ||
                    effectiveLast?._id === recalledMessageId ||
                    effectiveLast?.clientMessageId === recalledMessageId;

                const hasMessageId =
                    !!effectiveLast?.messageId ||
                    !!effectiveLast?.id ||
                    !!effectiveLast?._id ||
                    !!effectiveLast?.clientMessageId;

                if (!matchesMessageId && hasMessageId) {
                    return prev;
                }

                return {
                    ...prev,
                    [payload.conversationId!]: {
                        ...(effectiveLast || {
                            messageId: recalledMessageId,
                            messageType: 'TEXT',
                            createdAt: new Date().toISOString(),
                        }),
                        content: 'The message has been recalled.',
                        isRecalled: true,
                    },
                };
            });
        };

        socket.on('chat:message_recalled', handleMessageRecalled);
        return () => {
            socket.off('chat:message_recalled', handleMessageRecalled);
        };
    }, [conversations]);

    useEffect(() => {
        const handleOverride = (event: Event) => {
            const customEvent = event as CustomEvent<{
                conversationId?: string;
                lastMessage?: LastMessage;
            }>;

            const conversationId = customEvent.detail?.conversationId;
            if (!conversationId) return;

            setLastMessageOverrides((prev) => ({
                ...prev,
                [conversationId]:
                    customEvent.detail.lastMessage || prev[conversationId],
            }));
        };

        window.addEventListener(
            'chat:conversation_last_message_override',
            handleOverride,
        );
        return () => {
            window.removeEventListener(
                'chat:conversation_last_message_override',
                handleOverride,
            );
        };
    }, []);

    const getEffectiveConversation = useCallback(
        (conv: ConversationView): ConversationView => ({
            ...conv,
            lastMessage:
                lastMessageOverrides[conv.conversationId] ?? conv.lastMessage,
        }),
        [lastMessageOverrides],
    );

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

    // Filter and sort conversations
    // 1. Filter by search query and hidden status
    // 2. Sort by: pinned status (descending) -> pinnedAt (newer first) -> lastMessage.createdAt (newer first)
    const filteredConversations = useMemo(() => {
        const query = searchQuery.toLowerCase();

        const filtered = conversations.map(getEffectiveConversation).filter((conv) => {
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

        // Sort by: pinned status -> pinnedAt (newer first) -> lastMessage.createdAt (newer first)
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
        getEffectiveConversation,
        searchQuery,
        currentUserId,
        getEffectiveGroupInfo,
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
            return 'No messages';
        }

        const { content, senderBy, messageType, isRecalled, callData } =
            lastMessage;

        if (isRecalled || content === 'The message has been recalled.') {
            return 'The message has been recalled.';
        }

        if (messageType === 'FILE' || messageType === 'file') {
            return 'Attachment';
        }

        if (messageType?.toLowerCase() === 'image') {
            return (
                <span className="inline-flex items-center gap-1">
                    <Image className="w-4 h-4" />
                    Image
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
                          text: `${callType} call`,
                          Icon: callType === 'video' ? Video : Phone,
                          colorClass: 'text-[var(--chat-primary)]',
                      }
                    : callStatus === 'missed'
                      ? {
                            text: isMe ? 'You cancelled' : 'You missed',
                            Icon: PhoneOff,
                            colorClass: 'text-red-500',
                        }
                      : {
                            text: isMe ? 'The other person declined' : 'You declined',
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

        const senderLabel = senderBy === currentUserId ? 'You: ' : '';
        return `${senderLabel}${content || 'Sent a message'}`.substring(0, 50);
    };

    const normalizePhoneDisplay = (phone?: string) => {
        const value = String(phone || '').replace(/\s+/g, '');
        if (!value) return '';
        if (value.startsWith('+84')) return value;
        if (value.startsWith('0')) return `(+84) ${value.slice(1)}`;
        return `(+84) ${value}`;
    };

    const persistRecentFriendSearches = useCallback(
        (items: FriendApiItem[]) => {
            setRecentFriendSearches(items);
            localStorage.setItem(RECENT_FRIEND_SEARCH_KEY, JSON.stringify(items));
        },
        [],
    );

    const addRecentFriendSearch = useCallback(
        (friend: FriendApiItem) => {
            const next = [
                friend,
                ...recentFriendSearches.filter((item) => item.id !== friend.id),
            ].slice(0, MAX_RECENT_FRIENDS);
            persistRecentFriendSearches(next);
        },
        [persistRecentFriendSearches, recentFriendSearches],
    );

    const handleOpenAddFriendModal = useCallback(() => {
        setAddFriendModalOpen(true);
        setFriendQuery('');
        setFriendResults([]);
        setFriendActionMessage(null);
        setSuggestedVisibleCount(INITIAL_SUGGESTED_LIMIT);
        onAddFriendClick?.();
    }, [onAddFriendClick]);

    const handleSearchFriend = useCallback(async () => {
        const keyword = friendQuery.trim();
        if (!keyword || !currentUserId) {
            setFriendResults([]);
            return;
        }
        setFriendSearchLoading(true);
        setFriendActionMessage(null);
        try {
            const results = await friendListService.searchUsers(
                currentUserId,
                keyword,
            );
            setFriendResults(Array.isArray(results) ? results : []);
            if (Array.isArray(results) && results.length > 0) {
                addRecentFriendSearch(results[0]);
            }
            if (!results.length) {
                setFriendActionMessage('No matching user found.');
            }
        } catch (searchError) {
            console.error('Search users error:', searchError);
            setFriendActionMessage(
                searchError instanceof Error
                    ? searchError.message
                    : 'Unable to search at this time.',
            );
            setFriendResults([]);
        } finally {
            setFriendSearchLoading(false);
        }
    }, [addRecentFriendSearch, currentUserId, friendQuery]);

    const handleSendFriendRequest = useCallback(
        async (receiverId: string) => {
            if (!currentUserId) return;
            setSendingFriendRequestId(receiverId);
            setFriendActionMessage(null);
            try {
                await friendListService.sendFriendRequest(currentUserId, receiverId);
                setFriendActionMessage('Friend request sent successfully.');
                setSentFriendRequestIds((prev) => {
                    const next = new Set(prev);
                    next.add(receiverId);
                    return next;
                });
                const selectedRecent = [
                    ...friendResults,
                    ...suggestedFriends,
                    ...recentFriendSearches,
                ].find((item) => item.id === receiverId);
                if (selectedRecent) {
                    addRecentFriendSearch(selectedRecent);
                }
            } catch (requestError) {
                console.error('Send friend request error:', requestError);
                setFriendActionMessage(
                    requestError instanceof Error
                        ? requestError.message
                        : 'Unable to send friend request at this time.',
                );
            } finally {
                setSendingFriendRequestId(null);
            }
        },
        [
            addRecentFriendSearch,
            currentUserId,
            friendResults,
            recentFriendSearches,
            suggestedFriends,
        ],
    );

    useEffect(() => {
        if (!addFriendModalOpen || !currentUserId) return;

        let isCancelled = false;
        void friendListService
            .getSuggestionsByMutualGroups(currentUserId)
            .then((items) => {
                if (isCancelled) return;
                const mapped: FriendApiItem[] = (items || []).map((item) => ({
                    id: item.id,
                    fullName: item.fullName,
                    avatarUrl: item.avatarUrl || null,
                    phoneNumber: '',
                    isOnline: item.isOnline,
                }));
                setSuggestedFriends(mapped);
            })
            .catch((error) => {
                console.error('Load friend suggestions error:', error);
                if (!isCancelled) {
                    setSuggestedFriends([]);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, [addFriendModalOpen, currentUserId]);

    useEffect(() => {
        if (!addFriendModalOpen || !currentUserId) return;

        void friendListService
            .getOutgoingFriendRequests(currentUserId)
            .then((items) => {
                const next = new Set(
                    (items || []).map((item) => item.receiver.userId),
                );
                setSentFriendRequestIds(next);
            })
            .catch(() => {
                setSentFriendRequestIds(new Set());
            });
    }, [addFriendModalOpen, currentUserId]);

    const formatMessageTime = (date: Date | string | undefined) => {
        if (!date) return '';

        const messageDate = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - messageDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;

        return messageDate.toLocaleDateString('en-US', {
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
            setJoinGroupError('Please enter a valid group code');
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

            setJoinGroupSuccess('Join group request sent successfully');
            setJoinGroupMessage('');
        } catch (error) {
            setJoinGroupError(
                error instanceof Error
                    ? error.message
                    : 'Unable to send join group request at this time.',
            );
        } finally {
            setIsJoinGroupSubmitting(false);
        }
    };

    return (
      <div className="flex w-80 flex-col gap-4 rounded-lg bg-white p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddFriendModal}
              className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
              title="Add friends"
            >
              <FaRegAddressBook size={16} />
            </button>

            <button
              type="button"
              onClick={onCreateGroupClick}
              className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
              title="Create group"
            >
              <UsersRound size={16} />
            </button>

            {onNewConversation && (
              <button
                onClick={onNewConversation}
                className="cursor-pointer rounded-lg bg-[var(--chat-primary)] p-2 text-white hover:bg-[var(--chat-primary-hover)]"
                title="New conversation"
              >
                <Plus size={16} />
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
            className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-100 cursor-pointer"
            title="Join group"
          >
            <UserPlus size={18} />
          </button>
        </div>

        {showJoinGroupBox && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 flex flex-col gap-3">
            <span className="font-semibold text-gray-primary">
              Join group by code
            </span>

            <input
              type="text"
              value={joinGroupCode}
              onChange={(e) => setJoinGroupCode(e.target.value)}
              placeholder="Enter group code (e.g., 9fbcd750-cab0-4fca-8b0e-22be6f017dea)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[var(--chat-primary)]"
              disabled={isJoinGroupSubmitting}
            />

            <textarea
              value={joinGroupMessage}
              onChange={(e) => setJoinGroupMessage(e.target.value)}
              placeholder="Message (optional)"
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
              {isJoinGroupSubmitting ? "Sending..." : "Request to join group"}
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
                  ? "No conversations yet"
                  : "No results found"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conversation) => {
                  const unreadCount =
                    unreadByConversation[conversation.conversationId] || 0;
                  const effectiveUnreadCount =
                    selectedConversationId === conversation.conversationId
                      ? 0
                      : unreadCount;
                  const effectiveLastMessage =
                    lastMessageOverrides[conversation.conversationId] ??
                    conversation.lastMessage;
                  const isMuted = mutedConversationIds.has(
                    conversation.conversationId,
                  );

                  return (
                    <div
                      key={conversation.conversationId}
                      onClick={() => handleConversationSelect(conversation)}
                      className={`w-full rounded-lg px-3 py-2 text-left transition-colors relative ${
                        selectedConversationId === conversation.conversationId
                          ? "bg-[var(--chat-primary-bg)] text-[var(--chat-primary)]"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="relative">
                          {conversation.type === "GROUP" ? (
                            <GroupAvatar
                              name={getConversationDisplayName(conversation)}
                              avatarUrl={getConversationAvatar(conversation)}
                              members={conversation.participants}
                              size={40}
                            />
                          ) : (
                            <ChatAvatar
                              name={getConversationDisplayName(conversation)}
                              avatarUrl={getConversationAvatar(conversation)}
                              sizeClassName="h-10 w-10"
                            />
                          )}
                          {/* Pin indicator */}
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
                                <Lock size={12} className="text-gray-700" />
                              </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1 overflow-hidden cursor-pointer">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="truncate font-semibold text-gray-900">
                              {getConversationDisplayName(conversation)}
                            </h3>
                            <div className="relative ml-2 flex w-16 shrink-0 items-start justify-end gap-1 pt-0.5 text-right">
                              <span className="whitespace-nowrap text-[11px] leading-4 text-gray-500">
                                {formatMessageTime(
                                  effectiveLastMessage?.createdAt ||
                                    conversation.createdAt,
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenAiMenuId((prev) =>
                                    prev === conversation.conversationId
                                      ? null
                                      : conversation.conversationId,
                                  );
                                }}
                                className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-slate-700"
                                title="Conversation actions"
                              >
                                <MoreVertical size={14} />
                              </button>
                              <span
                                className={`absolute right-0 top-7 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold transition-opacity ${
                                  effectiveUnreadCount > 0
                                    ? "bg-red-500 text-white opacity-100"
                                    : "opacity-0"
                                }`}
                                aria-hidden={effectiveUnreadCount === 0}
                              >
                                {effectiveUnreadCount > 99
                                  ? "99+"
                                  : effectiveUnreadCount || "0"}
                              </span>
                            </div>
                          </div>
                          <p className="truncate text-sm text-gray-600">
                            {conversation.myIsHidden
                              ? "Conversation hidden"
                              : getLastMessagePreview(conversation)}
                          </p>
                          {isMuted && (
                            <div className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                              <BellOff size={12} />
                              <span className="truncate">Muted</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {openAiMenuId === conversation.conversationId && (
                        <div
                          className="absolute right-2 top-12 z-30 min-w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            disabled={
                              effectiveUnreadCount === 0 ||
                              !onAISummarizeConversation
                            }
                            onClick={() => {
                              onAISummarizeConversation?.(
                                conversation.conversationId,
                                "unread",
                              );
                              setOpenAiMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Bot size={14} />
                            Summary of unread news
                          </button>
                          {[1, 2, 3].map((month) => (
                            <button
                              key={month}
                              type="button"
                              disabled={!onAISummarizeConversation}
                              onClick={() => {
                                onAISummarizeConversation?.(
                                  conversation.conversationId,
                                  "range",
                                  month as 1 | 2 | 3,
                                );
                                setOpenAiMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Sparkles size={14} />
                              Summary of {month} months
                            </button>
                          ))}
                          <div className="my-1 border-t border-slate-100" />
                          <button
                            type="button"
                            disabled={!onAIReplySuggestions}
                            onClick={() => {
                              onAIReplySuggestions?.(
                                conversation.conversationId,
                              );
                              setOpenAiMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <SmilePlus size={14} />
                            Suggested reply
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
              : "Conversation"
          }
        />
        <Modal
          isOpen={addFriendModalOpen}
          onClose={() => setAddFriendModalOpen(false)}
          title="Add friend"
          size="sm"
        >
          <div className="space-y-4 p-4">
            <div className="border-b border-slate-200 pb-2">
                <div className="text-sm text-slate-500">Phone number</div>
                <input
                  type="text"
                  value={friendQuery}
                  onChange={(event) =>
                    setFriendQuery(event.target.value.replace(/\D/g, ""))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSearchFriend();
                    }
                  }}
                  placeholder="Enter phone number"
                  className="mt-2 w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                />
            </div>

            {friendActionMessage && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {friendActionMessage}
              </div>
            )}

            <div className="max-h-80 space-y-4 overflow-y-auto">
              {recentFriendSearches.length > 0 && (
                <div>
                  <h4 className="mb-2 text-base font-semibold text-slate-700">
                    Recent search results
                  </h4>
                  <div className="space-y-2">
                    {recentFriendSearches.map((friend) => (
                      <div
                        key={`recent-${friend.id}`}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1 hover:bg-slate-50"
                        onClick={() => setSelectedProfileFriend(friend)}
                      >
                        <ChatAvatar
                          name={friend.fullName}
                          avatarUrl={friend.avatarUrl || undefined}
                          sizeClassName="h-10 w-10"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[17px] font-semibold text-slate-800">
                            {friend.fullName}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {normalizePhoneDisplay(friend.phoneNumber)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {friendResults.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <ChatAvatar
                    name={friend.fullName}
                    avatarUrl={friend.avatarUrl || undefined}
                    sizeClassName="h-9 w-9"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px] font-semibold text-slate-800">
                      {friend.fullName}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {normalizePhoneDisplay(friend.phoneNumber) || friend.id}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mr-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                    onClick={(event) => {
                        event.stopPropagation();
                        setSelectedProfileFriend(friend);
                    }}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-[var(--chat-primary)] px-3 py-1 text-sm font-semibold text-[var(--chat-primary)] hover:bg-[var(--chat-primary-bg)] disabled:opacity-60"
                    onClick={(event) => {
                        event.stopPropagation();
                        void handleSendFriendRequest(friend.id);
                    }}
                    disabled={
                        sendingFriendRequestId === friend.id ||
                        sentFriendRequestIds.has(friend.id)
                    }
                  >
                    {sendingFriendRequestId === friend.id
                      ? "Sending..."
                      : sentFriendRequestIds.has(friend.id)
                        ? "Sent"
                        : "Add friend"}
                  </button>
                </div>
              ))}

              {suggestedFriends.length > 0 && (
                <div>
                  <h4 className="mb-2 text-base font-semibold text-slate-700">
                    You may know
                  </h4>
                  <div className="space-y-2">
                    {suggestedFriends
                      .slice(0, suggestedVisibleCount)
                      .map((friend) => (
                        <div
                          key={`suggest-${friend.id}`}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1 hover:bg-slate-50"
                          onClick={() => setSelectedProfileFriend(friend)}
                        >
                          <ChatAvatar
                            name={friend.fullName}
                            avatarUrl={friend.avatarUrl || undefined}
                            sizeClassName="h-10 w-10"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[17px] font-semibold text-slate-800">
                              {friend.fullName}
                            </p>
                            <p className="truncate text-sm text-slate-500">
                              Suggested friend
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-md cursor-pointer border border-[var(--chat-primary)] px-3 py-1 text-sm font-semibold text-[var(--chat-primary)] hover:bg-[var(--chat-primary-bg)] disabled:opacity-60"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleSendFriendRequest(friend.id);
                            }}
                            disabled={
                                sendingFriendRequestId === friend.id ||
                                sentFriendRequestIds.has(friend.id)
                            }
                          >
                            {sendingFriendRequestId === friend.id
                              ? "Sending..."
                              : sentFriendRequestIds.has(friend.id)
                                ? "Sent"
                                : "Add friend"}
                          </button>
                        </div>
                      ))}
                  </div>
                  {suggestedVisibleCount < suggestedFriends.length && (
                    <button
                      type="button"
                      onClick={() =>
                        setSuggestedVisibleCount((value) => value + 3)
                      }
                      className="mt-2 text-sm font-semibold text-[var(--chat-primary)] hover:text-[var(--chat-primary-hover)]"
                    >
                      View more
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setAddFriendModalOpen(false)}
                className="rounded-md bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSearchFriend()}
                className="rounded-md bg-[var(--chat-primary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--chat-primary-hover)] disabled:opacity-60 cursor-pointer"
                disabled={friendSearchLoading}
              >
                {friendSearchLoading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </Modal>
        <ProfileModal
            isOpen={!!selectedProfileFriend}
            onClose={() => setSelectedProfileFriend(null)}
            user={
                selectedProfileFriend
                    ? {
                          name: selectedProfileFriend.fullName,
                          email: 'Not updated',
                          bio: 'User profile info',
                          coverImage:
                              'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=1200',
                          avatar:
                              selectedProfileFriend.avatarUrl ||
                              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
                          address: 'Not updated',
                          birthdate: 'Not updated',
                          joined: 'Member',
                          interests: ['Chat', 'Connect'],
                          stats: {
                              friends: '0',
                              photos: '0',
                              videos: '0',
                          },
                      }
                    : undefined
            }
        />
      </div>
    );
};

export default ChatSidebarWithConversationService;
