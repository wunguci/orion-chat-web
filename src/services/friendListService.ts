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
    fullName?: string;
    avatarUrl?: string | null;
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

export interface GroupMemberApiItem {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  role?: string;
  joinedAt?: string;
  isMe?: boolean;
}

export interface FriendProfileApiItem {
  id: string;
  fullName: string;
  phoneNumber?: string;
  email?: string | null;
  avatarUrl?: string | null;
  coverImage?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  createdAt?: string;
  isOnline: boolean;
  friendshipSince?: string;
}

export const friendListService = {
  getFriends: (userId: string) =>
    api.get<FriendApiItem[]>(`/friends?userId=${userId}`),

  getIncomingFriendRequests: (userId: string) =>
    api.get<FriendRequestApiItem[]>(
      `/friend-requests/incoming?userId=${userId}`,
    ),

  getOutgoingFriendRequests: (userId: string) =>
    api.get<FriendRequestApiItem[]>(
      `/friend-requests/outgoing?userId=${userId}`,
    ),

  acceptFriendRequest: (requestId: string, userId: string) =>
    api.patch(`/friend-requests/${requestId}/accept`, { userId }),

  declineFriendRequest: (requestId: string, userId: string) =>
    api.patch(`/friend-requests/${requestId}/decline`, { userId }),

  getMyGroups: (userId: string) =>
    api.get<GroupApiItem[]>(`/group-invites/my-groups?userId=${userId}`),

  getIncomingGroupInvites: (userId: string) =>
    api.get<GroupInviteApiItem[]>(`/group-invites/incoming?userId=${userId}`),

  getGroupMembers: (groupId: string) =>
    api.get<{ groupId: string; items: GroupMemberApiItem[] }>(
      `/groups/${groupId}/members`,
    ),

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

  getBlockedFriends: (userId: string) =>
    api.get<Array<FriendApiItem & { blockedAt?: string }>>(
      `/friends/blocked?userId=${userId}`,
    ),

  getFriendProfile: (userId: string, friendId: string) =>
    api.get<FriendProfileApiItem>(`/friends/${userId}/${friendId}/profile`),

  removeFriend: (userId: string, friendId: string) =>
    api.delete<{ success: boolean; message: string }>(
      `/friends/${userId}/${friendId}`,
    ),

  blockFriend: (userId: string, friendId: string) =>
    api.patch<{ success: boolean; message: string }>(
      `/friends/${userId}/${friendId}/block`,
      {},
    ),

  unblockFriend: (userId: string, friendId: string) =>
    api.patch<{ success: boolean; message: string }>(
      `/friends/${userId}/${friendId}/unblock`,
      {},
    ),
};
