import { api } from './api';

const unwrapApiPayload = <T>(payload: unknown): T => {
    if (
        payload &&
        typeof payload === 'object' &&
        'data' in payload &&
        (payload as { data?: unknown }).data !== undefined
    ) {
        return (payload as { data: T }).data;
    }

    return payload as T;
};

export interface JoinRequest {
    requestId: string;
    status: 'pending' | 'approved' | 'rejected';
    message?: string;
    createdAt: string;
    requester: {
        userId: string;
        fullName?: string;
    };
}

export interface GroupMember {
    userId: string;
    fullName?: string;
    avatarUrl?: string;
    role: 'admin' | 'co-admin' | 'member';
    joinedAt: string;
}

export interface GroupDetailSummary {
    groupId: string;
    joinRequireApproval: boolean;
    memberCount: number;
    memberLimit: number;
    isMember: boolean;
    myJoinRequestStatus: 'none' | 'pending' | 'approved' | 'rejected';
    myRole?: 'leader' | 'deputy' | 'member' | 'guest' | 'admin' | 'co-admin';
    status?: 'active' | 'dissolved';
}

export interface JoinGroupResult {
    status: 'joined' | 'pending_approval';
    requestId?: string;
}

const normalizeJoinRequestStatus = (value?: string) => {
    if (!value) return 'none';
    const normalized = value.toLowerCase();
    if (['pending', 'pending_approval'].includes(normalized)) return 'pending';
    if (normalized === 'approved') return 'approved';
    if (normalized === 'rejected') return 'rejected';
    return 'none';
};

const normalizeGroupDetail = (
    groupId: string,
    payload: unknown,
): GroupDetailSummary => {
    const data = unwrapApiPayload<Record<string, unknown>>(payload) || {};

    return {
        groupId,
        joinRequireApproval: Boolean(data.joinRequireApproval),
        memberCount: Number(data.memberCount || 0),
        memberLimit: Number(data.memberLimit || 10) || 10,
        isMember: Boolean(data.isMember),
        myJoinRequestStatus: normalizeJoinRequestStatus(
            String(data.myJoinRequestStatus || ''),
        ),
        myRole:
            typeof data.myRole === 'string'
                ? (data.myRole as GroupDetailSummary['myRole'])
                : undefined,
        status: data.status === 'dissolved' ? 'dissolved' : 'active',
    };
};

const normalizeJoinResult = (payload: unknown): JoinGroupResult => {
    const data = unwrapApiPayload<Record<string, unknown>>(payload) || {};
    const statusRaw = String(data.status || '').toLowerCase();

    return {
        status: statusRaw === 'joined' ? 'joined' : 'pending_approval',
        requestId:
            typeof data.requestId === 'string' ? data.requestId : undefined,
    };
};

const normalizeJoinRequests = (payload: unknown): JoinRequest[] => {
    const data = unwrapApiPayload<
        JoinRequest[] | { items?: JoinRequest[]; data?: JoinRequest[] }
    >(payload);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
};

export const groupManagementService = {
    getGroupDetail: async (groupId: string) => {
        const response = await api.get(`/groups/${groupId}`);
        return normalizeGroupDetail(groupId, response);
    },

    updateJoinApprovalSetting: async (
        groupId: string,
        joinRequireApproval: boolean,
    ) => {
        const response = await api.patch(
            `/groups/${groupId}/settings/join-approval`,
            {
                joinRequireApproval,
            },
        );
        return unwrapApiPayload(response);
    },

    joinGroup: async (groupId: string, message?: string) => {
        const response = await api.post(`/groups/${groupId}/join`, {
            message,
        });
        return normalizeJoinResult(response);
    },

    /**
     * Create join request for a group
     */
    createJoinRequest: async (groupId: string, message?: string) => {
        return groupManagementService.joinGroup(groupId, message);
    },

    /**
     * Get all pending join requests (Admin/Owner only)
     */
    getJoinRequests: async (groupId: string) => {
        const response = await api.get(`/groups/${groupId}/join-requests`);
        return normalizeJoinRequests(response);
    },

    /**
     * Approve a join request
     */
    approveJoinRequest: async (groupId: string, requestId: string) => {
        const response = await api.post(
            `/groups/${groupId}/join-requests/${requestId}/approve`,
        );
        return unwrapApiPayload(response);
    },

    /**
     * Reject a join request
     */
    rejectJoinRequest: async (groupId: string, requestId: string) => {
        const response = await api.post(
            `/groups/${groupId}/join-requests/${requestId}/reject`,
        );
        return unwrapApiPayload(response);
    },

    /**
     * Promote member to co-admin (deputy role)
     */
    promoteToCoAdmin: async (groupId: string, userId: string) => {
        const response = await api.patch(`/groups/${groupId}/members/${userId}/role`, {
            role: 'co-admin',
        });
        return unwrapApiPayload(response);
    },

    /**
     * Backward-compat alias for old naming
     */
    promoteToAdmin: async (groupId: string, userId: string) => {
        return groupManagementService.promoteToCoAdmin(groupId, userId);
    },

    /**
     * Remove member from group
     */
    removeMember: async (groupId: string, userId: string) => {
        const response = await api.delete(
            `/groups/${groupId}/members/${userId}`,
        );
        return unwrapApiPayload(response);
    },

    /**
     * Leave group
     */
    leaveGroup: async (groupId: string) => {
        const response = await api.post(`/groups/${groupId}/leave`);
        return unwrapApiPayload(response);
    },

    /**
     * Disband group (owner only)
     */
    disbandGroup: async (groupId: string) => {
        const response = await api.post(`/groups/${groupId}/dissolve`);
        return unwrapApiPayload(response);
    },
};
