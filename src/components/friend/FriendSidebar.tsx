import type React from 'react';
import { useMemo, useState } from 'react';
import type { Friend } from '../../types/friend';
import SearchBoxFriend from './SearchBoxFriend';
import FriendListItem from './FriendListItem';

export type FriendCategory =
  | "friends"
  | "requests"
  | "groups"
  | "group_invites"
  | "blocked";

interface FriendSidebarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    activeCategory: FriendCategory;
    setActiveCategory: (category: FriendCategory) => void;
    friends: Friend[];
    onViewFriendInfo: (friendId: string) => void;
    onRemoveFriend: (friendId: string) => void;
    onBlockFriend: (friendId: string) => void;
    requestCount: number;
    groupCount: number;
    groupInviteCount: number;
    blockedCount: number;
    onChatClick?: (friendId: string, friendName: string) => void;
}

const FriendSidebar: React.FC<FriendSidebarProps> = ({
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    friends,
    onViewFriendInfo,
    onRemoveFriend,
    onBlockFriend,
    requestCount,
    groupCount,
    groupInviteCount,
    blockedCount,
    onChatClick,
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'All' | 'Online'>('All');

    const filteredFriends = useMemo(() => {
        return friends.filter((friend) => {
            const matchesSearch = friend.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const isOnline = friend.status === 'online' || !!friend.isOnline;
            const matchesSubTab = activeSubTab === 'All' || isOnline;
            return matchesSearch && matchesSubTab;
        });
    }, [friends, searchQuery, activeSubTab]);
  const filteredFriends = useMemo(() => {
    const filtered = friends.filter((friend) => {
      const matchesSearch = friend.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const isOnline = friend.status === "online" || !!friend.isOnline;
      const matchesSubTab = activeSubTab === "All" || isOnline;
      return matchesSearch && matchesSubTab;
    });

    if (activeSubTab !== "All") {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      const aOnline = a.status === "online" || !!a.isOnline;
      const bOnline = b.status === "online" || !!b.isOnline;
      if (aOnline === bOnline) return 0;
      return bOnline ? 1 : -1;
    });
  }, [friends, searchQuery, activeSubTab]);

    return (
        <section className="w-80 flex flex-col border-r border-slate-200 bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-5 border-b border-slate-200">
                <h1 className="text-2xl font-extrabold text-slate-700 tracking-tight mb-5">
                    Friends
                </h1>
                <SearchBoxFriend
                    value={searchQuery}
                    onChange={setSearchQuery}
                />
            </div>

            <div className="p-3 border-b border-slate-200 grid grid-cols-2 gap-2">
                <button
                    onClick={() => setActiveCategory('friends')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                        activeCategory === 'friends'
                            ? 'bg-green-primary text-white'
                            : 'bg-slate-100 text-slate-700'
                    }`}
                >
                    Friends ({friends.length})
                </button>
                <button
                    onClick={() => setActiveCategory('requests')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                        activeCategory === 'requests'
                            ? 'bg-green-primary text-white'
                            : 'bg-slate-100 text-slate-700'
                    }`}
                >
                    Requests ({requestCount})
                </button>
                <button
                    onClick={() => setActiveCategory('groups')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                        activeCategory === 'groups'
                            ? 'bg-green-primary text-white'
                            : 'bg-slate-100 text-slate-700'
                    }`}
                >
                    Groups ({groupCount})
                </button>
                <button
                    onClick={() => setActiveCategory('group_invites')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                        activeCategory === 'group_invites'
                            ? 'bg-green-primary text-white'
                            : 'bg-slate-100 text-slate-700'
                    }`}
                >
                    Group Invites ({groupInviteCount})
                </button>
                <button
                    onClick={() => setActiveCategory('blocked')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                        activeCategory === 'blocked'
                            ? 'bg-green-primary text-white'
                            : 'bg-slate-100 text-slate-700'
                    }`}
                >
                    Blocked ({blockedCount})
                </button>
            </div>

            {activeCategory === 'friends' && (
                <>
                    <div className="flex border-b border-slate-200 px-6">
                        <button
                            onClick={() => setActiveSubTab('All')}
                            className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                                activeSubTab === 'All'
                                    ? 'border-green-primary text-green-primary'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveSubTab('Online')}
                            className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                                activeSubTab === 'Online'
                                    ? 'border-green-primary text-green-primary'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Online
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
                        {filteredFriends.map((friend) => (
                            <FriendListItem
                                key={friend.id}
                                friend={friend}
                                onViewInfo={onViewFriendInfo}
                                onRemoveFriend={onRemoveFriend}
                                onBlockFriend={onBlockFriend}
                            />
                        ))}
                    </div>
                </>
            )}

            {activeCategory !== 'friends' && (
                <div className="flex-1 p-4 text-sm text-slate-500">
                    Chọn nội dung ở vùng bên phải.
                </div>
            )}
        </section>
    );
};

export default FriendSidebar;
