import React from 'react';
import type { SocketMessage } from './MessageList';
import ReplyPreview from './ReplyPreview';
import ReactionBar from './ReactionBar';
import MediaMessageRenderer from './MediaMessageRenderer';

type GroupMessageItemProps = {
    message: SocketMessage;
    replyMessage?: SocketMessage | null;
    isMe?: boolean;
    onReact?: (emoji: string) => void;
};

export const GroupMessageItem: React.FC<GroupMessageItemProps> = ({
    message,
    replyMessage,
    isMe = false,
    onReact,
}) => {
    const groupedReactions = new Map<string, number>();
    (message.reactions || []).forEach((reaction) => {
        groupedReactions.set(
            reaction.emoji,
            (groupedReactions.get(reaction.emoji) || 0) + 1,
        );
    });

    return (
        <div
            className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
        >
            {replyMessage && (
                <ReplyPreview
                    senderName={replyMessage.senderName}
                    content={replyMessage.content || replyMessage.fileName}
                />
            )}

            {message.forwardedFromMessageId && (
                <p className="text-[11px] italic text-slate-500">
                    Tin nhắn được chuyển tiếp
                </p>
            )}

            {message.isFile ? (
                <MediaMessageRenderer
                    messageType={String(message.type || '').toUpperCase()}
                    fileUrl={message.fileUrl}
                    fileName={message.fileName}
                    isMe={isMe}
                />
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800">
                    {message.isRecalled
                        ? 'Tin nhắn đã được thu hồi'
                        : message.content}
                </div>
            )}

            <ReactionBar
                reactions={Array.from(groupedReactions.entries()).map(
                    ([emoji, count]) => ({
                        emoji,
                        count,
                    }),
                )}
                align={isMe ? 'right' : 'left'}
                onReact={onReact}
            />
        </div>
    );
};

export default GroupMessageItem;
