import type React from "react";
import type { Friend } from "../../types/friend";

interface FriendListItemProps {
  friend: Friend;
}

const FriendListItem: React.FC<FriendListItemProps> = ({ friend }) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl cursor-pointer duration-200 group relative bg-transparent hover:bg-slate-50 border border-transparent">
      {/* Avatar */}
      <div className="relative">
        <div
          className={`w-10 h-10 rounded-full bg-slate-300 bg-cover bg-center ${
            friend.status === "offline" ? "grayscale" : ""
          }`}
          style={{ backgroundImage: `url('${friend.avatar}')` }}
        />

        {/* Status dot */}
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${
            friend.status === "online" ? "bg-green-500" : "bg-slate-400"
          }`}
        />
      </div>

      {/* Text */}
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-semibold truncate">{friend.name}</p>
        <p className="text-xs text-slate-400 truncate italic">
          {friend.subtext}
        </p>
      </div>
    </div>
  );
};

export default FriendListItem;