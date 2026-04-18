import React from 'react';
import MessageList, { type SocketMessage } from './MessageList';

type GroupMessageListProps = {
    messages: SocketMessage[];
    currentUserId?: string;
    conversationId?: string | null;
    myIsHidden?: boolean;
    onCallBackMessage?: (message: SocketMessage) => void;
    onRecallMessage?: (message: SocketMessage) => void;
    onDeleteMessage?: (message: SocketMessage) => void;
    onForwardMessage?: (message: SocketMessage) => void;
    onReactMessage?: (message: SocketMessage, emoji: string) => void;
};

export const GroupMessageList: React.FC<GroupMessageListProps> = ({
    messages,
    currentUserId,
    conversationId,
    myIsHidden,
    onCallBackMessage,
    onRecallMessage,
    onDeleteMessage,
    onForwardMessage,
    onReactMessage,
}) => {
    return (
        <MessageList
            socketMessages={messages}
            currentUserId={currentUserId}
            conversationId={conversationId}
            myIsHidden={myIsHidden}
            onCallBackMessage={onCallBackMessage}
            onRecallMessage={onRecallMessage}
            onDeleteMessage={onDeleteMessage}
            onForwardMessage={onForwardMessage}
            onReactMessage={onReactMessage}
        />
    );
};

export default GroupMessageList;
