import type {
    ConversationView,
    MessageDetail,
    ParticipantInfo,
} from '../types/conversation';

/**
 * Utility functions for conversation operations
 */

/**
 * Get display name for a conversation
 */
export const getConversationName = (
    conversation: ConversationView,
    currentUserId?: string,
): string => {
    if (conversation.type === 'GROUP' && conversation.groupInfo) {
        return conversation.groupInfo.groupName;
    }

    // For private conversations, show the other participant's name
    const otherParticipant = conversation.participants.find(
        (p) => !currentUserId || p.userId !== currentUserId,
    );

    return otherParticipant?.fullName || 'Unknown User';
};

/**
 * Get avatar URL for a conversation
 */
export const getConversationAvatar = (
    conversation: ConversationView,
    currentUserId?: string,
): string | undefined => {
    if (conversation.type === 'GROUP' && conversation.groupInfo) {
        return conversation.groupInfo.groupAvatar;
    }

    const otherParticipant = conversation.participants.find(
        (p) => !currentUserId || p.userId !== currentUserId,
    );

    return otherParticipant?.avatarUrl ?? undefined;
};

/**
 * Get the other participant in a private conversation
 */
export const getOtherParticipant = (
    conversation: ConversationView,
    currentUserId: string,
): ParticipantInfo | undefined => {
    return conversation.participants.find((p) => p.userId !== currentUserId);
};

/**
 * Check if user is conversation owner
 */
export const isConversationOwner = (
    conversation: ConversationView,
    userId: string,
): boolean => {
    if (conversation.type !== 'GROUP' || !conversation.groupInfo) {
        return false;
    }
    return conversation.groupInfo.ownerId === userId;
};

/**
 * Check if user is conversation admin
 */
export const isConversationAdmin = (
    conversation: ConversationView,
    userId: string,
): boolean => {
    const participant = conversation.participants.find(
        (p) => p.userId === userId,
    );
    return (
        !!participant &&
        (participant.role === 'admin' || participant.role === 'co-admin')
    );
};

/**
 * Get last message preview text
 */
export const getLastMessagePreview = (
    message: MessageDetail | null,
): string => {
    if (!message) {
        return 'No messages yet';
    }

    const { content, messageType, isRevoked, isDeleted } = message;

    if (isRevoked || isDeleted) {
        return 'Message has been recalled';
    }

    switch (messageType) {
        case 'FILE':
            return 'Attachment';
        case 'IMAGE':
            return 'Image';
        case 'VIDEO':
            return 'Video';
        case 'AUDIO':
            return 'Audio';
        default:
            return content || 'Sent a message';
    }
};

/**
 * Format relative time (e.g., "2h ago", "Yesterday")
 */
export const formatRelativeTime = (date: Date | string | undefined): string => {
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
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Format time with date (e.g., "Mar 22, 2:30 PM")
 */
export const formatMessageTime = (date: Date | string | undefined): string => {
    if (!date) return '';

    const messageDate = new Date(date);

    return messageDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

/**
 * Format date only (e.g., "Mar 22, 2024")
 */
export const formatDate = (date: Date | string | undefined): string => {
    if (!date) return '';

    const messageDate = new Date(date);

    return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

/**
 * Check if message is from current user
 */
export const isMessageFromCurrentUser = (
    message: MessageDetail,
    currentUserId: string,
): boolean => {
    return message.senderBy === currentUserId;
};

/**
 * Get initials for avatar text
 */
export const getInitials = (name: string): string => {
    return name
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
};

/**
 * Sort conversations by last message date
 */
export const sortConversationsByRecent = (
    conversations: ConversationView[],
): ConversationView[] => {
    return [...conversations].sort((a, b) => {
        const dateA = a.lastMessage?.createdAt
            ? new Date(a.lastMessage.createdAt).getTime()
            : 0;
        const dateB = b.lastMessage?.createdAt
            ? new Date(b.lastMessage.createdAt).getTime()
            : 0;
        return dateB - dateA;
    });
};

/**
 * Search conversations by name or last message content
 */
export const searchConversations = (
    conversations: ConversationView[],
    query: string,
    currentUserId?: string,
): ConversationView[] => {
    if (!query.trim()) return conversations;

    const lowerQuery = query.toLowerCase();

    return conversations.filter((conv) => {
        const name = getConversationName(conv, currentUserId).toLowerCase();
        const messageContent = conv.lastMessage?.content?.toLowerCase() || '';

        return name.includes(lowerQuery) || messageContent.includes(lowerQuery);
    });
};

/**
 * Group messages by date
 */
export const groupMessagesByDate = (
    messages: MessageDetail[],
): Map<string, MessageDetail[]> => {
    const grouped = new Map<string, MessageDetail[]>();

    for (const message of messages) {
        if (!message.createdAt) continue;

        const date = new Date(message.createdAt);
        const dateKey = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

        if (!grouped.has(dateKey)) {
            grouped.set(dateKey, []);
        }

        grouped.get(dateKey)!.push(message);
    }

    return grouped;
};

/**
 * Check if message should show sender info (not consecutive messages from same sender)
 */
export const shouldShowSenderInfo = (
    message: MessageDetail,
    previousMessage: MessageDetail | undefined,
): boolean => {
    if (!previousMessage) return true;

    return message.senderBy !== previousMessage.senderBy;
};

/**
 * Check if messages are close in time (within 5 minutes)
 */
export const areMessagesConsecutive = (
    message1: MessageDetail,
    message2: MessageDetail,
    timeWindowMs = 5 * 60 * 1000, // 5 minutes
): boolean => {
    if (!message1.createdAt || !message2.createdAt) return false;

    const time1 = new Date(message1.createdAt).getTime();
    const time2 = new Date(message2.createdAt).getTime();

    return Math.abs(time2 - time1) < timeWindowMs;
};

/**
 * Calculate unread message count
 */
export const getUnreadMessageCount = (
    conversation: ConversationView,
    currentUserId: string,
): number => {
    const participant = conversation.participants.find(
        (p) => p.userId === currentUserId,
    );
    if (!participant?.lastReadMessageId) return 0;

    // This requires tracking message indices
    // Simplified version - you might need to enhance this based on your data structure
    return 0;
};

/**
 * Get participant count label
 */
export const getParticipantCountLabel = (
    conversation: ConversationView,
): string => {
    const count = conversation.participants.length;

    if (count === 0) return 'No participants';
    if (count === 1) return '1 participant';
    return `${count} participants`;
};

/**
 * Validate message before sending
 */
export const validateMessage = (
    content: string,
    maxLength = 5000,
): { valid: boolean; error?: string } => {
    if (!content.trim()) {
        return { valid: false, error: 'Message cannot be empty' };
    }

    if (content.length > maxLength) {
        return {
            valid: false,
            error: `Message exceeds ${maxLength} characters`,
        };
    }

    return { valid: true };
};

/**
 * Get message status label
 */
export const getMessageStatusLabel = (status?: string): string => {
    switch (status) {
        case 'SENDING':
            return '⏳ Sending...';
        case 'SENT':
            return '✓';
        case 'DELIVERED':
            return '✓✓';
        case 'SEEN':
            return '✓✓';
        case 'FAILED':
            return '✗ Failed';
        default:
            return '';
    }
};

/**
 * Parse mentions from message content
 */
export const parseMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex) || [];
    return matches.map((m) => m.substring(1)); // Remove @
};

/**
 * Highlight mentions in content
 */
export const highlightMentions = (content: string): string => {
    return content.replace(/@(\w+)/g, '<strong>@$1</strong>');
};
