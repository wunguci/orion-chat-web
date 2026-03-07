import React, { useState } from 'react';
import MessageItem from './MessageItem';
import type { Reaction } from './MessageItem';
import ImageViewer from './ImageViewer';
import type { ViewerImage } from './ImageViewer';

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

export const MessageList: React.FC = () => {
    const [viewerIndex, setViewerIndex] = useState<number | null>(null);
    const [reactionMap, setReactionMap] = useState<ReactionMap>({});

    const handleReact = (msgIndex: number, emoji: string) => {
        setReactionMap((prev) => {
            const msgReactions = prev[msgIndex] ?? {};
            const existing = msgReactions[emoji];
            if (existing?.reactedByMe) {
                // toggle off
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

    // Collect all image messages for the viewer
    const allImages: ViewerImage[] = messages
        .filter((m): m is Message & { image: string } => !!m.image)
        .map((m) => ({
            src: m.image,
            time: m.time,
            date: m.date,
            senderName: m.side === 'right' ? 'You' : 'Olivia Isabella',
            senderAvatar: m.side === 'right' ? AVATAR_RIGHT : AVATAR_LEFT,
        }));

    // Build a lookup: message index → allImages index
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
