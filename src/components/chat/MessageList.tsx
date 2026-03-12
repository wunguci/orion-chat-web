import React, { useState } from 'react';
import MessageItem from './MessageItem';
import type { Reaction } from './MessageItem';
import ImageViewer from './ImageViewer';
import type { ViewerImage } from './ImageViewer';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

type ReactionMap = Record<
    number,
    Record<string, { count: number; reactedByMe: boolean }>
>;

type Message = {
    side: 'left' | 'right';
    text?: string;
    time?: string;
    image?: string;
    date?: string;
};

const AVATAR_LEFT =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRqHljHwC3uFTM4IyU1hLVqc5KJgrzOFpMvA&s';
const AVATAR_RIGHT =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzKrfajYmPihSbKzKqPGaYkLY5xim-QYmbKw&s';

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

    const messages: Message[] = [
        {
            side: 'left',
            text: 'Who was that philosopher you shared with me recently?',
            time: '2:14 PM',
            date: '21/02',
        },
        {
            side: 'right',
            text: 'Roland Barthes',
            time: '2:16 PM',
            date: '21/02',
        },
        {
            side: 'left',
            text: "That's him! What was his vision statement?",
            time: '2:18 PM',
            date: '21/02',
        },
        {
            side: 'right',
            text: '"Ultimately in order to see a photograph well, it is best to look away or close your eyes."',
            time: '2:20 PM',
            date: '21/02',
        },
        {
            side: 'right',
            image: 'https://media.istockphoto.com/id/1158058362/vi/anh/ho%C3%A0ng-h%C3%B4n-helsinki-tr%C3%AAn-kh%C3%B4ng.jpg?s=612x612&w=0&k=20&c=FGXahTq3U-u9VPJ-IfJ0QanB5Ll9S9Yv0yIbZ_mBvl0=',
            time: '2:20 PM',
            date: '21/02',
        },
        {
            side: 'left',
            text: 'Aerial photograph from the Helsinki urban environment division',
            time: '2:22 PM',
            date: '21/02',
        },
    ];

    const allImages: ViewerImage[] = messages
        .filter((m): m is Message & { image: string } => !!m.image)
        .map((m) => ({
            src: m.image,
            time: m.time,
            date: m.date,
            senderName: m.side === 'right' ? 'You' : 'Olivia Isabella',
            senderAvatar: m.side === 'right' ? AVATAR_RIGHT : AVATAR_LEFT,
        }));

    let imgCounter = -1;

    return (
        <>
            <div className="flex-1 bg-[#f5f7fa] overflow-y-auto py-4 space-y-4">
                {messages.map((m, i) => {
                    const hasImage = !!m.image;
                    if (hasImage) imgCounter++;
                    const imgIdx = imgCounter;
                    return (
                        <MessageItem
                            key={i}
                            side={m.side}
                            text={m.text}
                            time={m.time}
                            image={m.image}
                            onImageClick={
                                hasImage
                                    ? () => setViewerIndex(imgIdx)
                                    : undefined
                            }
                            reactions={Object.entries(
                                reactionMap[i] ?? {},
                            ).map<Reaction>(
                                ([emoji, { count, reactedByMe }]) => ({
                                    emoji,
                                    count,
                                    reactedByMe,
                                }),
                            )}
                            onReact={(emoji) => handleReact(i, emoji)}
                        />
                    );
                })}

                {/* Messages từ WebSocket */}
                {socketMessages.length > 0 && (
                    <div className="px-4 pt-2 space-y-3 border-t border-slate-200 mt-2">
                        {socketMessages.map((msg) => {
                            const isMe = msg.senderId === currentUserId;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    <div
                                        className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                                            isMe
                                                ? 'bg-teal-500 text-white rounded-tr-none'
                                                : 'bg-white text-slate-800 rounded-tl-none shadow-sm'
                                        }`}
                                    >
                                        {!isMe && (
                                            <p className="text-xs font-semibold text-teal-600 mb-1">
                                                {msg.senderName}
                                            </p>
                                        )}

                                        {/* Nội dung: file hoặc text */}
                                        {msg.isFile && msg.fileUrl ? (
                                            msg.fileType?.startsWith(
                                                'image/',
                                            ) ? (
                                                <img
                                                    src={`${SERVER_URL}${msg.fileUrl}`}
                                                    alt={msg.fileName}
                                                    className="max-w-[200px] rounded-xl cursor-pointer"
                                                    onClick={() =>
                                                        window.open(
                                                            `${SERVER_URL}${msg.fileUrl}`,
                                                            '_blank',
                                                        )
                                                    }
                                                />
                                            ) : (
                                                <a
                                                    href={`${SERVER_URL}${msg.fileUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-blue-500 underline text-sm"
                                                >
                                                    📎 {msg.fileName}
                                                </a>
                                            )
                                        ) : (
                                            <p>{msg.content}</p>
                                        )}

                                        <p
                                            className={`text-[10px] mt-1 ${isMe ? 'text-teal-100' : 'text-slate-400'}`}
                                        >
                                            {new Date(
                                                msg.timestamp,
                                            ).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
