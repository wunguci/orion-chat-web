/*eslint-disable*/
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { VideoMessage } from './VideoMessage';
import {
    FaFileArchive,
    FaFileExcel,
    FaFilePdf,
    FaFilePowerpoint,
    FaFileWord,
} from 'react-icons/fa';
import { FiFile, FiFileText, FiImage, FiMusic, FiVideo } from 'react-icons/fi';

/**
 * Message interface matching MongoDB schema
 */
export interface Message {
    _id: string;
    content: string;
    senderBy: string; // Phone number or userId
    senderName?: string; // Optional: sender's display name
    conversationId: string;
    clientMessageId?: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VIDEO' | 'AUDIO';
    messageStatus: 'SENT' | 'DELIVERED' | 'READ';
    createdAt: string; // ISO 8601 date string
    updatedAt?: string;
    isPinned?: boolean;
    isDeleted?: boolean;
    deletedForUsers?: string[];
    replyToMessageId?: string | null;
    forwardedFromMessageId?: string | null;
    seenBy?: string[];
    reactions?: Array<{
        userId: string;
        emoji: string;
        reactedAt: string;
    }>;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileIcon?:
        | 'image'
        | 'video'
        | 'audio'
        | 'file'
        | 'file-pdf'
        | 'file-word'
        | 'file-excel'
        | 'file-powerpoint'
        | 'file-archive'
        | 'file-text';
}

interface MessageItemNewProps {
    message: Message;
    currentUserId: string; // Current user's ID (phone number or userId)
    senderAvatar?: string; // Optional: avatar URL
    senderName?: string; // Optional: sender's display name
    onImageClick?: () => void;
    onReact?: (emoji: string) => void;
    onDelete?: () => void;
    onRecall?: () => void;
    onReply?: () => void;
    isLoading?: boolean;
}

// Emoji picker list
const EMOJI_LIST = [
    '👍',
    '❤️',
    '😂',
    '😮',
    '😢',
    '😡',
    '🔥',
    '😎',
    '🤔',
    '✨',
    '🎉',
    '👏',
];

/**
 * Generate avatar URL from phone number or userId
 * Using DiceBear API for consistent avatars
 */
