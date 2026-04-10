import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import FriendSidebar, {
  type FriendCategory,
} from "../../components/friend/FriendSidebar";
import MainContent from "../../components/friend/MainContent";
import FriendInfoModal from "../../components/friend/FriendInfoModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { ToastUndo } from "../../components/common/ToastUndo";
import type {
    CommunityGroup,
    BlockedFriend,
    FriendProfile,
    CommunityInvite,
    Friend,
    FriendRequest,
    RecentlyActive,
    SuggestedFriend,
} from '../../types/friend';
import { friendListService } from "../../services/friendListService";
import socketService from "../../services/socket";
import { getUser } from "../../utils/token";
import { useCall } from '../../hooks/useCall';

const DEFAULT_AVATAR = "https://picsum.photos/seed/orion-friend/100/100";
const UNDO_DURATION_MS = 4000;

type PendingFriendAction = {
  kind: "remove" | "block";
  friendId: string;
  friendsSnapshot: Friend[];
  recentlyActiveSnapshot: RecentlyActive[];
};

type InfoModalMode = "friend" | "suggested";

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
  const [blockedFriends, setBlockedFriends] = useState<BlockedFriend[]>([]);
  const [selectedFriendProfile, setSelectedFriendProfile] =
    useState<FriendProfile | null>(null);
  const [infoModalMode, setInfoModalMode] = useState<InfoModalMode>("friend");
  const [isSendingAddFriend, setIsSendingAddFriend] = useState(false);
  const [pendingSentRequestIds, setPendingSentRequestIds] = useState<
    Set<string>
  >(new Set());
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [pendingBlockFriendId, setPendingBlockFriendId] = useState<
    string | null
  >(null);
  const [pendingRemoveFriendId, setPendingRemoveFriendId] = useState<
    string | null
  >(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoMessage, setUndoMessage] = useState("");
  const [pendingAction, setPendingAction] =
    useState<PendingFriendAction | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { initiateCall, status: callStatus } = useCall();

   const navigate = useNavigate();
   const { createOrOpenConversation } = useCreateOrOpenConversation();

  const authUser = getUser();
  const userId = authUser?.userId || authUser?.id || "";

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const mapFriendFromApi = (item: {
    id: string;
    fullName: string;
    isOnline: boolean;
    avatarUrl?: string | null;
  }): Friend => ({
    id: item.id,
    name: item.fullName,
    status: item.isOnline ? "online" : "offline",
    isOnline: item.isOnline,
    subtext: item.isOnline ? "Online" : "Offline",
    avatar: item.avatarUrl || "",
  });

    useEffect(() => {
        if (!userId) return;

    const loadData = async () => {
      const [
        friendsRes,
        requestsRes,
        outgoingRequestsRes,
        groupsRes,
        invitesRes,
      ] = await Promise.all([
        friendListService.getFriends(userId),
        friendListService.getIncomingFriendRequests(userId),
        friendListService.getOutgoingFriendRequests(userId),
        friendListService.getMyGroups(userId),
        friendListService.getIncomingGroupInvites(userId),
      ]);

            const [suggestionsRes, recentlyActiveRes] = await Promise.all([
                friendListService.getSuggestionsByMutualGroups(userId),
                friendListService.getRecentlyActive(userId),
            ]);

      const blockedRes = await friendListService.getBlockedFriends(userId);

       setFriends(
           friendsRes.map((item) => ({
               id: item.id,
               name: item.fullName,
               status: item.isOnline ? 'online' : 'offline',
               isOnline: item.isOnline,
               subtext: item.isOnline ? 'Online' : 'Offline',
               avatar: item.avatarUrl || DEFAULT_AVATAR,
           })),
       );

            setRequests(
                requestsRes.map((item) => ({
                    id: item.requestId,
                    senderId: item.sender.userId,
                    receiverId: item.receiver.userId,
                    name: item.sender.fullName,
                    avatar: item.sender.avatarUrl || "",
                    timeAgo: formatAgo(item.createdAt),
                    status: item.status,
                    createdAt: item.createdAt,
                })),
            );
             setPendingSentRequestIds(
                 new Set(
                     outgoingRequestsRes.map((item) => item.receiver.userId),
                 ),
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
          avatar: item.avatarUrl || "",
          mutualFriends: item.mutualGroupCount,
          mutualGroupCount: item.mutualGroupCount,
          mutualGroupNames: item.mutualGroupNames,
        })),
      );

      setRecentlyActive(
        recentlyActiveRes.map((item) => ({
          id: item.id,
          name: item.fullName,
          avatar: item.avatarUrl || "",
          isActive: item.isOnline,
        })),
      );
      setBlockedFriends(
          blockedRes.map((item) => ({
              id: item.id,
              name: item.fullName,
              avatar: item.avatarUrl || '',
              blockedAt: item.blockedAt,
              isOnline: item.isOnline,
          })),
      );
    };

        void loadData();
    }, [userId]);

    useEffect(() => {
        if (!userId) return;

        const presenceSocket = socketService.connectPresence(userId);
        if (!presenceSocket) return;

        const onOnline = ({ userId: onlineUserId }: { userId: string }) => {
            setFriends((prev) =>
                prev.map((f) =>
                    f.id === onlineUserId
                        ? {
                              ...f,
                              isOnline: true,
                              status: 'online',
                              subtext: 'Online',
                          }
                        : f,
                ),
            );
        };

        const onOffline = ({ userId: offlineUserId }: { userId: string }) => {
            setFriends((prev) =>
                prev.map((f) =>
                    f.id === offlineUserId
                        ? {
                              ...f,
                              isOnline: false,
                              status: 'offline',
                              subtext: 'Offline',
                          }
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
                    status: onlineSet.has(f.id) ? 'online' : 'offline',
                    subtext: onlineSet.has(f.id) ? 'Online' : 'Offline',
                })),
            );
        };

        presenceSocket.on('presence:user-online', onOnline);
        presenceSocket.on('presence:user-offline', onOffline);
        presenceSocket.on('presence:online-list', onOnlineList);
        presenceSocket.emit('presence:get-online');

        return () => {
            presenceSocket.off('presence:user-online', onOnline);
            presenceSocket.off('presence:user-offline', onOffline);
            presenceSocket.off('presence:online-list', onOnlineList);
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
                status: item.isOnline ? 'online' : 'offline',
                isOnline: item.isOnline,
                subtext: item.isOnline ? 'Online' : 'Offline',
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

    const handleSearchByPhone = async (
        phone: string,
    ): Promise<Friend | null> => {
        if (!userId) return null;
        const result = await friendListService.searchUsers(userId, phone);
        const found = result[0];
        if (!found) return null;

        return {
            id: found.id,
            name: found.fullName,
            status: found.isOnline ? 'online' : 'offline',
            isOnline: found.isOnline,
            subtext: found.phoneNumber || 'User found',
            avatar: found.avatarUrl || "",
        };
    };

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!userId) return;
    await friendListService.sendFriendRequest(userId, targetUserId);
    setPendingSentRequestIds((prev) => {
      const next = new Set(prev);
      next.add(targetUserId);
      return next;
    });
  };

  const openProfileWithFallback = async (
    targetUserId: string,
    fallback?: {
      fullName: string;
      avatarUrl?: string;
      isOnline?: boolean;
    },
  ) => {
    if (!userId) return;

    try {
      const profile = await friendListService.getFriendProfile(
        userId,
        targetUserId,
      );
      setSelectedFriendProfile(profile);
      setIsInfoModalOpen(true);
      return;
    } catch {
      if (!fallback) {
        window.alert("Khong the tai thong tin");
        return;
      }
    }

    setSelectedFriendProfile({
      id: targetUserId,
      fullName: fallback.fullName,
      avatarUrl: fallback.avatarUrl || undefined,
      isOnline: Boolean(fallback.isOnline),
      phoneNumber: "",
      email: null,
      gender: null,
      birthDate: null,
      createdAt: undefined,
      friendshipSince: undefined,
    });
    setIsInfoModalOpen(true);
  };

  const handleViewFriendInfo = async (friendId: string) => {
    setInfoModalMode("friend");
    await openProfileWithFallback(friendId);
  };

  const handleViewSuggestedInfo = async (friendId: string) => {
    const suggested = suggestions.find((item) => item.id === friendId);
    if (!suggested) return;

    setInfoModalMode("suggested");
    await openProfileWithFallback(friendId, {
      fullName: suggested.name,
      avatarUrl: suggested.avatar,
      isOnline: false,
    });
  };

  const handleViewRecentlyActiveInfo = async (friendId: string) => {
    const active = recentlyActive.find((item) => item.id === friendId);
    if (!active) return;

    setInfoModalMode("friend");
    await openProfileWithFallback(friendId, {
      fullName: active.name,
      avatarUrl: active.avatar,
      isOnline: Boolean(active.isActive),
    });
  };

  const handleAddFriendFromProfile = async (friendId: string) => {
    if (isSendingAddFriend || pendingSentRequestIds.has(friendId)) return;

    setIsSendingAddFriend(true);
    try {
      await handleSendFriendRequest(friendId);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Khong the gui loi moi ket ban";
      window.alert(message);
    } finally {
      setIsSendingAddFriend(false);
    }
  };

  const handleRequestBlockFriend = (friendId: string) => {
    setPendingBlockFriendId(friendId);
    setIsBlockConfirmOpen(true);
  };

  const startUndoAction = (kind: "remove" | "block", friendId: string) => {
    if (!userId) return;

    if (pendingAction) {
      window.alert("Please complete or undo the previous action first.");
      return;
    }

    const action: PendingFriendAction = {
      kind,
      friendId,
      friendsSnapshot: friends,
      recentlyActiveSnapshot: recentlyActive,
    };

    setPendingAction(action);
    setFriends((prev) => prev.filter((item) => item.id !== friendId));
    setRecentlyActive((prev) => prev.filter((item) => item.id !== friendId));
    if (kind === "block") {
      const target = friends.find((item) => item.id === friendId);
      if (target) {
        setBlockedFriends((prev) => [
          {
            id: target.id,
            name: target.name,
            avatar: target.avatar,
            blockedAt: new Date().toISOString(),
            isOnline: target.isOnline,
          },
          ...prev,
        ]);
      }
    }

    if (selectedFriendProfile?.id === friendId) {
      setIsInfoModalOpen(false);
      setSelectedFriendProfile(null);
    }

    setUndoMessage(kind === "remove" ? "Friend removed" : "Friend blocked");
    setShowUndoToast(true);

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    undoTimerRef.current = setTimeout(() => {
      void commitPendingAction(action);
    }, UNDO_DURATION_MS);
  };

  const commitPendingAction = async (action: PendingFriendAction) => {
    try {
      if (action.kind === "remove") {
        await friendListService.removeFriend(userId, action.friendId);
      } else {
        await friendListService.blockFriend(userId, action.friendId);
      }
      setPendingAction(null);
      setShowUndoToast(false);
    } catch (error) {
      setFriends(action.friendsSnapshot);
      setRecentlyActive(action.recentlyActiveSnapshot);
      setPendingAction(null);
      setShowUndoToast(false);
      const message = error instanceof Error ? error.message : "Action failed";
      window.alert(message);
    }
  };

  const handleUndoFriendAction = () => {
    if (!pendingAction) return;
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    setFriends(pendingAction.friendsSnapshot);
    setRecentlyActive(pendingAction.recentlyActiveSnapshot);
    if (pendingAction.kind === "block") {
      setBlockedFriends((prev) =>
        prev.filter((item) => item.id !== pendingAction.friendId),
      );
    }
    setPendingAction(null);
    setShowUndoToast(false);
  };

  const handleConfirmBlockFriend = () => {
    if (!pendingBlockFriendId) return;
    startUndoAction("block", pendingBlockFriendId);
    setPendingBlockFriendId(null);
  };

  const handleRequestRemoveFriend = (friendId: string) => {
    setPendingRemoveFriendId(friendId);
    setIsRemoveConfirmOpen(true);
  };

  const handleConfirmRemoveFriend = () => {
    if (!pendingRemoveFriendId) return;
    startUndoAction("remove", pendingRemoveFriendId);
    setPendingRemoveFriendId(null);
  };

  const handleMessageFromProfile = (friendId: string) => {
    setIsInfoModalOpen(false);
    setSelectedFriendProfile(null);
    window.alert(
      `Messaging ${friendId} will provide support in the next step.`,
    );
  };

  const handleUnblockFriend = async (friendId: string) => {
    if (!userId) return;

    try {
      await friendListService.unblockFriend(userId, friendId);
      setBlockedFriends((prev) => prev.filter((item) => item.id !== friendId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Cannot be unblocked";
      window.alert(message);
    }
  };

  const handleCallFromProfile = async (friendId: string) => {
    const currentUser = getUser();
    const currentUserId = currentUser?.userId || currentUser?.id;
    const friend = friends.find((item) => item.id === friendId);
    if (!currentUserId || !friend) return;

    if (callStatus !== "idle") {
      window.alert("I'm currently on another call. Please try again later.");
      return;
    }

    const conversationId = [currentUserId, friend.id].sort().join("-");

    await initiateCall(
      `friend-${conversationId}`,
      friend.id,
      "audio",
      {
        name: friend.name,
        avatar: friend.avatar,
      },
      {
        name: currentUser.fullName,
        avatar: currentUser.avatarUrl || undefined,
      },
    );
  };
  
    const handleChatClick = async (friendId: string, friendName: string) => {
        try {
            const conversationId = await createOrOpenConversation(friendId);
            if (conversationId) {
                // Navigate to chat page with conversation ID in state
                navigate('/chat', {
                    state: {
                        selectedConversationId: conversationId,
                    },
                });
            }
        } catch (error) {
            console.error('Failed to open chat with friend:', error);
        }
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
             onViewFriendInfo={handleViewFriendInfo}
             onRemoveFriend={handleRequestRemoveFriend}
             onBlockFriend={handleRequestBlockFriend}
             requestCount={counts.requestCount}
             groupCount={counts.groupCount}
             groupInviteCount={counts.groupInviteCount}
             blockedCount={blockedFriends.length}
         />
         <MainContent
             activeCategory={activeCategory}
             searchQuery={friendSearchQuery}
             requests={requests}
             groups={groups}
             groupInvites={groupInvites}
             suggestions={suggestions}
             recentlyActive={recentlyActive}
             blockedFriends={blockedFriends}
             pendingSentRequestIds={pendingSentRequestIds}
             onUnblockFriend={handleUnblockFriend}
             onViewSuggestedInfo={(friendId) => {
                 void handleViewSuggestedInfo(friendId);
             }}
             onViewRecentlyActiveInfo={(friendId) => {
                 void handleViewRecentlyActiveInfo(friendId);
             }}
             onSearchByPhone={handleSearchByPhone}
             onSendFriendRequest={handleSendFriendRequest}
             onAcceptFriendRequest={handleAcceptFriendRequest}
             onDeclineFriendRequest={handleDeclineFriendRequest}
             onAcceptGroupInvite={handleAcceptGroupInvite}
             onDeclineGroupInvite={handleDeclineGroupInvite}
         />

         <FriendInfoModal
             isOpen={isInfoModalOpen}
             profile={selectedFriendProfile}
             mode={infoModalMode}
             onMessage={handleMessageFromProfile}
             onCall={(friendId) => {
                 void handleCallFromProfile(friendId);
             }}
             onAddFriend={(friendId) => {
                 void handleAddFriendFromProfile(friendId);
             }}
             isSendingAddFriend={isSendingAddFriend}
             hasSentAddFriend={Boolean(
                 selectedFriendProfile &&
                 pendingSentRequestIds.has(selectedFriendProfile.id),
             )}
             onBlock={handleRequestBlockFriend}
             onRemove={handleRequestRemoveFriend}
             onClose={() => {
                 setIsInfoModalOpen(false);
                 setSelectedFriendProfile(null);
             }}
         />

         <ConfirmDialog
             isOpen={isBlockConfirmOpen}
             onClose={() => {
                 setIsBlockConfirmOpen(false);
                 setPendingBlockFriendId(null);
             }}
             onConfirm={handleConfirmBlockFriend}
             title="Block Friend"
             message="Are you sure you want to block this friend? They won't be able to send you messages or calls."
             confirmText="Block"
             cancelText="Cancel"
             variant="danger"
         />

         <ConfirmDialog
             isOpen={isRemoveConfirmOpen}
             onClose={() => {
                 setIsRemoveConfirmOpen(false);
                 setPendingRemoveFriendId(null);
             }}
             onConfirm={handleConfirmRemoveFriend}
             title="Delete Friend"
             message="Are you sure you want to remove this friend from your friend list?"
             confirmText="Delete"
             cancelText="Cancel"
             variant="danger"
         />

         <ToastUndo
             isVisible={showUndoToast}
             message={undoMessage}
             onUndo={handleUndoFriendAction}
             duration={UNDO_DURATION_MS}
         />
     </div>
 );
};

export default FriendListPage;
