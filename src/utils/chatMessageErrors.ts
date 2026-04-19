import { isAxiosError } from 'axios';

type ChatAction = 'reply' | 'pin' | 'unpin' | 'send';

const ACTION_LABELS: Record<ChatAction, string> = {
    reply: 'trả lời tin nhắn',
    pin: 'ghim tin nhắn',
    unpin: 'gỡ ghim tin nhắn',
    send: 'gửi tin nhắn',
};

export const mapChatActionError = (
    error: unknown,
    action: ChatAction,
): string => {
    const fallback = `Không thể ${ACTION_LABELS[action]}`;

    if (!isAxiosError(error)) {
        if (error instanceof Error && error.message) return error.message;
        return fallback;
    }

    const status = error.response?.status;
    const serverMessage = String(
        error.response?.data?.message || '',
    ).toLowerCase();

    if (status === 400) {
        if (serverMessage.includes('max') || serverMessage.includes('3')) {
            return 'Mỗi cuộc trò chuyện chỉ pin tối đa 3 tin nhắn';
        }
        if (
            serverMessage.includes('already') &&
            serverMessage.includes('pin')
        ) {
            return 'Tin nhắn này đã được ghim';
        }
        if (serverMessage.includes('not') && serverMessage.includes('pin')) {
            return 'Tin nhắn này chưa được ghim';
        }
        return `Yêu cầu không hợp lệ khi ${ACTION_LABELS[action]}`;
    }

    if (status === 403) {
        return 'Bạn không phải thành viên của cuộc trò chuyện này';
    }

    if (status === 404) {
        if (action === 'reply') {
            return 'Không tìm thấy tin nhắn gốc trong cuộc trò chuyện';
        }
        return 'Không tìm thấy cuộc trò chuyện hoặc tin nhắn';
    }

    return (
        (typeof error.response?.data?.message === 'string' &&
            error.response.data.message) ||
        fallback
    );
};
