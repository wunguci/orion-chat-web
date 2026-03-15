import React, { useState } from 'react';
import ImageViewer from './ImageViewer';
import type { ViewerImage } from './ImageViewer';

const EMOJI_LIST = ['❤️', '😆', '😮', '😢', '😡', '👍'];

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

type ReactionMap = Record<
    number,
    Record<string, { count: number; reactedByMe: boolean }>
>;

export type SocketMessage = {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
    isFile?: boolean;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
};

export const MessageList: React.FC<{
    socketMessages?: SocketMessage[];
    currentUserId?: string;
}> = ({ socketMessages = [], currentUserId }) => {
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const [reactionMap, setReactionMap] = useState<ReactionMap>({});

    const handleReact = (msgIndex: number, emoji: string) => {
        setReactionMap((prev) => {
            const msgReactions = prev[msgIndex] ?? {};
            const existing = msgReactions[emoji];
            if (existing?.reactedByMe) {
                const newCount = existing.count - 1;
                if (newCount === 0) {
                    const rest = Object.fromEntries(
                        Object.entries(msgReactions).filter(
                            ([k]) => k !== emoji,
                        ),
                    );
                    return { ...prev, [msgIndex]: rest };
                }
                return {
                    ...prev,
                    [msgIndex]: {
                        ...msgReactions,
                        [emoji]: { count: newCount, reactedByMe: false },
                    },
                };
            }
            return {
                ...prev,
                [msgIndex]: {
                    ...msgReactions,
                    [emoji]: {
                        count: (existing?.count ?? 0) + 1,
                        reactedByMe: true,
                    },
                },
            };
        });
    };

    const allImages: ViewerImage[] = socketMessages
        .filter(
            (m): m is SocketMessage & { fileUrl: string; fileType: string } =>
                !!m.fileUrl && m.fileType?.startsWith('image/') === true,
        )
        .map((m) => ({
            src: `${SERVER_URL}${m.fileUrl}`,
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
            <div className="flex-1 bg-[#f5f7fa] overflow-y-auto py-4 space-y-4">
                {socketMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <p>Không có tin nhắn nào. Bắt đầu cuộc trò chuyện!</p>
                    </div>
                ) : (
                    socketMessages.map((msg, i) => {
                        const isMe = msg.senderId === currentUserId;
                        const hasImage =
                            msg.isFile &&
                            msg.fileType?.startsWith('image/') === true;
                        if (hasImage) imgCounter++;
                        const imgIdx = imgCounter;

                        return (
                            <div
                                key={msg.id}
                                className={`flex gap-2 px-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden shadow-sm">
                                    <img
                                        src={
                                            'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
                                            msg.senderId
                                        }
                                        alt={msg.senderName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Message bubble */}
                                <div
                                    className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}
                                >
                                    {/* Sender name cho tin nhắn từ người khác */}
                                    {!isMe && (
                                        <p className="text-xs font-semibold text-slate-600 mb-0.5 px-3">
                                            {msg.senderName}
                                        </p>
                                    )}

                                    {/* Content */}
                                    <div
                                        className={`px-4 py-2 rounded-2xl text-sm ${
                                            isMe
                                                ? 'bg-green-message text-white rounded-tr-none'
                                                : 'bg-white text-slate-800 rounded-tl-none shadow-sm'
                                        }`}
                                    >
                                        {msg.isFile && msg.fileUrl ? (
                                            msg.fileType?.startsWith(
                                                'image/',
                                            ) ? (
                                                <img
                                                    src={`${SERVER_URL}${msg.fileUrl}`}
                                                    alt={msg.fileName}
                                                    className="max-w-[200px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() =>
                                                        setViewerIndex(imgIdx)
                                                    }
                                                />
                                            ) : (
                                                <a
                                                    href={`${SERVER_URL}${msg.fileUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 hover:underline text-sm"
                                                >
                                                    📎 {msg.fileName}
                                                </a>
                                            )
                                        ) : (
                                            <p className="break-words">
                                                {msg.content}
                                            </p>
                                        )}

                                        {/* Timestamp */}
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

                                    {/* Reactions */}
                                    {reactionMap[i] &&
                                        Object.keys(reactionMap[i]).length >
                                            0 && (
                                            <div
                                                className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {Object.entries(
                                                    reactionMap[i],
                                                ).map(
                                                    ([
                                                        emoji,
                                                        { count, reactedByMe },
                                                    ]) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() =>
                                                                handleReact(
                                                                    i,
                                                                    emoji,
                                                                )
                                                            }
                                                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                                                                reactedByMe
                                                                    ? 'bg-green-message border-green-message text-white'
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
                                </div>

                                {/* Emoji reaction trigger */}
                                <div className="flex items-end h-8">
                                    <div className="peer group">
                                        <button
                                            className="w-6 h-6 rounded-full bg-white border border-slate-200 shadow text-sm hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                            onClick={() =>
                                                handleReact(i, EMOJI_LIST[0])
                                            }
                                            title="Bày tỏ cảm xúc"
                                        >
                                            😊
                                        </button>
                                        <div className="absolute bottom-9 left-0 bg-white border border-slate-200 rounded-full shadow-lg px-2 py-1.5 flex gap-1 z-50 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                            {EMOJI_LIST.map((e) => (
                                                <button
                                                    key={e}
                                                    className="text-lg hover:scale-125 transition-transform leading-none"
                                                    onClick={() =>
                                                        handleReact(i, e)
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
