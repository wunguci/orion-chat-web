import React, { useState } from 'react';
import { getCurrentUserId } from '../../utils/auth';
import type { ConversationView } from '../../types/conversation';

interface ChatSidebarProps {
    conversations: ConversationView[];
    selectedConversationId: string | null;
    onSelectConversation: (conversationId: string) => void;
    loading?: boolean;
    error?: string | null;
    onNewConversation?: () => void;
}

export const ChatSidebarWithConversationService: React.FC<ChatSidebarProps> = ({
    conversations,
    selectedConversationId,
    onSelectConversation,
    loading = false,
    error = null,
    onNewConversation,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const currentUserId = getCurrentUserId();

    // Filter conversations by search query
    const filteredConversations = conversations.filter((conv) => {
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase();
        const conversationName =
            conv.type === 'GROUP'
                ? conv.groupInfo?.groupName || 'Group Chat'
                : conv.participants.find((p) => p.userId !== currentUserId)
                      ?.fullName || 'Unknown';

        return conversationName.toLowerCase().includes(query);
    });

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
            return 'No messages yet';
        }

        const { content, senderBy, messageType } = conversation.lastMessage;

        if (messageType === 'FILE' || messageType === 'file') {
            return '📎 File attached';
        }

        if (messageType === 'IMAGE' || messageType === 'image') {
            return '🖼️ Image';
        }

        const senderLabel = senderBy === currentUserId ? 'You: ' : '';

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
                                        onSelectConversation(
                                            conversation.conversationId,
                                        )
                                    }
                                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                                        selectedConversationId ===
                                        conversation.conversationId
                                            ? 'bg-blue-100 text-blue-900'
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Avatar */}
                                        {getConversationAvatar(conversation) ? (
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
                                                {getLastMessagePreview(
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
        </div>
    );
};

export default ChatSidebarWithConversationService;
