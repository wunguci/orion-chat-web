/* eslint-disable no-useless-catch */
import React, { useState, useMemo } from 'react';
import { Image, Lock, Pin } from 'lucide-react';
import { getCurrentUserId } from '../../utils/auth';
import type { ConversationView } from '../../types/conversation';
import { RevealConversationModal } from './RevealConversationModal';
import { conversationApi } from '../../services/conversationApi';

interface ChatSidebarProps {
    conversations: ConversationView[];
    selectedConversationId: string | null;
    onSelectConversation: (conversationId: string) => void;
    loading?: boolean;
    error?: string | null;
    onNewConversation?: () => void;
    onConversationRevealed?: (conversationId: string) => void;
}

export const ChatSidebarWithConversationService: React.FC<ChatSidebarProps> = ({
    conversations,
    selectedConversationId,
    onSelectConversation,
    loading = false,
    error = null,
    onNewConversation,
    onConversationRevealed,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [revealModalOpen, setRevealModalOpen] = useState(false);
    const [selectedHiddenConversation, setSelectedHiddenConversation] =
        useState<ConversationView | null>(null);

    const currentUserId = getCurrentUserId();

    // ✅ Filter and sort conversations
    // 1. Filter by search query and hidden status
    // 2. Sort by: pinned status (descending) -> pinnedAt (newer first) -> lastMessage.createdAt (newer first)
    const filteredConversations = useMemo(() => {
        const query = searchQuery.toLowerCase();

        const filtered = conversations.filter((conv) => {
            const conversationName =
                conv.type === 'GROUP'
                    ? conv.groupInfo?.groupName || 'Group Chat'
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

            // If both are not pinned, sort by lastMessage.createdAt
            const dateA = new Date(a.lastMessage?.createdAt || 0).getTime();
            const dateB = new Date(b.lastMessage?.createdAt || 0).getTime();
            return dateB - dateA; // Newer messages first
        });
    }, [conversations, searchQuery, currentUserId]);

    const getConversationDisplayName = (conversation: ConversationView) => {
        if (conversation.type === 'GROUP' && conversation.groupInfo) {
            return conversation.groupInfo.groupName;
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
        if (conversation.type === 'GROUP' && conversation.groupInfo) {
            return conversation.groupInfo.groupAvatar;
        }

        const otherParticipant = conversation.participants.find(
            (p) => p.userId !== currentUserId,
        );
        return otherParticipant?.avatarUrl ?? undefined;
    };

    const getLastMessagePreview = (conversation: ConversationView) => {
        if (!conversation.lastMessage) {
            return 'Không có tin nhắn';
        }

        const { content, senderBy, messageType, isRecalled } =
            conversation.lastMessage;

        // Ưu tiên hiển thị trạng thái thu hồi nếu backend hoặc state local đã đánh dấu.
        if (isRecalled || content === 'Tin nhắn đã được thu hồi') {
            return 'Tin nhắn đã được thu hồi';
        }

        if (messageType === 'FILE' || messageType === 'file') {
            return '📎 File attached';
        }

        if (
            messageType?.toLowerCase() === 'image' ||
            messageType?.toLowerCase() === 'IMAGE'
        ) {
            return (
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                    }}
                >
                    <Image className="w-4 h-4" />
                    Image
                </span>
            );
        }

        const senderLabel = senderBy === currentUserId ? 'Bạn: ' : '';

        return `${senderLabel}${content || 'Message sent'}`.substring(0, 50);
    };

    const formatMessageTime = (date: Date | string | undefined) => {
        if (!date) return '';

        const messageDate = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - messageDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return messageDate.toLocaleDateString('en-US', {
            month: 'short',
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

    return (
        <div className="flex w-80 flex-col gap-4 rounded-lg bg-white p-4 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                {onNewConversation && (
                    <button
                        onClick={onNewConversation}
                        className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700"
                        title="New conversation"
                    >
                        ✎
                    </button>
                )}
            </div>

            {/* Search box */}
            <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />

            {/* Error message */}
            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
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
                            {filteredConversations.map((conversation) => (
                                <button
                                    key={conversation.conversationId}
                                    onClick={() =>
                                        handleConversationSelect(conversation)
                                    }
                                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors relative ${
                                        selectedConversationId ===
                                        conversation.conversationId
                                            ? 'bg-blue-100 text-blue-900'
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="relative">
                                            {getConversationAvatar(
                                                conversation,
                                            ) ? (
                                                <img
                                                    src={getConversationAvatar(
                                                        conversation,
                                                    )}
                                                    alt={getConversationDisplayName(
                                                        conversation,
                                                    )}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-white">
                                                    {getConversationDisplayName(
                                                        conversation,
                                                    )
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                            )}
                                            {/* ✅ Pin indicator */}
                                            {conversation.myIsPinned && (
                                                <div className="absolute -right-1 -bottom-1 bg-green-500 rounded-full p-1 shadow-sm border border-white">
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
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900">
                                                    {getConversationDisplayName(
                                                        conversation,
                                                    )}
                                                </h3>
                                                <span className="ml-2 whitespace-nowrap text-xs text-gray-500">
                                                    {formatMessageTime(
                                                        conversation.lastMessage
                                                            ?.createdAt,
                                                    )}
                                                </span>
                                            </div>
                                            <p className="truncate text-sm text-gray-600">
                                                {conversation.myIsHidden
                                                    ? '🔒 Trò chuyện đã ẩn'
                                                    : getLastMessagePreview(
                                                          conversation,
                                                      )}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
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
