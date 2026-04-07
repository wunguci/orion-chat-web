/**
 * USAGE EXAMPLE: How to use MessageItemNew component
 * This shows how to integrate it into your chat page
 */

import React, { useState, useMemo } from 'react';
import { MessageItemNew, type Message, getAvatarUrl } from './MessageItemNew';
import {
    extractUserIdFromToken,
    extractPhoneFromToken,
} from '../utils/tokenParser';

/**
 * Example chat container component
 */
export const ChatContainerExample: React.FC = () => {
    // Get current user ID from JWT token
    const currentUserId = useMemo(
        () => extractUserIdFromToken() || extractPhoneFromToken() || '',
        [],
    );

    // Sample messages (from MongoDB)
    const [messages, setMessages] = useState<Message[]>([    ]);

    const [senderAvatarMap] = useState<Record<string, string>>({
        '0961416115': '', // Will use DiceBear generated avatar
        [currentUserId]: '', // Will use DiceBear generated avatar
    });

    // Handler for message reactions
    const handleReactToMessage = (messageId: string, emoji: string) => {
        setMessages((prev) =>
            prev.map((msg) => {
                if (msg._id === messageId) {
                    const existingReactionIndex =
                        msg.reactions?.findIndex(
                            (r) =>
                                r.userId === currentUserId && r.emoji === emoji,
                        ) ?? -1;

                    const updatedReactions = [...(msg.reactions || [])];

                    if (existingReactionIndex > -1) {
                        // Remove reaction if already reacted with same emoji
                        updatedReactions.splice(existingReactionIndex, 1);
                    } else {
                        // Add new reaction
                        updatedReactions.push({
                            userId: currentUserId,
                            emoji,
                            reactedAt: new Date().toISOString(),
                        });
                    }

                    return { ...msg, reactions: updatedReactions };
                }
                return msg;
            }),
        );

        // TODO: Send reaction to backend API
        // await conversationApi.reactToMessage(conversationId, messageId, emoji);
    };

    const handleDeleteMessage = (messageId: string) => {
        setMessages((prev) =>
            prev.map((msg) => {
                if (msg._id === messageId) {
                    const deletedForUsers = [...(msg.deletedForUsers || [])];
                    if (!deletedForUsers.includes(currentUserId)) {
                        deletedForUsers.push(currentUserId);
                    }
                    return { ...msg, deletedForUsers };
                }
                return msg;
            }),
        );

        // TODO: Send delete to backend API
        // await conversationApi.deleteMessageForMe(conversationId, messageId);
    };

    const handleRecallMessage = (messageId: string) => {
        setMessages((prev) =>
            prev.map((msg) => {
                if (msg._id === messageId) {
                    return { ...msg, isDeleted: true, content: '' };
                }
                return msg;
            }),
        );

        // TODO: Send recall to backend API
        // await conversationApi.recallMessage(conversationId, messageId);
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <h1 className="text-lg font-semibold text-gray-900">
                    Chat Room
                </h1>
                <p className="text-sm text-gray-600">
                    Your ID:{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                        {currentUserId}
                    </code>
                </p>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50 space-y-2 py-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">Không có tin nhắn nào</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <MessageItemNew
                            key={message._id}
                            message={message}
                            currentUserId={currentUserId}
                            senderAvatar={
                                senderAvatarMap[message.senderBy] ||
                                getAvatarUrl(message.senderBy)
                            }
                            senderName={message.senderName || message.senderBy}
                            onImageClick={() => {
                                console.log('Image clicked:', message.mediaUrl);
                                // Open image viewer
                            }}
                            onReact={(emoji) => {
                                console.log('React with:', emoji);
                                handleReactToMessage(message._id, emoji);
                            }}
                            onDelete={() => {
                                console.log('Delete message:', message._id);
                                handleDeleteMessage(message._id);
                            }}
                            onRecall={() => {
                                console.log('Recall message:', message._id);
                                handleRecallMessage(message._id);
                            }}
                            onReply={() => {
                                console.log('Reply to message:', message._id);
                                // Open reply composer
                            }}
                        />
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 px-4 py-3">
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
            </div>
        </div>
    );
};

export default ChatContainerExample;

/**
 * INTEGRATION NOTES:
 *
 * 1. In your existing ChatPage component, replace the old MessageItem with MessageItemNew:
 *
 *    import { MessageItemNew, type Message, getAvatarUrl } from './MessageItemNew';
 *    import { extractUserIdFromToken } from '../utils/tokenParser';
 *
 * 2. Get current user ID:
 *
 *    const currentUserId = useMemo(
 *      () => extractUserIdFromToken() || extractPhoneFromToken() || '',
 *      []
 *    );
 *
 * 3. Map your socket messages to Message interface:
 *
 *    const messages: Message[] = socketMessages.map((msg) => ({
 *      _id: msg.id || msg._id,
 *      content: msg.content,
 *      senderBy: msg.senderId || msg.senderBy,
 *      senderName: msg.senderName,
 *      conversationId: msg.conversationId,
 *      clientMessageId: msg.clientMessageId,
 *      messageType: (msg.type || 'TEXT').toUpperCase() as Message['messageType'],
 *      messageStatus: msg.messageStatus || 'SENT',
 *      createdAt: msg.timestamp || msg.createdAt,
 *      reactions: msg.reactions || [],
 *      mediaUrl: msg.fileUrl,
 *      ...(other fields)
 *    }));
 *
 * 4. Wire up handlers to your API calls:
 *
 *    const handleReact = async (messageId: string, emoji: string) => {
 *      try {
 *        await conversationApi.reactToMessage(
 *          selectedConversationId,
 *          messageId,
 *          emoji
 *        );
 *      } catch (error) {
 *        console.error('Failed to react:', error);
 *      }
 *    };
 */
