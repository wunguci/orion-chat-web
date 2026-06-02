import type React from "react";
import AddFriendSection from "./AddFriendSection";
import SearchResultCard from "./SearchResultCard";
import FriendRequestCard from "./FriendRequestCard";
import SuggestionCard from "./SuggestionCard";
import RecentlyActiveItem from "./RecentlyActiveItem";
import GroupCard from "./GroupCard";
import GroupInviteCard from "./GroupInviteCard";
import { useMemo, useState } from "react";
import { Avatar } from "../common/Avatar";
import type {
  BlockedFriend,
  CommunityGroup,
  CommunityInvite,
  Friend,
  FriendRequest,
  RecentlyActive,
  SuggestedFriend,
} from "../../types/friend";
import type { FriendCategory } from "./FriendSidebar";

interface MainContentProps {
  activeCategory: FriendCategory;
  searchQuery: string;
  requests: FriendRequest[];
  groups: CommunityGroup[];
  groupInvites: CommunityInvite[];
  suggestions: SuggestedFriend[];
  recentlyActive: RecentlyActive[];
  blockedFriends: BlockedFriend[];
  pendingSentRequestIds: Set<string>;
  onUnblockFriend: (friendId: string) => Promise<void>;
  onViewSuggestedInfo: (friendId: string) => void;
  onViewRecentlyActiveInfo: (friendId: string) => void;
  onSearchByPhone: (phone: string) => Promise<Friend | null>;
  onSendFriendRequest: (
    targetUserId: string,
    message?: string,
  ) => Promise<void>;
  onAcceptFriendRequest: (requestId: string) => Promise<void>;
  onDeclineFriendRequest: (requestId: string) => Promise<void>;
  onAcceptGroupInvite: (inviteId: string) => Promise<void>;
  onDeclineGroupInvite: (inviteId: string) => Promise<void>;
  onOpenGroupChat?: (groupId: string) => void;
  onDirectMessageSearch?: (friendId: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  activeCategory,
  searchQuery,
  requests,
  groups,
  groupInvites,
  suggestions,
  recentlyActive,
  blockedFriends,
  pendingSentRequestIds,
  onUnblockFriend,
  onViewSuggestedInfo,
  onViewRecentlyActiveInfo,
  onSearchByPhone,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onAcceptGroupInvite,
  onDeclineGroupInvite,
  onOpenGroupChat,
  onDirectMessageSearch,
}) => {
  const [searchResult, setSearchResult] = useState<Friend | null>(null);
  const [sendingSuggestionIds, setSendingSuggestionIds] = useState<Set<string>>(
    new Set(),
  );

  const query = searchQuery.trim().toLowerCase();

  const filteredRequests = useMemo(() => {
    if (!query) return requests;
    return requests.filter((r) => r.name.toLowerCase().includes(query));
  }, [query, requests]);

  const filteredGroups = useMemo(() => {
    if (!query) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(query));
  }, [query, groups]);

  const filteredGroupInvites = useMemo(() => {
    if (!query) return groupInvites;
    return groupInvites.filter(
      (invite) =>
        invite.groupName.toLowerCase().includes(query) ||
        invite.inviterName.toLowerCase().includes(query),
    );
  }, [query, groupInvites]);

  const filteredBlockedFriends = useMemo(() => {
    if (!query) return blockedFriends;
    return blockedFriends.filter((item) =>
      item.name.toLowerCase().includes(query),
    );
  }, [blockedFriends, query]);

  const handleAddFriendFromSuggestion = async (friendId: string) => {
    if (
      sendingSuggestionIds.has(friendId) ||
      pendingSentRequestIds.has(friendId)
    ) {
      return;
    }

    setSendingSuggestionIds((prev) => {
      const next = new Set(prev);
      next.add(friendId);
      return next;
    });

    try {
      await onSendFriendRequest(
        friendId,
        "Hi! I'd like to connect with you on Orion Chat.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send friend request";
      window.alert(message);
    } finally {
      setSendingSuggestionIds((prev) => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white p-8 hide-scrollbar">
      <div className="max-w-4xl mx-auto space-y-12">
        {activeCategory === "friends" && (
          <>
            <AddFriendSection
              onSearchResult={setSearchResult}
              onSearchByPhone={onSearchByPhone}
            />

            {searchResult && (
              <section className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight">
                    Search Result
                  </h2>
                </div>
                <SearchResultCard
                  friend={searchResult}
                  onSendFriendRequest={onSendFriendRequest}
                  isPending={pendingSentRequestIds.has(searchResult.id)}
                  onClose={() => setSearchResult(null)}
                  onDirectMessage={onDirectMessageSearch}
                />
              </section>
            )}

            <section>
              <h2 className="mb-6 text-xl font-bold tracking-tight">
                Suggested by mutual groups
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {suggestions
                  .filter(
                    (suggestion) => !pendingSentRequestIds.has(suggestion.id),
                  )
                  .map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onViewInfo={onViewSuggestedInfo}
                      onAddFriend={(friendId) => {
                        void handleAddFriendFromSuggestion(friendId);
                      }}
                      isSending={sendingSuggestionIds.has(suggestion.id)}
                      isSent={pendingSentRequestIds.has(suggestion.id)}
                    />
                  ))}
              </div>
            </section>

            <section className="pb-12">
              <h2 className="text-xl font-bold mb-6 tracking-tight">
                Recently Active
              </h2>
              <div className="flex flex-wrap gap-4">
                {recentlyActive.map((active) => (
                  <RecentlyActiveItem
                    key={active.id}
                    item={active}
                    onViewInfo={onViewRecentlyActiveInfo}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {activeCategory === "requests" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight">
                  Friend Requests
                </h2>
                <span className="bg-teal-100 text-green-secondary text-xs font-bold px-2 py-1 rounded-full">
                  {filteredRequests.length} Pending
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredRequests.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={request}
                  onAccept={onAcceptFriendRequest}
                  onDecline={onDeclineFriendRequest}
                />
              ))}
            </div>
          </section>
        )}

        {activeCategory === "groups" && (
          <section>
            <h2 className="text-xl font-bold mb-6 tracking-tight">
              Groups and Communities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onOpen={onOpenGroupChat}
                />
              ))}
            </div>
          </section>
        )}

        {activeCategory === "group_invites" && (
          <section>
            <h2 className="text-xl font-bold mb-6 tracking-tight">
              Community Group Invites
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGroupInvites.map((invite) => (
                <GroupInviteCard
                  key={invite.id}
                  invite={invite}
                  onAccept={onAcceptGroupInvite}
                  onDecline={onDeclineGroupInvite}
                />
              ))}
            </div>
          </section>
        )}

        {activeCategory === "blocked" && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">
                Blocked Friends
              </h2>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                {filteredBlockedFriends.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredBlockedFriends.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <Avatar
                    src={item.avatar || undefined}
                    alt={item.name}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">Blocked</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void onUnblockFriend(item.id);
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MainContent;
