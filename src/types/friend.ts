export type UserPresence = "online" | "offline" | "away";

export interface Friend {
  id: string;
  name: string;
  status: UserPresence;
  subtext: string;
  avatar: string;
  isOnline?: boolean;
  mutualGroupCount?: number;
  mutualGroupNames?: string[];
  lastActiveAt?: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  name: string;
  timeAgo: string;
  avatar: string;
  message?: string;
  status: "pending" | "accepted" | "declined" | "canceled";
  createdAt?: string;
}

export interface SuggestedFriend {
  id: string;
  name: string;
  mutualFriends: number;
  avatar: string;
  mutualGroupCount?: number;
  mutualGroupNames?: string[];
}

export interface RecentlyActive {
  id: string;
  name: string;
  avatar: string;
  isActive?: boolean;
}

export interface BlockedFriend {
  id: string;
  name: string;
  avatar: string;
  blockedAt?: string;
  isOnline?: boolean;
}

export interface CommunityGroup {
  id: string;
  name: string;
  avatar?: string;
  memberCount: number;
  isPublic: boolean;
  type: "BUSINESS" | "EDUCATION" | "COMMUNITY" | "PERSONAL";
  description?: string;
}

export interface CommunityInvite {
  id: string;
  groupId: string;
  groupName: string;
  groupAvatar?: string;
  inviterName: string;
  invitedAt: string;
  status: "pending" | "accepted" | "declined" | "revoked";
  memberCount?: number;
  isPublic?: boolean;
}

export interface FriendProfile {
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
