import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Lock, Trash2, Undo2Icon } from 'lucide-react';
import {
    FaFileArchive,
    FaFileExcel,
    FaFilePdf,
    FaFilePowerpoint,
    FaFileWord,
} from 'react-icons/fa';
import { FiFile, FiFileText, FiImage, FiMusic, FiVideo } from 'react-icons/fi';
import ImageViewer from './ImageViewer';
import type { ViewerImage } from './ImageViewer';
import CallHistoryCard from './CallHistoryCard';

// Inspired by Zalo's emoji reactions
const EMOJI_LIST = [
    '👍', // Like
    '❤️', // Love
    '😂', // Laugh
    '😮', // Wow
    '😢', // Sad
    '😡', // Angry
    // '🔥', // Fire/Hot
    // '😎', // Cool
    // '🤔', // Thinking
    // '✨', // Sparkle
    // '🎉', // Party
    // '👏', // Clap
];

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:3000";

const toAbsoluteMediaUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${normalizedBase}${normalizedPath}`;
};

type MessageReaction = {
    userId: string;
    emoji: string;
    reactedAt?: string;
};

export type SocketMessage = {
    id: string;
    clientMessageId?: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    content: string;
    timestamp: string;
    messageStatus?:
        | 'SENDING'
        | 'SENT'
        | 'DELIVERED'
        | 'READ'
        | 'SEEN'
        | 'FAILED'
        | 'UPLOADING';
    conversationId?: string;
    type?: 'text' | 'image' | 'file' | 'audio' | 'video' | 'call';
    isFile?: boolean;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileExtension?: string;
    fileCategory?: 'image' | 'video' | 'audio' | 'file';
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
    uploadStatus?: 'uploading' | 'sent' | 'failed';
    errorMessage?: string;
    isRecalled?: boolean;
    isDeleted?: boolean;
    deletedForUsers?: string[];
    replyToMessageId?: string;
    forwardedFromMessageId?: string;
    seenBy?: Array<string | { userId: string; seenAt?: string }>;
    reactions?: MessageReaction[];
    callData?: {
        callType?: 'audio' | 'video';
        callStatus?: 'completed' | 'missed' | 'declined';
        duration?: number;
        participants?: string[];
        isInitiator?: boolean;
        wasRejected?: boolean;
    };
};

export const MessageList: React.FC<{
    socketMessages?: SocketMessage[];
    currentUserId?: string;
    conversationId?: string | null;
    myIsHidden?: boolean;
    onCallBackMessage?: (message: SocketMessage) => void;
    onRecallMessage?: (message: SocketMessage) => void;
    onDeleteMessage?: (message: SocketMessage) => void;
    onForwardMessage?: (message: SocketMessage) => void;
    onReactMessage?: (message: SocketMessage, emoji: string) => void;
}> = ({
    socketMessages = [],
    currentUserId,
    conversationId,
    myIsHidden = false,
    onCallBackMessage,
    onRecallMessage,
    onDeleteMessage,
    onForwardMessage,
    onReactMessage,
}) => {
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const [openActionMenuKey, setOpenActionMenuKey] = useState<string | null>(
        null,
    );
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const getMessageKey = (message: SocketMessage) =>
        message.clientMessageId || message.id;

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    }, [conversationId, socketMessages.length]);

    useEffect(() => {
        setOpenActionMenuKey(null);
    }, [conversationId]);

    const getReactionStats = (message: SocketMessage) => {
        const raw = Array.isArray(message.reactions) ? message.reactions : [];
        const grouped = new Map<
            string,
            { count: number; reactedByMe: boolean }
        >();

        for (const reaction of raw) {
            if (!reaction?.emoji) continue;
            const existing = grouped.get(reaction.emoji);
            grouped.set(reaction.emoji, {
                count: (existing?.count || 0) + 1,
                reactedByMe:
                    existing?.reactedByMe ||
                    false ||
                    reaction.userId === currentUserId,
            });
        }

        return grouped;
    };

    const renderFileIcon = (icon?: SocketMessage['fileIcon']) => {
        switch (icon) {
            case 'image':
                return <FiImage className="w-5 h-5 text-emerald-600" />;
            case 'video':
                return <FiVideo className="w-5 h-5 text-blue-600" />;
            case 'audio':
                return <FiMusic className="w-5 h-5 text-indigo-600" />;
            case 'file-pdf':
                return <FaFilePdf className="w-5 h-5 text-red-600" />;
            case 'file-word':
                return <FaFileWord className="w-5 h-5 text-blue-700" />;
            case 'file-excel':
                return <FaFileExcel className="w-5 h-5 text-green-700" />;
            case 'file-powerpoint':
                return <FaFilePowerpoint className="w-5 h-5 text-orange-600" />;
            case 'file-archive':
                return <FaFileArchive className="w-5 h-5 text-amber-700" />;
            case 'file-text':
                return <FiFileText className="w-5 h-5 text-slate-600" />;
            default:
                return <FiFile className="w-5 h-5 text-slate-600" />;
        }
    };

    const getUploadStatusLabel = (status?: SocketMessage['uploadStatus']) => {
        if (status === 'uploading') return 'Uploading';
        if (status === 'failed') return 'Failed';
        return 'Sent';
    };

    const renderContentWithLinks = (content: string, isMe: boolean) => {
        const urlRegex = /(https?:\/\/\S+|www\.\S+)/gi;
        const parts = content.split(urlRegex);

        return (
            <>
                {parts.map((part, idx) => {
                    if (!part) return null;

                    if (/^https?:\/\/|^www\./i.test(part)) {
                        const href = part.startsWith('http')
                            ? part
                            : `https://${part}`;

                        return (
                            <a
                                key={idx}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`break-all hover:underline ${
                                    isMe ? 'text-white' : 'text-blue-500'
                                }`}
                                onClick={(e) => {
                                    if (!e.ctrlKey && !e.metaKey) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                {part}
                            </a>
                        );
                    }

                    return (
                        <span key={idx} className="break-all">
                            {part}
                        </span>
                    );
                })}
            </>
        );
    };

    const allImages: ViewerImage[] = socketMessages
        .filter(
            (m): m is SocketMessage & { fileUrl: string; fileType: string } =>
                !!m.fileUrl &&
                (m.fileType?.startsWith('image/') === true ||
                    m.fileCategory === 'image' ||
                    m.type === 'image' ||
                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
                        m.fileName || '',
                    )),
        )
        .map((m) => ({
            src:
                m.fileUrl.startsWith('http') || m.fileUrl.startsWith('blob:')
                    ? m.fileUrl
                    : `${SERVER_URL}${m.fileUrl}`,
            time: new Date(m.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            date: new Date(m.timestamp).toLocaleDateString('vi-VN'),
            senderName: m.senderName,
            senderAvatar:
                m.senderAvatar ||
                'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.senderId,
        }));

    const messageLookup = useMemo(() => {
        const lookup = new Map<string, SocketMessage>();
        socketMessages.forEach((msg) => {
            lookup.set(msg.id, msg);
            if (msg.clientMessageId) {
                lookup.set(msg.clientMessageId, msg);
            }
        });
        return lookup;
    }, [socketMessages]);

    const getSeenCount = (message: SocketMessage) => {
        if (!Array.isArray(message.seenBy)) return 0;

        return message.seenBy.reduce((count, item) => {
            if (typeof item === 'string') {
                return item && item !== currentUserId ? count + 1 : count;
            }

            return item.userId && item.userId !== currentUserId
                ? count + 1
                : count;
        }, 0);
    };

    const resolveReplyMessage = (message: SocketMessage) => {
        if (!message.replyToMessageId) return null;
        return messageLookup.get(message.replyToMessageId) || null;
    };

    let imgCounter = -1;

    return (
        <>
            <div
                ref={scrollContainerRef}
                className="flex-1 bg-[#f5f7fa] overflow-y-auto py-4 space-y-4"
            >
                {myIsHidden ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <Lock size={48} className="text-yellow-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-700">
                                    Trò chuyện đã bị ẩn
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Hãy nhập mật khẩu chính xác để xem lại lịch
                                    sử tin nhắn
                                </p>
                            </div>
                        </div>
                    </div>
                ) : socketMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <p>Không có tin nhắn nào. Bắt đầu cuộc trò chuyện!</p>
                    </div>
                ) : (
                    socketMessages.map((msg) => {
                        const isMe =
                            !!currentUserId && msg.senderId === currentUserId;

                        const messageKey = getMessageKey(msg);
                        const reactionStats = getReactionStats(msg);
                        const hasImage =
                            msg.isFile &&
                            (msg.fileType?.startsWith('image/') === true ||
                                msg.fileCategory === 'image' ||
                                msg.type === 'image' ||
                                /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
                                    msg.fileName || '',
                                ));
                        if (hasImage) imgCounter++;
                        const imgIdx = imgCounter;
                        const isVideoFile =
                            msg.isFile &&
                            (msg.fileType?.startsWith('video/') === true ||
                                msg.fileCategory === 'video' ||
                                msg.type === 'video' ||
                                /\.(mp4|mov|webm|mkv|avi|wmv|flv|m4v)$/i.test(
                                    msg.fileName || '',
                                ));
                        const isAudioFile =
                            msg.isFile &&
                            (msg.fileType?.startsWith('audio/') === true ||
                                msg.fileCategory === 'audio' ||
                                msg.type === 'audio');

                        const senderAvatar =
                            toAbsoluteMediaUrl(msg.senderAvatar) ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}`;

                        return (
                            <div
                                key={messageKey}
                                id={`message-${msg.id}`}
                                className={`flex gap-3 px-4 py-1 ${
                                    isMe ? 'flex-row-reverse' : 'flex-row'
                                }`}
                            >
                                {!isMe ? (
                                    <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden shadow-sm">
                                        <img
                                            src={senderAvatar}
                                            alt={msg.senderName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="shrink-0 w-8" />
                                )}

                                <div
                                    className={`flex flex-col gap-1 max-w-[70%] ${
                                        isMe ? 'items-end' : 'items-start'
                                    } relative group`}
                                >
                                    {!isMe && msg.senderName && (
                                        <p className="text-xs font-semibold text-slate-600 px-3">
                                            {msg.senderName}
                                        </p>
                                    )}

                                    {!msg.isRecalled &&
                                    msg.type === 'call' &&
                                    msg.callData ? (
                                        <CallHistoryCard
                                            callType={
                                                msg.callData.callType || 'audio'
                                            }
                                            callStatus={
                                                msg.callData.callStatus ||
                                                'completed'
                                            }
                                            duration={msg.callData.duration}
                                            isMe={isMe}
                                            isInitiator={
                                                msg.callData?.isInitiator ||
                                                false
                                            }
                                            onCallBack={() => {
                                                onCallBackMessage?.(msg);
                                            }}
                                        />
                                    ) : !msg.isRecalled &&
                                      msg.isFile &&
                                      msg.fileUrl &&
                                      hasImage ? (
                                        <img
                                            src={
                                                msg.fileUrl.startsWith('http') ||
                                                msg.fileUrl.startsWith('blob:')
                                                    ? msg.fileUrl
                                                    : `${SERVER_URL}${msg.fileUrl}`
                                            }
                                            alt={msg.fileName}
                                            className="max-w-sm rounded-2xl cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() =>
                                                setViewerIndex(imgIdx)
                                            }
                                        />
                                    ) : !msg.isRecalled &&
                                      msg.isFile &&
                                      msg.fileUrl &&
                                      isVideoFile ? (
                                        <video
                                            src={
                                                msg.fileUrl.startsWith('http') ||
                                                msg.fileUrl.startsWith('blob:')
                                                    ? msg.fileUrl
                                                    : `${SERVER_URL}${msg.fileUrl}`
                                            }
                                            controls
                                            className="max-w-sm rounded-2xl"
                                        />
                                    ) : !msg.isRecalled &&
                                      msg.isFile &&
                                      msg.fileUrl &&
                                      isAudioFile ? (
                                        <div
                                            className={`px-4 py-3 rounded-2xl ${
                                                isMe
                                                    ? 'bg-green-message text-white rounded-br-none shadow-md'
                                                    : 'bg-white text-slate-800 rounded-tl-none shadow-sm border border-slate-200'
                                            }`}
                                        >
                                            <audio
                                                src={
                                                    msg.fileUrl.startsWith('http') ||
                                                    msg.fileUrl.startsWith(
                                                        'blob:',
                                                    )
                                                        ? msg.fileUrl
                                                        : `${SERVER_URL}${msg.fileUrl}`
                                                }
                                                controls
                                                className="max-w-xs"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            {resolveReplyMessage(msg) && (
                                                <div
                                                    className={`mb-2 max-w-full rounded-xl border px-3 py-2 text-xs ${
                                                        isMe
                                                            ? 'border-white/20 bg-white/10 text-white'
                                                            : 'border-slate-200 bg-slate-50 text-slate-600'
                                                    }`}
                                                >
                                                    <div className="font-semibold">
                                                        Trả lời{' '}
                                                        {resolveReplyMessage(
                                                            msg,
                                                        )?.senderName ||
                                                            'tin nhắn'}
                                                    </div>
                                                    <div className="truncate opacity-80">
                                                        {resolveReplyMessage(
                                                            msg,
                                                        )?.content ||
                                                            resolveReplyMessage(
                                                                msg,
                                                            )?.fileName ||
                                                            'Tin nhắn'}
                                                    </div>
                                                </div>
                                            )}

                                            {msg.forwardedFromMessageId && (
                                                <div
                                                    className={`mb-2 rounded-xl border px-3 py-2 text-[11px] italic ${
                                                        isMe
                                                            ? 'border-white/20 bg-white/10 text-white'
                                                            : 'border-slate-200 bg-slate-50 text-slate-500'
                                                    }`}
                                                >
                                                    Tin nhắn được chuyển tiếp
                                                </div>
                                            )}

                                            <div
                                                className={`px-4 py-2 rounded-2xl text-sm ${
                                                    msg.isRecalled
                                                        ? 'bg-gray-100 text-gray-500 shadow-none border border-gray-200'
                                                        : isMe
                                                          ? 'bg-green-message text-white rounded-br-none shadow-md'
                                                          : 'bg-white text-slate-800 rounded-tl-none shadow-sm border border-slate-200'
                                                }`}
                                            >
                                                {msg.isRecalled ? (
                                                    <div className="rounded-2xl">
                                                        <p className="italic text-gray-500">
                                                            Tin nhắn đã được thu
                                                            hồi
                                                        </p>
                                                    </div>
                                                ) : msg.isFile &&
                                                  msg.fileUrl ? (
                                                    <a
                                                        href={
                                                            msg.fileUrl.startsWith(
                                                                'http',
                                                            )
                                                                ? msg.fileUrl
                                                                : `${SERVER_URL}${msg.fileUrl}`
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`flex items-center gap-2 p-2 rounded-xl border ${
                                                            isMe
                                                                ? 'text-white border-white/30'
                                                                : 'text-blue-500 hover:text-blue-600 border-slate-200'
                                                        }`}
                                                    >
                                                        <span className="shrink-0">
                                                            {renderFileIcon(
                                                                msg.fileIcon,
                                                            )}
                                                        </span>
                                                        <span className="truncate">
                                                            {msg.fileName}
                                                        </span>
                                                    </a>
                                                ) : (
                                                    <p className="break-all whitespace-pre-wrap">
                                                        {renderContentWithLinks(
                                                            msg.content,
                                                            isMe,
                                                        )}
                                                    </p>
                                                )}

                                                <p
                                                    className={`text-[11px] mt-1 ${
                                                        isMe
                                                            ? 'text-green-100'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    {new Date(
                                                        msg.timestamp,
                                                    ).toLocaleTimeString(
                                                        'vi-VN',
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                    {isMe && (
                                                        <span
                                                            className={`ml-2 font-medium ${
                                                                msg.uploadStatus ===
                                                                'failed'
                                                                    ? 'text-rose-200'
                                                                    : msg.uploadStatus ===
                                                                        'uploading'
                                                                      ? 'text-amber-100'
                                                                      : 'text-green-100'
                                                            }`}
                                                        >
                                                            {getUploadStatusLabel(
                                                                msg.uploadStatus,
                                                            )}
                                                        </span>
                                                    )}
                                                    {isMe &&
                                                        getSeenCount(msg) >
                                                            0 && (
                                                            <span className="ml-2 text-emerald-200 font-medium">
                                                                Đã xem{' '}
                                                                {getSeenCount(
                                                                    msg,
                                                                )}
                                                            </span>
                                                        )}
                                                </p>
                                                {isMe &&
                                                    msg.uploadStatus ===
                                                        'failed' &&
                                                    msg.errorMessage && (
                                                        <p className="text-[11px] mt-1 text-rose-200 break-all">
                                                            {msg.errorMessage}
                                                        </p>
                                                    )}
                                            </div>
                                        </>
                                    )}

                                    {!msg.isRecalled &&
                                        reactionStats.size > 0 && (
                                            <div
                                                className={`flex items-center gap-1 mt-1 ${
                                                    isMe
                                                        ? 'justify-end'
                                                        : 'justify-start'
                                                }`}
                                            >
                                                {Array.from(
                                                    reactionStats.entries(),
                                                ).map(
                                                    ([
                                                        emoji,
                                                        { count, reactedByMe },
                                                    ]) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() =>
                                                                onReactMessage?.(
                                                                    msg,
                                                                    emoji,
                                                                )
                                                            }
                                                            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                                                                reactedByMe
                                                                    ? 'bg-green-100 border-green-400 text-green-700'
                                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <span>{emoji}</span>
                                                            {count > 1 && (
                                                                <span>
                                                                    {count}
                                                                </span>
                                                            )}
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                    {!msg.isRecalled && (
                                        <div
                                            className={`absolute -bottom-3 ${
                                                isMe ? '-left-10' : '-right-10'
                                            } opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                                        >
                                            <div className="relative group/emoji">
                                                <button
                                                    className="w-7 h-7 rounded-full bg-white border border-slate-300 shadow-md text-lg flex items-center justify-center hover:scale-110 transition-transform"
                                                    title="Thêm cảm xúc"
                                                >
                                                    😊
                                                </button>

                                                <div
                                                    className={`absolute bottom-9 ${
                                                        isMe
                                                            ? 'right-0'
                                                            : 'left-0'
                                                    } opacity-0 invisible group-hover/emoji:opacity-100 group-hover/emoji:visible transition-all duration-150 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-2`}
                                                >
                                                    <div className="grid grid-cols-6 w-40">
                                                        {EMOJI_LIST.map((e) => (
                                                            <button
                                                                key={e}
                                                                className="text-lg hover:scale-125 transition-transform hover:bg-slate-100 rounded"
                                                                onClick={() =>
                                                                    onReactMessage?.(
                                                                        msg,
                                                                        e,
                                                                    )
                                                                }
                                                                title={e}
                                                            >
                                                                {e}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!msg.isRecalled && (
                                        <div
                                            className={`absolute top-0 ${
                                                isMe ? '-left-10' : '-right-10'
                                            } opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                                        >
                                            <button
                                                onClick={() =>
                                                    setOpenActionMenuKey(
                                                        (prev) =>
                                                            prev === messageKey
                                                                ? null
                                                                : messageKey,
                                                    )
                                                }
                                                className="w-7 h-7 rounded-full bg-white border border-slate-300 shadow text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors font-bold text-lg flex items-center justify-center"
                                                title="Tùy chọn"
                                            >
                                                ⋮
                                            </button>

                                            {openActionMenuKey ===
                                                messageKey && (
                                                <div
                                                    className={`absolute top-8 ${
                                                        isMe
                                                            ? 'left-0'
                                                            : 'right-0'
                                                    } z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-40`}
                                                >
                                                    {isMe && (
                                                        <button
                                                            onClick={() => {
                                                                onRecallMessage?.(
                                                                    msg,
                                                                );
                                                                setOpenActionMenuKey(
                                                                    null,
                                                                );
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-red-50 border-b border-slate-100"
                                                        >
                                                            <Undo2Icon
                                                                size={16}
                                                                className="inline mr-2"
                                                            />
                                                            Thu hồi
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => {
                                                            onDeleteMessage?.(
                                                                msg,
                                                            );
                                                            setOpenActionMenuKey(
                                                                null,
                                                            );
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-red-50 border-b border-slate-100"
                                                    >
                                                        <Trash2
                                                            size={16}
                                                            className="inline mr-2"
                                                        />
                                                        Xóa
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            onForwardMessage?.(
                                                                msg,
                                                            );
                                                            setOpenActionMenuKey(
                                                                null,
                                                            );
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                                    >
                                                        <ArrowRight
                                                            size={16}
                                                            className="inline mr-2"
                                                        />
                                                        Chuyển tiếp
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {viewerIndex !== null && (
                <ImageViewer
                    images={allImages}
                    initialIndex={viewerIndex}
                    onClose={() => setViewerIndex(null)}
                />
            )}
        </>
    );
};

export default MessageList;