export const getAvatarUrl = (userId: string): string => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`;
};

/**
 * Format timestamp to HH:mm
 */
const formatTime = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return format(date, 'HH:mm', { locale: vi });
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
};

/**
 * Group reactions by emoji
 */
const groupReactions = (reactions: Message['reactions'] = []) => {
    const grouped = new Map<string, { count: number; users: string[] }>();

    for (const reaction of reactions) {
        if (!grouped.has(reaction.emoji)) {
            grouped.set(reaction.emoji, { count: 0, users: [] });
        }
        const data = grouped.get(reaction.emoji)!;
        data.count++;
        data.users.push(reaction.userId);
    }

    return grouped;
};

/**
 * MessageItemNew Component
 * Displays a single message with proper alignment and styling
 */
export const MessageItemNew: React.FC<MessageItemNewProps> = ({
    message,
    currentUserId,
    senderAvatar,
    senderName,
    onImageClick,
    onReact,
    onDelete,
    onRecall,
    onReply,
    isLoading = false,
}) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [hovered, setHovered] = useState(false);

    // Determine if message is from current user
    // Compare senderBy (UUID or phoneNumber) with currentUserId
    const isCurrentUser = message.senderBy === currentUserId;

    // Get avatar URL
    const avatarUrl = senderAvatar || getAvatarUrl(message.senderBy);

    // Format timestamp
    const timeStr = formatTime(message.createdAt);

    // Group reactions
    const reactionsGrouped = useMemo(
        () => groupReactions(message.reactions),
        [message.reactions],
    );

    // Check if message is deleted or recalled
    const isMessageDeleted =
        message.isDeleted || message.deletedForUsers?.includes(currentUserId);

    // Message content rendering
    const renderFileIcon = (icon?: Message['fileIcon']) => {
        switch (icon) {
            case 'image':
                return <FiImage className="w-4 h-4 text-emerald-600" />;
            case 'video':
                return <FiVideo className="w-4 h-4 text-blue-600" />;
            case 'audio':
                return <FiMusic className="w-4 h-4 text-indigo-600" />;
            case 'file-pdf':
                return <FaFilePdf className="w-4 h-4 text-red-600" />;
            case 'file-word':
                return <FaFileWord className="w-4 h-4 text-blue-700" />;
            case 'file-excel':
                return <FaFileExcel className="w-4 h-4 text-green-700" />;
            case 'file-powerpoint':
                return <FaFilePowerpoint className="w-4 h-4 text-orange-600" />;
            case 'file-archive':
                return <FaFileArchive className="w-4 h-4 text-amber-700" />;
            case 'file-text':
                return <FiFileText className="w-4 h-4 text-slate-600" />;
            default:
                return <FiFile className="w-4 h-4 text-slate-500" />;
        }
    };

    const renderMessageContent = () => {
        if (isMessageDeleted) {
            return <p className="italic text-gray-400">Tin nhắn đã bị xóa</p>;
        }

        if (message.messageType === 'IMAGE' && message.mediaUrl) {
            return (
                <img
                    src={message.mediaUrl}
                    alt="message-image"
                    className="max-w-xs rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={onImageClick}
                />
            );
        }

        if (message.messageType === 'FILE' && message.mediaUrl) {
            return (
                <a
                    href={message.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 hover:underline"
                >
                    <span>{renderFileIcon(message.fileIcon)}</span>
                    <span className="text-sm">
                        {message.fileName || 'File'}
                    </span>
                </a>
            );
        }

        if (message.messageType === 'VIDEO' && message.mediaUrl) {
            return (
                <VideoMessage
                    videoUrl={message.mediaUrl}
                    fileName={message.fileName || 'Video'}
                />
            );
        }

        return (
            <p className="break-word whitespace-pre-wrap">{message.content}</p>
        );
    };

    return (
        <div
            className={`flex gap-3 px-4 py-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} group`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false);
                setShowEmojiPicker(false);
            }}
        >
            {/* Avatar - Hidden for current user, shown for others */}
            {!isCurrentUser ? (
                <div className="shrink-0">
                    <img
                        src={avatarUrl}
                        alt={senderName || message.senderBy}
                        className="w-8 h-8 rounded-full object-cover shadow-sm"
                        title={`${senderName || message.senderBy}`}
                    />
                </div>
            ) : (
                <div className="shrink-0 w-8" />
            )}

            {/* Message Container */}
            <div
                className={`flex flex-col gap-1 ${
                    isCurrentUser ? 'items-end' : 'items-start'
                } flex-1 max-w-xs lg:max-w-md`}
            >
                {/* Sender Name (for group chats) */}
                {!isCurrentUser && senderName && (
                    <p className="text-xs font-semibold text-gray-600 px-3">
                        {senderName}
                    </p>
                )}

                {/* Message Bubble */}
                <div className="relative group">
                    {/* Action Menu */}
                    {hovered && !isMessageDeleted && (
                        <div
                            className={`absolute bottom-full ${
                                isCurrentUser ? 'right-0' : 'left-0'
                            } mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 flex flex-col min-w-max`}
                        >
                            {/* Emoji Reaction Trigger */}
                            <div className="relative group/emoji px-2 py-1">
                                <button
                                    className="text-sm hover:bg-gray-100 px-2 py-1 rounded transition-colors w-full text-left"
                                    onClick={() =>
                                        setShowEmojiPicker(!showEmojiPicker)
                                    }
                                >
                                    😊 React
                                </button>

                                {/* Emoji Picker */}
                                {showEmojiPicker && (
                                    <div className=" w-50 absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50">
                                        <div className="w-40">
                                            {EMOJI_LIST.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    className="text-lg hover:scale-125 transition-transform p-1 hover:bg-gray-100 rounded"
                                                    onClick={() => {
                                                        onReact?.(emoji);
                                                        setShowEmojiPicker(
                                                            false,
                                                        );
                                                    }}
                                                    title={emoji}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reply Button */}
                            {onReply && (
                                <button
                                    className="text-sm hover:bg-gray-100 px-3 py-1 transition-colors text-left w-full"
                                    onClick={onReply}
                                >
                                    💬 Reply
                                </button>
                            )}

                            {/* Recall Button (for current user) */}
                            {isCurrentUser && onRecall && !isMessageDeleted && (
                                <button
                                    className="text-sm hover:bg-red-100 px-3 py-1 transition-colors text-left w-full text-red-600"
                                    onClick={onRecall}
                                >
                                    🔄 Recall
                                </button>
                            )}

                            {/* Delete Button */}
                            {onDelete && (
                                <button
                                    className="text-sm hover:bg-red-100 px-3 py-1 transition-colors text-left w-full text-red-600"
                                    onClick={onDelete}
                                >
                                    🗑️ Delete
                                </button>
                            )}
                        </div>
                    )}

                    {/* Message Bubble Content */}
                    <div
                        className={`px-4 py-2 rounded-2xl ${
                            isCurrentUser
                                ? 'bg-green-message text-white rounded-br-none shadow-md'
                                : 'bg-gray-100 text-gray-900 rounded-bl-none shadow-sm border border-gray-200'
                        } ${isLoading ? 'opacity-60' : ''}`}
                    >
                        {renderMessageContent()}
                    </div>

                    {/* Timestamp */}
                    <p
                        className={`text-xs mt-1 px-2 ${
                            isCurrentUser
                                ? 'text-gray-500 text-right'
                                : 'text-gray-400 text-left'
                        }`}
                    >
                        {timeStr}
                        {isCurrentUser &&
                            message.messageStatus === 'READ' &&
                            ' ✓✓'}
                        {isCurrentUser &&
                            message.messageStatus === 'DELIVERED' &&
                            ' ✓'}
                    </p>
                </div>

                {/* Reactions Display */}
                {reactionsGrouped.size > 0 && (
                    <div
                        className={`flex flex-wrap gap-1 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                        {Array.from(reactionsGrouped.entries()).map(
                            ([emoji, { count }]) => (
                                <button
                                    key={emoji}
                                    onClick={() => onReact?.(emoji)}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-full text-xs transition-colors"
                                    title={`${count} people reacted`}
                                >
                                    <span>{emoji}</span>
                                    {count > 1 && (
                                        <span className="text-xs text-gray-600">
                                            {count}
                                        </span>
                                    )}
                                </button>
                            ),
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageItemNew;
