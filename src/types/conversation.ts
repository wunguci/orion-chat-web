export type ConversationType = 'GROUP' | 'PRIVATE' | 'CHANNEL';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO';
export type MessageStatus =
    | 'SENDING'
    | 'SENT'
    | 'DELIVERED'
    | 'SEEN'
    | 'FAILED';
export type ParticipantRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface SeenByItem {
    userId: string;
    seenAt: Date | string;
}

export interface MessageDetail {
    _id?: string;
    content?: string;
    senderBy?: string;
    conversationId?: string;
    clientMessageId?: string;
    messageType?: MessageType;
    messageStatus?: MessageStatus;
    isPinned?: boolean;
    isDeleted?: boolean;
    replyToMessageId?: string | null;
    seenBy?: SeenByItem[];
    createdAt?: Date | string;
    updatedAt?: Date | string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
}

export interface LastMessage {
    content?: string;
    messageType?: MessageType;
    senderBy?: string;
    createdAt?: Date | string;
    messageStatus?: MessageStatus;
}

export interface GroupInfo {
    groupName: string;
    groupAvatar?: string;
    ownerId: string;
}

export interface ParticipantInfo {
    userId: string;
    fullName: string | null;
    avatarUrl: string;
    role: ParticipantRole;
    joinedAt: Date | string;
    lastReadMessageId?: string | null;
}

export interface ConversationView {
    conversationId: string;
    type: ConversationType;
    autoDeleteDuration?: number;
    createdAt: Date | string;
    myRole: ParticipantRole;
    myJoinedAt: Date | string;
    lastMessage: LastMessage | null;
    groupInfo: GroupInfo | null;
    participants: ParticipantInfo[];
}

export interface ConversationMessagesResult {
    conversationId: string;
    items: MessageDetail[];
    nextCursor: string | null;
}

export interface PaginatedMessagesParams {
    conversationId: string;
    cursor?: string;
    limit?: number;
}
