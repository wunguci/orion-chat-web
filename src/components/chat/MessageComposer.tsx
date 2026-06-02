import React from 'react';
import ChatInput from './ChatInput';

type MessageComposerProps = React.ComponentProps<typeof ChatInput>;

export const MessageComposer: React.FC<MessageComposerProps> = (props) => {
    return <ChatInput {...props} />;
};

export default MessageComposer;
