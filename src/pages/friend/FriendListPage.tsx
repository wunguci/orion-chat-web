import { useEffect, useMemo, useState } from "react";
import FriendSidebar, {
  type FriendCategory,
} from "../../components/friend/FriendSidebar";
import MainContent from "../../components/friend/MainContent";
import type {
  CommunityGroup,
  CommunityInvite,
  Friend,
  FriendRequest,
  RecentlyActive,
  SuggestedFriend,
} from "../../types/friend";
import { friendListService } from "../../services/friendListService";
import socketService from "../../services/socket";
import { getUser } from "../../utils/token";

const DEFAULT_AVATAR = "https://picsum.photos/seed/orion-friend/100/100";

const formatAgo = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(ms / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const FriendListPage = () => {
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<FriendCategory>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [groupInvites, setGroupInvites] = useState<CommunityInvite[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedFriend[]>([]);
  const [recentlyActive, setRecentlyActive] = useState<RecentlyActive[]>([]);

  const authUser = getUser();
  const userId = authUser?.id;

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      const [friendsRes, requestsRes, groupsRes, invitesRes] =
        await Promise.all([
          friendListService.getFriends(userId),
          friendListService.getIncomingFriendRequests(userId),
          friendListService.getMyGroups(userId),
          friendListService.getIncomingGroupInvites(userId),
        ]);

      const [suggestionsRes, recentlyActiveRes] = await Promise.all([
        friendListService.getSuggestionsByMutualGroups(userId),
        friendListService.getRecentlyActive(userId),
      ]);

      setFriends(
        friendsRes.map((item) => ({
          id: item.id,
          name: item.fullName,
          status: item.isOnline ? "online" : "offline",
          isOnline: item.isOnline,
          subtext: item.isOnline ? "Online" : "Offline",
          avatar: item.avatarUrl || DEFAULT_AVATAR,
        })),
      );

      setRequests(
        requestsRes.map((item) => ({
          id: item.requestId,
          senderId: item.sender.userId,
          receiverId: item.receiver.userId,
          name: item.sender.fullName,
          avatar: item.sender.avatarUrl || DEFAULT_AVATAR,
          timeAgo: formatAgo(item.createdAt),
          status: item.status,
          createdAt: item.createdAt,
        })),
      );

      setGroups(groupsRes);

      setGroupInvites(
        invitesRes.map((item) => ({
          id: item.inviteId,
          groupId: item.group.conversationId,
          groupName: item.group.groupName,
          groupAvatar: item.group.groupAvatar || DEFAULT_AVATAR,
          inviterName: item.inviter.fullName,
          invitedAt: formatAgo(item.createdAt),
          status: item.status,
        })),
      );

      setSuggestions(
        suggestionsRes.map((item) => ({
          id: item.id,
          name: item.fullName,
          avatar: item.avatarUrl || DEFAULT_AVATAR,
          mutualFriends: item.mutualGroupCount,
          mutualGroupCount: item.mutualGroupCount,
          mutualGroupNames: item.mutualGroupNames,
        })),
      );

      setRecentlyActive(
        recentlyActiveRes.map((item) => ({
          id: item.id,
          name: item.fullName,
          avatar: item.avatarUrl || DEFAULT_AVATAR,
          isActive: item.isOnline,
        })),
      );
    };

    void loadData();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const callSocket = socketService.connectCall(userId);
    if (!callSocket) return;

    const onOnline = ({ userId: onlineUserId }: { userId: string }) => {
      setFriends((prev) =>
        prev.map((f) =>
          f.id === onlineUserId
            ? { ...f, isOnline: true, status: "online", subtext: "Online" }
            : f,
        ),
      );
    };

    const onOffline = ({ userId: offlineUserId }: { userId: string }) => {
      setFriends((prev) =>
        prev.map((f) =>
          f.id === offlineUserId
            ? { ...f, isOnline: false, status: "offline", subtext: "Offline" }
            : f,
        ),
      );
    };

    const onOnlineList = ({ users }: { users: string[] }) => {
      const onlineSet = new Set(users);
      setFriends((prev) =>
        prev.map((f) => ({
          ...f,
          isOnline: onlineSet.has(f.id),
          status: onlineSet.has(f.id) ? "online" : "offline",
          subtext: onlineSet.has(f.id) ? "Online" : "Offline",
        })),
      );
    };

    callSocket.on("user:online", onOnline);
    callSocket.on("user:offline", onOffline);
    callSocket.on("users:online-list", onOnlineList);
    callSocket.emit("users:get-online");

    return () => {
      callSocket.off("user:online", onOnline);
      callSocket.off("user:offline", onOffline);
      callSocket.off("users:online-list", onOnlineList);
    };
  }, [userId]);

  const handleAcceptFriendRequest = async (requestId: string) => {
    if (!userId) return;
    await friendListService.acceptFriendRequest(requestId, userId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));

    const refreshed = await friendListService.getFriends(userId);
    setFriends(
      refreshed.map((item) => ({
        id: item.id,
        name: item.fullName,
        status: item.isOnline ? "online" : "offline",
        isOnline: item.isOnline,
        subtext: item.isOnline ? "Online" : "Offline",
        avatar: item.avatarUrl || DEFAULT_AVATAR,
      })),
    );
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    if (!userId) return;
    await friendListService.declineFriendRequest(requestId, userId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleAcceptGroupInvite = async (inviteId: string) => {
    if (!userId) return;
    await friendListService.acceptGroupInvite(inviteId, userId);
    setGroupInvites((prev) => prev.filter((i) => i.id !== inviteId));
    const refreshedGroups = await friendListService.getMyGroups(userId);
    setGroups(refreshedGroups);
  };

  const handleDeclineGroupInvite = async (inviteId: string) => {
    if (!userId) return;
    await friendListService.declineGroupInvite(inviteId, userId);
    setGroupInvites((prev) => prev.filter((i) => i.id !== inviteId));
  };

  const handleSearchByPhone = async (phone: string): Promise<Friend | null> => {
    if (!userId) return null;
    const result = await friendListService.searchUsers(userId, phone);
    const found = result[0];
    if (!found) return null;

    return {
      id: found.id,
      name: found.fullName,
      status: found.isOnline ? "online" : "offline",
      isOnline: found.isOnline,
      subtext: found.phoneNumber || "User found",
      avatar: found.avatarUrl || DEFAULT_AVATAR,
    };
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!userId) return;
    await friendListService.sendFriendRequest(userId, targetUserId);
  };

  const counts = useMemo(
    () => ({
      requestCount: requests.length,
      groupCount: groups.length,
      groupInviteCount: groupInvites.length,
    }),
    [requests.length, groups.length, groupInvites.length],
  );

  return (
    <div className="flex h-screen bg-white transition-colors">
      <FriendSidebar
        searchQuery={friendSearchQuery}
        setSearchQuery={setFriendSearchQuery}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        friends={friends}
        requestCount={counts.requestCount}
        groupCount={counts.groupCount}
        groupInviteCount={counts.groupInviteCount}
      />
      <MainContent
        activeCategory={activeCategory}
        searchQuery={friendSearchQuery}
        requests={requests}
        groups={groups}
        groupInvites={groupInvites}
        suggestions={suggestions}
        recentlyActive={recentlyActive}
        onSearchByPhone={handleSearchByPhone}
        onSendFriendRequest={handleSendFriendRequest}
        onAcceptFriendRequest={handleAcceptFriendRequest}
        onDeclineFriendRequest={handleDeclineFriendRequest}
        onAcceptGroupInvite={handleAcceptGroupInvite}
        onDeclineGroupInvite={handleDeclineGroupInvite}
      />
    </div>
  );
};

export default FriendListPage;
