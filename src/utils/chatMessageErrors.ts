import { isAxiosError } from 'axios';

type ChatAction = 'reply' | 'pin' | 'unpin' | 'send' | 'recall';

const ACTION_LABELS: Record<ChatAction, string> = {
    reply: 'reply to message',
    pin: 'pin message',
    unpin: 'unpin message',
    send: 'send message',
    recall: 'recall message',
};

export const mapChatActionError = (
    error: unknown,
    action: ChatAction,
): string => {
    const fallback = `Failed to ${ACTION_LABELS[action]}`;

    if (!isAxiosError(error)) {
        if (error instanceof Error && error.message) return error.message;
        return fallback;
    }

    const status = error.response?.status;
    const serverMessage = String(
        error.response?.data?.message || '',
    ).toLowerCase();

    if (status === 400) {
        if (
            action === 'recall' &&
            (serverMessage.includes('expired') ||
                serverMessage.includes('24h') ||
                serverMessage.includes('24 hours'))
        ) {
            return 'Message older than 24h cannot be recalled';
        }
        if (serverMessage.includes('max') || serverMessage.includes('3')) {
            return 'Each conversation can only have up to 3 pinned messages';
        }
        if (
            serverMessage.includes('already') &&
            serverMessage.includes('pin')
        ) {
            return 'This message has already been pinned';
        }
        if (serverMessage.includes('not') && serverMessage.includes('pin')) {
            return 'This message has not been pinned';
        }
        return `Invalid request while trying to ${ACTION_LABELS[action]}`;
    }

    if (status === 403) {
        return 'You are not a member of this conversation';
    }

    if (status === 404) {
        if (action === 'reply') {
            return 'Original message not found in the conversation';
        }
        return 'Conversation or message not found';
    }

    return (
        (typeof error.response?.data?.message === 'string' &&
            error.response.data.message) ||
        fallback
    );
};
