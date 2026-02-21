import React from 'react';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatHeader from '../../components/chat/ChatHeader';
import MessageList from '../../components/chat/MessageList';
import ChatInput from '../../components/chat/ChatInput';
import ConversationInfoPanel from '../../components/chat/ConversationInfoPanel';

export const ChatPage: React.FC = () => {
    return (
        <div className="min-h-screen flex bg-var(--color-background) text-var(--color-text-primary)">
            <ChatSidebar />

            <div className="flex-1 flex flex-col">
                <ChatHeader />
                <MessageList />
                <ChatInput />
            </div>

            <ConversationInfoPanel />
        </div>
    );
};

export default ChatPage;
