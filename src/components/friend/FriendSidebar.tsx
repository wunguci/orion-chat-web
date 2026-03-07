import type React from "react";
import type { Friend } from "../../types/friend";
import SearchBoxFriend from "./SearchBoxFriend";
import FriendListItem from "./FriendListItem";
import { useState } from "react";

const FRIENDS_LIST: Friend[] = [
  {
    id: "1",
    name: "Sarah Jenkins",
    status: "online",
    subtext: "Working on the project...",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAVmdJil8hTrx6ODIUtYQCyKc_YWpZfDs09pCJ1Q5gocKe0V7BR6pROQRyACoc45wZ62pekp3GIXiVRLqeBDMdvzxbwgupWbiavP0n_s6BKMt_JvVMODbc11_wTgW_QHsJXP1sVb5hkz10TOHOpOyTgsuUJDJTc-3L9mpv2ljafh2lh4rbAFD4_pJh2hyqwfCj0PY5p9qbHs2ng3tbrDGkr7bB9wEhwvmsJoWxSfby8uKI5BNo7nRzXeGzyy-2N7a1OL31n7wugNHg",
  },
  {
    id: "2",
    name: "David Chen",
    status: "offline",
    subtext: "Last seen 2h ago",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtNAGXtmuNQuxLrAnmj1GelmjOnCS7uaDKwQysHsiIiJz2U4FspCrW5fvK32t-QnjPnJbQEqzcT7xF52NkL4ySWdLfDJry25MrU4i1q7q0hJJEzQ1isjKMwDNBkP4jNB8rQAkn7ZWJNwfKnP7J4IV8X0_ZGhin3Z-OGS4fi_RFnHBYK-l20EnymyLCEEYSra0Br_EzCjDvJuut7J4N-qjSlmvWhm2NeYVmlzHsWsDFJPmEVmZoJo5dTTX46Yt-oBFwim_XEzvzGik",
  },
  {
    id: "3",
    name: "Marcus Thorne",
    status: "online",
    subtext: "Available for chat",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDuuDwwBDQHNVjJr-O0q8uaF4Bc5kQSxHUIGDyF0ovIrlJ7Zr54aE10mH1-RctDr57Xj6xhHMR8cJtCw_SYMVnBFu836ahSfe748Zv9z8NP8mtmL3Cf36C6qHD8I9Xal1vW_Mf4LmX5mSIqBGfruCyYI0O2NcA4c570bXEIMlhb5TJtNebjJP3iO79I68tu8qPjBJYbqO2enS95nh3hADcB6YeXqn0MPp_sG_kiTwmR-y9GkfnniJ9mt3VkyvHmpa2lqlIf2tCWgHs",
  },
];

interface FriendSidebarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const FriendSidebar: React.FC<FriendSidebarProps> = ({ searchQuery, setSearchQuery }) => {
    const [activeSubTab, setActiveSubTab] = useState<'All' | 'Online'>('All');

    const filteredFriends = FRIENDS_LIST.filter((friend) => {
      const matchesSearch = friend.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesTab = activeSubTab === "All" || friend.status === "online";
      return matchesSearch && matchesTab;
    });

    return (
      <section className="w-80 flex flex-col border-r border-slate-200 bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-5 border-b border-slate-200 ">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-extrabold text-slate-700 tracking-tight">
              Friends
            </h1>
          </div>
          <SearchBoxFriend value={searchQuery} onChange={setSearchQuery} />
        </div>

        <div className="flex border-b border-slate-200 px-6">
          <button
            onClick={() => setActiveSubTab("All")}
            className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeSubTab === "All"
                ? "border-green-primary text-green-primary"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveSubTab("Online")}
            className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeSubTab === "Online"
                ? "border-green-primary text-green-primary"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Online
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 hide-scrollbar">
          {filteredFriends.map((friend) => (
            <FriendListItem key={friend.id} friend={friend}/>
          ))}
        </div>
      </section>
    );

}

export default FriendSidebar;