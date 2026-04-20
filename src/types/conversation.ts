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
  | "FAILED"
  | "UPLOADING";
export type ParticipantRole = "admin" | "co-admin" | "member";
export type ConversationStatus = "active" | "dissolved" | "left_or_removed";

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
  senderName?: string;
  senderAvatar?: string;
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
  replyToMessagePreview?: {
    messageId?: string;
    content?: string;
    senderName?: string;
    snippet?: string;
    createdAt?: Date | string;
  } | null;
  pinnedAt?: Date | string | null;
  seenBy?: SeenByItem[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileExtension?: string;
  fileCategory?: "image" | "video" | "audio" | "file";
  fileIcon?:
    | "image"
    | "video"
    | "audio"
    | "file"
    | "file-pdf"
    | "file-word"
    | "file-excel"
    | "file-powerpoint"
    | "file-archive"
    | "file-text";
  uploadStatus?: "uploading" | "sent" | "failed";
  errorMessage?: string;
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

export interface PinnedMessageItem {
  messageId: string;
  conversationId?: string;
  content?: string;
  senderId?: string;
  senderName?: string;
  snippet?: string;
  createdAt?: Date | string;
  pinnedAt?: Date | string;
  messageType?: MessageType;
  replyToMessageId?: string | null;
  replyToMessagePreview?: MessageDetail["replyToMessagePreview"];
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
  nickname?: string | null;
  avatarUrl: string | null;
  role: ParticipantRole;
  joinedAt: Date | string;
  lastReadMessageId?: string | null;
}

export interface ConversationView {
  conversationId: string;
  type: ConversationType;
  conversationStatus?: ConversationStatus;
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
  userId?: string;
}
