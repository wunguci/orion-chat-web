import { isAxiosError } from 'axios';

type GroupAction =
    | 'join'
    | 'approve'
    | 'reject'
    | 'toggle_join_approval'
    | 'add_member';

const ACTION_LABELS: Record<GroupAction, string> = {
    join: 'tham gia nhóm',
    approve: 'duyệt yêu cầu',
    reject: 'từ chối yêu cầu',
    toggle_join_approval: 'cập nhật chế độ duyệt',
    add_member: 'thêm thành viên',
};

export const mapGroupManagementError = (
    error: unknown,
    action: GroupAction,
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

    if (serverMessage.includes('already') && serverMessage.includes('member')) {
        return 'Bạn đã là thành viên của nhóm';
    }

    if (
        serverMessage.includes('pending') &&
        serverMessage.includes('request')
    ) {
        return 'Bạn đang chờ duyệt yêu cầu tham gia';
    }

    if (serverMessage.includes('dissolved')) {
        return 'Nhóm đã giải tán';
    }

    if (
        serverMessage.includes('limit') ||
        serverMessage.includes('full') ||
        serverMessage.includes('max') ||
        serverMessage.includes('10')
    ) {
        return 'Nhóm đã đủ 10 thành viên';
    }

    if (status === 403 || serverMessage.includes('forbidden')) {
        return 'Bạn không có quyền thực hiện thao tác này';
    }

    if (status === 404) {
        return 'Không tìm thấy nhóm hoặc yêu cầu tham gia';
    }

    if (status === 409) {
        return 'Dữ liệu đã thay đổi, vui lòng thử lại';
    }

    return (
        (typeof error.response?.data?.message === 'string' &&
            error.response.data.message) ||
        fallback
    );
};
