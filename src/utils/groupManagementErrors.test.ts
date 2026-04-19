import { describe, expect, it } from 'vitest';
import { mapGroupManagementError } from './groupManagementErrors';

const axiosErrorLike = (status: number, message: string) => ({
    isAxiosError: true,
    response: {
        status,
        data: { message },
    },
});

describe('mapGroupManagementError', () => {
    it('maps already member conflict to friendly message', () => {
        const result = mapGroupManagementError(
            axiosErrorLike(409, 'already a member') as unknown,
            'join',
        );

        expect(result).toBe('Bạn đã là thành viên của nhóm');
    });

    it('maps member limit/full errors to 10-members message', () => {
        const result = mapGroupManagementError(
            axiosErrorLike(400, 'group member limit reached') as unknown,
            'join',
        );

        expect(result).toBe('Nhóm đã đủ 10 thành viên');
    });

    it('maps 403 to permission message', () => {
        const result = mapGroupManagementError(
            axiosErrorLike(403, 'forbidden') as unknown,
            'toggle_join_approval',
        );

        expect(result).toBe('Bạn không có quyền thực hiện thao tác này');
    });
});
