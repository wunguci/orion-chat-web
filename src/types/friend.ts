export interface Friend {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'away';
    subtext: string;
    avatar: string;
}

export interface FriendRequest {
  id: string;
  name: string;
  timeAgo: string;
  avatar: string;
  message?: string;
}

export interface SuggestedFriend {
  id: string;
  name: string;
  mutualFriends: number;
  avatar: string;
} 

export interface RecentlyActive {
    id: string;
    name: string;
    avatar: string;
    isActive?: boolean;
}