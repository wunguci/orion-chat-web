import { api } from "./api";

export interface FriendApiItem {
  id: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  createdAt?: string;
}

export interface FriendRequestApiItem {
  requestId: string;
  sender: {
    userId: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  receiver: {
    userId: string;
  };
  status: "pending" | "accepted" | "declined" | "canceled";
  createdAt: string;
}

export interface GroupApiItem {
  id: string;
  name: string;
  avatar?: string;
  memberCount: number;
  isPublic: boolean;
  type: "BUSINESS" | "EDUCATION" | "COMMUNITY" | "PERSONAL";
  description?: string;
}

export interface GroupInviteApiItem {
  inviteId: string;
  group: {
    conversationId: string;
    groupName: string;
    groupAvatar?: string | null;
  };
  inviter: {
    fullName: string;
  };
  status: "pending" | "accepted" | "declined" | "revoked";
  createdAt: string;
}

export const friendListService = {
  getFriends: (userId: string) =>
    api.get<FriendApiItem[]>(`/friends?userId=${userId}`),

  getIncomingFriendRequests: (userId: string) =>
    api.get<FriendRequestApiItem[]>(
      `/friend-requests/incoming?userId=${userId}`,
    ),

  acceptFriendRequest: (requestId: string, userId: string) =>
    api.patch(`/friend-requests/${requestId}/accept`, { userId }),

  declineFriendRequest: (requestId: string, userId: string) =>
    api.patch(`/friend-requests/${requestId}/decline`, { userId }),

  getMyGroups: (userId: string) =>
    api.get<GroupApiItem[]>(`/group-invites/my-groups?userId=${userId}`),

  getIncomingGroupInvites: (userId: string) =>
    api.get<GroupInviteApiItem[]>(`/group-invites/incoming?userId=${userId}`),

  acceptGroupInvite: (inviteId: string, userId: string) =>
    api.patch(`/group-invites/${inviteId}/accept`, { userId }),

  declineGroupInvite: (inviteId: string, userId: string) =>
    api.patch(`/group-invites/${inviteId}/decline`, { userId }),

  searchUsers: (userId: string, q: string) =>
    api.get<FriendApiItem[]>(
      `/friends/search-users?userId=${userId}&q=${encodeURIComponent(q)}`,
    ),

  sendFriendRequest: (senderId: string, receiverId: string) =>
    api.post(`/friend-requests`, { senderId, receiverId }),

  getSuggestionsByMutualGroups: (userId: string) =>
    api.get<
      Array<{
        id: string;
        fullName: string;
        avatarUrl?: string | null;
        isOnline: boolean;
        mutualGroupCount: number;
        mutualGroupNames: string[];
      }>
    >(`/friends/suggestions?userId=${userId}`),

  getRecentlyActive: (userId: string) =>
    api.get<FriendApiItem[]>(`/friends/recently-active?userId=${userId}`),
};
