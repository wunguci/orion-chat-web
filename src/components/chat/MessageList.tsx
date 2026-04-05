import React, { useEffect, useRef, useState } from 'react';
import ImageViewer from './ImageViewer';
import type { ViewerImage } from './ImageViewer';

// Inspired by Zalo's emoji reactions
const EMOJI_LIST = [
    '👍', // Like
    '❤️', // Love
    '😂', // Laugh
    '😮', // Wow
    '😢', // Sad
    '😡', // Angry
    '🔥', // Fire/Hot
    '😎', // Cool
    '🤔', // Thinking
    '✨', // Sparkle
    '🎉', // Party
    '👏', // Clap
];

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

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
    content: string;
    timestamp: string;
    conversationId?: string;
    type?: 'text' | 'image' | 'file' | 'audio';
    isFile?: boolean;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    isRecalled?: boolean;
    reactions?: MessageReaction[];
};

export const MessageList: React.FC<{
    socketMessages?: SocketMessage[];
    currentUserId?: string;
    conversationId?: string | null;
    onRecallMessage?: (message: SocketMessage) => void;
    onDeleteMessage?: (message: SocketMessage) => void;
    onForwardMessage?: (message: SocketMessage) => void;
    onReactMessage?: (message: SocketMessage, emoji: string) => void;
}> = ({
    socketMessages = [],
    currentUserId,
    conversationId,
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

    const allImages: ViewerImage[] = socketMessages
        .filter(
            (m): m is SocketMessage & { fileUrl: string; fileType: string } =>
                !!m.fileUrl && m.fileType?.startsWith('image/') === true,
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
                'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.senderId,
        }));

    let imgCounter = -1;

    return (
        <>
            <div
                ref={scrollContainerRef}
                className="flex-1 bg-[#f5f7fa] overflow-y-auto py-4 space-y-4"
            >
                {socketMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <p>Không có tin nhắn nào. Bắt đầu cuộc trò chuyện!</p>
                    </div>
                ) : (
                    socketMessages.map((msg) => {
                        const isMe = msg.senderId === currentUserId;
                        const messageKey = getMessageKey(msg);
                        const reactionStats = getReactionStats(msg);
                        const hasImage =
                            msg.isFile &&
                            msg.fileType?.startsWith('image/') === true;
                        if (hasImage) imgCounter++;
                        const imgIdx = imgCounter;

                        return (
                            <div
                                key={messageKey}
                                className={`flex gap-2 px-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden shadow-sm">
                                    <img
                                        src={
                                            'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
                                            msg.senderId
                                        }
                                        alt={msg.senderName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div
                                    className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col relative group`}
                                >
                                    {!isMe && (
                                        <p className="text-xs font-semibold text-slate-600 mb-0.5 px-3">
                                            {msg.senderName}
                                        </p>
                                    )}

                                    <div
                                        className={
                                            msg.isFile &&
                                            msg.fileUrl &&
                                            msg.fileType?.startsWith('image/')
                                                ? ''
                                                : `px-4 py-2 rounded-2xl text-sm ${
                                                      isMe
                                                          ? 'bg-green-message text-white rounded-tr-none'
                                                          : 'bg-white text-slate-800 rounded-tl-none shadow-sm'
                                                  }`
                                        }
                                    >
                                        {msg.isRecalled ? (
                                            <p className="italic text-slate-500 wrap-break-word">
                                                Tin nhắn đã được thu hồi
                                            </p>
                                        ) : msg.isFile && msg.fileUrl ? (
                                            msg.fileType?.startsWith(
                                                'image/',
                                            ) ? (
                                                <img
                                                    src={
                                                        msg.fileUrl.startsWith(
                                                            'http',
                                                        ) ||
                                                        msg.fileUrl.startsWith(
                                                            'blob:',
                                                        )
                                                            ? msg.fileUrl
                                                            : `${SERVER_URL}${msg.fileUrl}`
                                                    }
                                                    alt={msg.fileName}
                                                    className="max-w-50 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() =>
                                                        setViewerIndex(imgIdx)
                                                    }
                                                />
                                            ) : (
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
                                                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 hover:underline text-sm"
                                                >
                                                    📎 {msg.fileName}
                                                </a>
                                            )
                                        ) : (
                                            <p className="wrap-break-word">
                                                {msg.content}
                                            </p>
                                        )}

                                        <p
                                            className={`text-[10px] mt-1 ${isMe ? 'text-green-message' : 'text-slate-400'}`}
                                        >
                                            {new Date(
                                                msg.timestamp,
                                            ).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>

                                    {!msg.isRecalled &&
                                        reactionStats.size > 0 && (
                                            <div
                                                className={`flex items-center gap-2 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
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
                                                            className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-xs border transition-colors ${
                                                                reactedByMe
                                                                    ? 'bg-green-message border-green-message text-white'
                                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <span>{emoji}</span>
                                                            {count > 1 && (
                                                                <span className="text-[11px]">
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
                                            className={`absolute -bottom-2 ${isMe ? '-left-2' : '-right-2'} opacity-0 group-hover:opacity-100 transition-opacity`}
                                        >
                                            <div className="relative group/emoji">
                                                <button
                                                    className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow text-sm hover:bg-green-message hover:text-white hover:border-green-message transition-colors flex items-center justify-center"
                                                    title="Bày tỏ cảm xúc"
                                                >
                                                    😊
                                                </button>
                                                <div
                                                    className={`absolute bottom-8 ${isMe ? 'right-0' : 'left-0'} bg-white border border-slate-200 rounded-lg shadow-xl px-2 py-2.5 z-50 opacity-0 invisible group-hover/emoji:opacity-100 group-hover/emoji:visible transition-all`}
                                                >
                                                    <div className="grid grid-cols-4 gap-1.5 w-32">
                                                        {EMOJI_LIST.map((e) => (
                                                            <button
                                                                key={e}
                                                                className="text-lg hover:scale-125 transition-transform leading-none p-1"
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

                                    <div
                                        className={`absolute top-0 ${isMe ? '-left-11' : '-right-11'} opacity-0 group-hover:opacity-100 transition-opacity`}
                                    >
                                        <div className="relative">
                                            <button
                                                onClick={() =>
                                                    setOpenActionMenuKey(
                                                        (prev) =>
                                                            prev === messageKey
                                                                ? null
                                                                : messageKey,
                                                    )
                                                }
                                                className="w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:bg-slate-50"
                                                title="Tùy chọn tin nhắn"
                                            >
                                                ⋯
                                            </button>

                                            {openActionMenuKey ===
                                                messageKey && (
                                                <div
                                                    className={`absolute top-8 ${isMe ? 'left-0' : 'right-0'} z-50 min-w-36 rounded-lg border border-slate-200 bg-white shadow-lg py-1`}
                                                >
                                                    {isMe &&
                                                        !msg.isRecalled && (
                                                            <button
                                                                onClick={() => {
                                                                    onRecallMessage?.(
                                                                        msg,
                                                                    );
                                                                    setOpenActionMenuKey(
                                                                        null,
                                                                    );
                                                                }}
                                                                className="w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                                                            >
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
                                                        className="w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                                                    >
                                                        Xóa ở phía tôi
                                                    </button>

                                                    {!msg.isRecalled && (
                                                        <button
                                                            onClick={() => {
                                                                onForwardMessage?.(
                                                                    msg,
                                                                );
                                                                setOpenActionMenuKey(
                                                                    null,
                                                                );
                                                            }}
                                                            className="w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                                                        >
                                                            Chuyển tiếp
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
