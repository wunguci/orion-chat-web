/**
 * EXAMPLE: ChatPage Integration with MessageItemNew
 *
 * Copy-paste this pattern into your existing ChatPage component.
 * Replace YourConversationService with your actual service.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    MessageItemNew,
    type Message,
    getAvatarUrl,
} from '../components/chat/MessageItemNew';
import {
    extractUserIdFromToken,
    extractPhoneFromToken,
} from '../utils/tokenParser';
import ChatInput from '../components/chat/ChatInput';
import ChatHeader from '../components/chat/ChatHeader';

interface ChatPageIntegrationProps {
    conversationId: string;
}

/**
 * Example ChatPage with MessageItemNew
 * Handles message display in Zalo/Messenger style
 */
export const ChatPageIntegration: React.FC<ChatPageIntegrationProps> = ({
    conversationId,
}) => {
    // ✅ Step 1: Get current user ID from token
    const currentUserId = useMemo(
        () => extractUserIdFromToken() || extractPhoneFromToken() || '',
        [],
    );

    // ✅ Step 2: State for messages
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ Step 3: Cache for sender avatars (optional optimization)
    const senderAvatarMap = useMemo<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        messages.forEach((msg) => {
            if (!map[msg.senderBy]) {
                map[msg.senderBy] = getAvatarUrl(msg.senderBy);
            }
        });
        return map;
    }, [messages]);

    // ✅ Step 4: Load messages on mount or when conversationId changes
    useEffect(() => {
        const loadMessages = async () => {
            setLoading(true);
            setError(null);
            try {
                // TODO: Replace with your actual API call
                // Example: const data = await conversationService.getMessages(conversationId);
                // For now, using sample data:
                const sampleMessages: Message[] = [
                    {
                        _id: '1',
                        content: 'Xin chào!',
                        senderBy: currentUserId,
                        senderName: 'You',
                        conversationId,
                        messageType: 'TEXT',
                        messageStatus: 'READ',
                        createdAt: new Date(Date.now() - 300000).toISOString(),
                        reactions: [],
                    },
                    {
                        _id: '2',
                        content: 'Hi, how are you?',
                        senderBy: '0961234567', // Another user
                        senderName: 'John Doe',
                        conversationId,
                        messageType: 'TEXT',
                        messageStatus: 'DELIVERED',
                        createdAt: new Date(Date.now() - 200000).toISOString(),
                        reactions: [
                            {
                                userId: currentUserId,
                                emoji: '😂',
                                reactedAt: new Date().toISOString(),
                            },
                        ],
                    },
                    {
                        _id: '3',
                        content: "I'm doing great!",
                        senderBy: currentUserId,
                        senderName: 'You',
                        conversationId,
                        messageType: 'TEXT',
                        messageStatus: 'SENT',
                        createdAt: new Date(Date.now() - 100000).toISOString(),
                        reactions: [],
                    },
                ];
                setMessages(sampleMessages);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load messages',
                );
                console.error('Failed to load messages:', err);
            } finally {
                setLoading(false);
            }
        };

        if (conversationId) {
            loadMessages();
        }
    }, [conversationId, currentUserId]);

    // ✅ Step 5: Handle message reactions
    const handleReactToMessage = useCallback(
        async (messageId: string, emoji: string) => {
            setMessages((prev) =>
                prev.map((msg) => {
                    if (msg._id === messageId) {
                        const reactions = [...(msg.reactions || [])];
                        const existingIndex = reactions.findIndex(
                            (r) =>
                                r.userId === currentUserId && r.emoji === emoji,
                        );

                        if (existingIndex > -1) {
                            // Remove reaction if already reacted
                            reactions.splice(existingIndex, 1);
                        } else {
                            // Add new reaction
                            reactions.push({
                                userId: currentUserId,
                                emoji,
                                reactedAt: new Date().toISOString(),
                            });
                        }

                        return { ...msg, reactions };
                    }
                    return msg;
                }),
            );

            try {
                // TODO: Send to backend
                // await conversationService.reactToMessage(conversationId, messageId, emoji);
            } catch (err) {
                console.error('Failed to react to message:', err);
                // Optionally revert the UI change
            }
        },
        [conversationId, currentUserId],
    );

    // ✅ Step 6: Handle message deletion
    const handleDeleteMessage = useCallback(
        async (messageId: string) => {
            setMessages((prev) =>
                prev.map((msg) => {
                    if (msg._id === messageId) {
                        const deletedForUsers = [
                            ...(msg.deletedForUsers || []),
                        ];
                        if (!deletedForUsers.includes(currentUserId)) {
                            deletedForUsers.push(currentUserId);
                        }
                        return { ...msg, deletedForUsers };
                    }
                    return msg;
                }),
            );

            try {
                // TODO: Send to backend
                // await conversationService.deleteMessageForMe(conversationId, messageId);
            } catch (err) {
                console.error('Failed to delete message:', err);
            }
        },
        [conversationId, currentUserId],
    );

    // ✅ Step 7: Handle message recall (for sender only)
    const handleRecallMessage = useCallback(
        async (messageId: string) => {
            setMessages((prev) =>
                prev.map((msg) => {
                    if (msg._id === messageId) {
                        return { ...msg, isDeleted: true, content: '' };
                    }
                    return msg;
                }),
            );

            try {
                // TODO: Send to backend
                // await conversationService.recallMessage(conversationId, messageId);
            } catch (err) {
                console.error('Failed to recall message:', err);
            }
        },
        [conversationId],
    );

    // ✅ Step 8: Handle message reply
    const handleReplyToMessage = useCallback(
        (messageId: string) => {
            const message = messages.find((m) => m._id === messageId);
            if (message) {
                console.log('Reply to:', message);
                // TODO: Set reply context in ChatInput component
            }
        },
        [messages],
    );

    // ✅ Step 9: Handle new message sent
    const handleSendMessage = useCallback(
        async (content: string) => {
            const newMessage: Message = {
                _id: String(Date.now()), // Temporary ID
                clientMessageId: String(Date.now()),
                content,
                senderBy: currentUserId,
                senderName: 'You',
                conversationId,
                messageType: 'TEXT',
                messageStatus: 'SENT',
                createdAt: new Date().toISOString(),
                reactions: [],
            };

            // Optimistic update
            setMessages((prev) => [...prev, newMessage]);

            try {
                // TODO: Send to backend
                // const response = await conversationService.sendMessage(conversationId, content);
                // Update message with server ID and status
                // setMessages(prev => prev.map(m =>
                //   m.clientMessageId === newMessage.clientMessageId
                //     ? { ...m, _id: response._id, messageStatus: 'DELIVERED' }
                //     : m
                // ));
            } catch (err) {
                console.error('Failed to send message:', err);
                // Remove the message if failed
                setMessages((prev) =>
                    prev.filter(
                        (m) => m.clientMessageId !== newMessage.clientMessageId,
                    ),
                );
            }
        },
        [conversationId, currentUserId],
    );

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <ChatHeader conversationId={conversationId} />

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50 space-y-1 py-4">
                {loading && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">Đang tải tin nhắn...</p>
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-red-500">Lỗi: {error}</p>
                    </div>
                )}

                {!loading && !error && messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">Không có tin nhắn nào</p>
                    </div>
                )}

                {!loading && !error && messages.length > 0 && (
                    <>
                        {messages.map((message) => (
                            <MessageItemNew
                                key={message._id}
                                message={message}
                                currentUserId={currentUserId}
                                senderAvatar={senderAvatarMap[message.senderBy]}
                                senderName={
                                    message.senderName ||
                                    (message.senderBy === currentUserId
                                        ? 'You'
                                        : 'Unknown')
                                }
                                onImageClick={() => {
                                    console.log(
                                        'Image clicked:',
                                        message.mediaUrl,
                                    );
                                    // TODO: Open image viewer
                                }}
                                onReact={(emoji) => {
                                    handleReactToMessage(message._id, emoji);
                                }}
                                onDelete={() => {
                                    handleDeleteMessage(message._id);
                                }}
                                onRecall={() => {
                                    handleRecallMessage(message._id);
                                }}
                                onReply={() => {
                                    handleReplyToMessage(message._id);
                                }}
                            />
                        ))}
                    </>
                )}
            </div>

            {/* Input Area */}
            <ChatInput
                onSendMessage={handleSendMessage}
                disabled={loading}
                conversationId={conversationId}
            />
        </div>
    );
};

export default ChatPageIntegration;

/**
 * QUICK COPY-PASTE CHECKLIST:
 *
 * 1. Replace this component into your routes/pages
 * 2. Update the TODO comments with your actual service calls
 * 3. Ensure your backend API returns Message[] with:
 *    - senderBy (userId or phoneNumber)
 *    - messageStatus (SENT, DELIVERED, READ)
 *    - reactions array
 * 4. Test with a conversation that has multiple users
 * 5. Verify:
 *    ✅ Your messages are right-aligned + green
 *    ✅ Others messages are left-aligned + gray
 *    ✅ Reactions work
 *
 * DEFAULT COLORS (Tailwind):
 * - Own message: bg-green-500 (can customize to #your-primary-color)
 * - Other message: bg-gray-100
 */
