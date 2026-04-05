import type React from "react";
import type { Friend } from "../../types/friend";
import { useCall } from "../../hooks/useCall";
import { getUser } from "../../utils/token";

interface FriendListItemProps {
  friend: Friend;
}

const FriendListItem: React.FC<FriendListItemProps> = ({ friend }) => {
  const { initiateCall, status } = useCall();

  const handleStartCall = async (callType: "audio" | "video") => {
    const currentUser = getUser();
    const currentUserId = currentUser?.userId || currentUser?.id;
    if (!currentUserId || !friend.id) return;

    const conversationId = [currentUserId, friend.id].sort().join("-");

    await initiateCall(
      `friend-${conversationId}`,
      friend.id,
      callType,
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

  const isCallingBusy = status !== "idle";

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

      <div className="flex items-center gap-2">
        <button
          type="button"
          title="Audio call"
          onClick={(event) => {
            event.stopPropagation();
            void handleStartCall("audio");
          }}
          disabled={isCallingBusy}
          className="h-8 w-8 rounded-full border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-phone text-xs" />
        </button>
        <button
          type="button"
          title="Video call"
          onClick={(event) => {
            event.stopPropagation();
            void handleStartCall("video");
          }}
          disabled={isCallingBusy}
          className="h-8 w-8 rounded-full border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-video text-xs" />
        </button>
      </div>
    </div>
  );
};

export default FriendListItem;
