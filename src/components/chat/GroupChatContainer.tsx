import React from 'react';
import ChatHeader from './ChatHeader';
import GroupMessageList from './GroupMessageList';
import MessageComposer from './MessageComposer';
import type { SocketMessage } from './MessageList';

type GroupChatContainerProps = {
    name: string;
    avatarUrl?: string;
    subtitle?: string;
    messages: SocketMessage[];
    currentUserId?: string;
    conversationId?: string | null;
    isBlocked?: boolean;
    disableCallButtons?: boolean;
    onAudioCall?: () => void;
    onVideoCall?: () => void;
    onGroupCall?: () => void;
    onSearchClick?: () => void;
    onPanelToggle?: () => void;
    onSend?: (text: string) => void;
    onSendFile?: (file: File) => Promise<void>;
    onTypingChange?: (isTyping: boolean) => void;
};

export const GroupChatContainer: React.FC<GroupChatContainerProps> = ({
    name,
    avatarUrl,
    subtitle,
    messages,
    currentUserId,
    conversationId,
    isBlocked,
    disableCallButtons,
    onAudioCall,
    onVideoCall,
    onGroupCall,
    onSearchClick,
    onPanelToggle,
    onSend,
    onSendFile,
    onTypingChange,
}) => {
    return (
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-2xs">
            <ChatHeader
                name={name}
                avatarUrl={avatarUrl}
                subtitle={subtitle}
                isBlocked={isBlocked}
                isGroupChat={true}
                disableCallButtons={disableCallButtons}
                onAudioCall={onAudioCall}
                onVideoCall={onVideoCall}
                onGroupCall={onGroupCall}
                onSearchClick={onSearchClick}
                onPanelToggle={onPanelToggle}
            />

            <GroupMessageList
                messages={messages}
                currentUserId={currentUserId}
                conversationId={conversationId}
            />

            <MessageComposer
                onSend={onSend}
                onSendFile={onSendFile}
                onTypingChange={onTypingChange}
            />
        </div>
    );
};

export default GroupChatContainer;
