import { isAxiosError } from 'axios';

type GroupAction =
    | 'join'
    | 'approve'
    | 'reject'
    | 'toggle_join_approval'
    | 'add_member';

const ACTION_LABELS: Record<GroupAction, string> = {
    join: 'join group',
    approve: 'approve request',
    reject: 'reject request',
    toggle_join_approval: 'update approval mode',
    add_member: 'add member',
};

export const mapGroupManagementError = (
    error: unknown,
    action: GroupAction,
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

    if (serverMessage.includes('already') && serverMessage.includes('member')) {
        return 'You are already a member of this group';
    }

    if (
        serverMessage.includes('pending') &&
        serverMessage.includes('request')
    ) {
        return 'Your request to join is pending approval';
    }

    if (serverMessage.includes('dissolved')) {
        return 'This group has been disbanded';
    }

    if (
        serverMessage.includes('limit') ||
        serverMessage.includes('full') ||
        serverMessage.includes('max') ||
        serverMessage.includes('10')
    ) {
        return 'The group has reached the limit of 10 members';
    }

    if (status === 403 || serverMessage.includes('forbidden')) {
        return 'You do not have permission to perform this action';
    }

    if (status === 404) {
        return 'Group or join request not found';
    }

    if (status === 409) {
        return 'Data has changed, please try again';
    }

    return (
        (typeof error.response?.data?.message === 'string' &&
            error.response.data.message) ||
        fallback
    );
};
