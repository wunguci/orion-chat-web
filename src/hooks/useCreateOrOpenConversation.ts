import { useCallback, useState } from 'react';
import { getCurrentUserId } from '../utils/auth';
import { conversationApi } from '../services/conversationApi';

interface UseCreateOrOpenConversationResult {
    createOrOpenConversation: (recipientId: string) => Promise<string | null>;
    loading: boolean;
    error: string | null;
}

/**
 * Hook to get or create a PRIVATE conversation with a friend
 * Calls backend API to create/fetch conversation
 * Returns conversation ID if successful
 */
export const useCreateOrOpenConversation =
    (): UseCreateOrOpenConversationResult => {
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const currentUserId = getCurrentUserId();

        const createOrOpenConversation = useCallback(
            async (recipientId: string) => {
                try {
                    setLoading(true);
                    setError(null);

                    if (!currentUserId) {
                        throw new Error('Current user not found');
                    }

                    if (!recipientId) {
                        throw new Error('Recipient ID is required');
                    }

                    // Call backend API to create or get private conversation
                    const conversation =
                        await conversationApi.getOrCreatePrivateConversation(
                            recipientId,
                        );

                    if (!conversation?.conversationId) {
                        throw new Error(
                            'Failed to create or open conversation',
                        );
                    }

                    return conversation.conversationId;
                } catch (err) {
                    const errorMessage =
                        err instanceof Error
                            ? err.message
                            : 'Failed to create or open conversation';
                    setError(errorMessage);
                    console.error('Error in useCreateOrOpenConversation:', err);
                    return null;
                } finally {
                    setLoading(false);
                }
            },
            [currentUserId],
        );

        return {
            createOrOpenConversation,
            loading,
            error,
        };
    };
