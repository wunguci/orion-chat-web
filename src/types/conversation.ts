export type ConversationType = "GROUP" | "PRIVATE" | "CHANNEL";
export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "FILE"
  | "VIDEO"
  | "AUDIO"
  | "CALL"
  | "text"
  | "image"
  | "file"
  | "video"
  | "audio"
  | "call";
export type MessageStatus =
  | "SENDING"
  | "SENT"
  | "DELIVERED"
  | "SEEN"
  | "FAILED";
export type ParticipantRole = "OWNER" | "ADMIN" | "MEMBER";

export interface SeenByItem {
  userId: string;
  seenAt: Date | string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  reactedAt?: Date | string;
}

export interface MessageDetail {
  messageId?: string;
  _id?: string;
  content?: string;
  senderBy?: string;
  senderId?: string;
  conversationId?: string;
  clientMessageId?: string;
  messageType?: MessageType;
  messageStatus?: MessageStatus;
  isPinned?: boolean;
  isDeleted?: boolean;
  isRevoked?: boolean;
  revokedBy?: string;
  revokedAt?: Date | string;
  replyToMessageId?: string | null;
  seenBy?: SeenByItem[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  reactions?: MessageReaction[];
  // Call history fields
  callData?: {
    callType?: "audio" | "video";
    callStatus?: "missed" | "declined" | "completed";
    duration?: number; // in seconds
    participants?: string[];
    isInitiator?: boolean; // Whether the sender initiated the call
    wasRejected?: boolean; // Whether the receiver rejected the call
  };
}

export interface LastMessage {
    messageId?: string;
    _id?: string;
    clientMessageId?: string;
    content?: string;
    messageType?: MessageType;
    senderBy?: string;
    createdAt?: Date | string;
    messageStatus?: MessageStatus;
    isRecalled?: boolean;
}

export interface GroupInfo {
  groupName: string;
  groupAvatar?: string;
  ownerId: string;
}

export interface ParticipantInfo {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
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
  myIsHidden?: boolean;
  hidePasswordHash?: string | null;
  myIsPinned?: boolean;
  myPinnedAt?: Date | string | null;
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
  userId: string;
}
