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

        expect(result).toBe('You are already a member of this group');
    });

    it('maps member limit/full errors to 10-members message', () => {
        const result = mapGroupManagementError(
            axiosErrorLike(400, 'group member limit reached') as unknown,
            'join',
        );

        expect(result).toBe('The group has reached the limit of 10 members');
    });

    it('maps 403 to permission message', () => {
        const result = mapGroupManagementError(
            axiosErrorLike(403, 'forbidden') as unknown,
            'toggle_join_approval',
        );

        expect(result).toBe('You do not have permission to perform this action');
    });
});
