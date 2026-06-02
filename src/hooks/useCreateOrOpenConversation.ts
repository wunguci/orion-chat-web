import { useCallback, useState } from 'react';
import { getCurrentUserId } from '../utils/auth';
import { conversationApi } from '../services/conversationApi';

interface UseCreateOrOpenConversationResult {
    createOrOpenConversation: (recipientId: string) => Promise<string | null>;
    loading: boolean;
    error: string | null;
}

const getApiErrorMessage = (
    err: unknown,
    fallback = 'Failed to create or open conversation',
) => {
    const responseData = (
        err as {
            response?: {
                data?: {
                    code?: unknown;
                    message?: unknown;
                    error?: unknown;
                } | string;
            };
        }
    )?.response?.data;

    if (typeof responseData === 'string') {
        return responseData;
    }

    if (Array.isArray(responseData?.message)) {
        return responseData.message.join(', ');
    }

    if (typeof responseData?.message === 'string') {
        return responseData.message;
    }

    if (typeof responseData?.code === 'string') {
        return responseData.code;
    }

    if (typeof responseData?.error === 'string') {
        return responseData.error;
    }

    return err instanceof Error ? err.message : fallback;
};

const isMessagePrivacyError = (message: string) => {
    const normalized = message.toLowerCase();
    return (
        normalized.includes('message_not_allowed') ||
        normalized.includes('not accepting messages')
    );
};

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
                    const errorMessage = getApiErrorMessage(err);
                    setError(errorMessage);

                    if (!isMessagePrivacyError(errorMessage)) {
                        console.error(
                            'Error in useCreateOrOpenConversation:',
                            err,
                        );
                    }

                    throw new Error(errorMessage);
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
