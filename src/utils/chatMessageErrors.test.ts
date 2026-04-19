import { describe, expect, it } from 'vitest';
import { mapChatActionError } from './chatMessageErrors';

const axiosErrorLike = (status: number, message: string) => ({
    isAxiosError: true,
    response: {
        status,
        data: { message },
    },
});

describe('mapChatActionError', () => {
    it('maps pin limit 400 to friendly message', () => {
        const result = mapChatActionError(
            axiosErrorLike(400, 'max 3 pinned messages') as unknown,
            'pin',
        );

        expect(result).toBe('Mỗi cuộc trò chuyện chỉ pin tối đa 3 tin nhắn');
    });

    it('maps 403 to membership message', () => {
        const result = mapChatActionError(
            axiosErrorLike(403, 'forbidden') as unknown,
            'pin',
        );

        expect(result).toBe(
            'Bạn không phải thành viên của cuộc trò chuyện này',
        );
    });

    it('maps reply 404 to missing target message', () => {
        const result = mapChatActionError(
            axiosErrorLike(404, 'message not found') as unknown,
            'reply',
        );

        expect(result).toBe(
            'Không tìm thấy tin nhắn gốc trong cuộc trò chuyện',
        );
    });
});
