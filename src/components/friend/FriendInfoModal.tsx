import type React from "react";
import {
  Ban,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  Trash2,
  User as UserIcon,
  UserPlus,
  X,
} from "lucide-react";
import type { FriendProfile } from "../../types/friend";

interface FriendInfoModalProps {
  isOpen: boolean;
  profile: FriendProfile | null;
  mode?: "friend" | "suggested";
  onClose: () => void;
  onMessage: (friendId: string) => void;
  onCall: (friendId: string) => void;
  onAddFriend?: (friendId: string) => void;
  isSendingAddFriend?: boolean;
  hasSentAddFriend?: boolean;
  onBlock: (friendId: string) => void;
  onRemove: (friendId: string) => void;
}

const DEFAULT_COVER = "https://picsum.photos/seed/friend-cover/900/300";

const getInitials = (name: string) => {
  const words = name.trim().split(" ").filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }
  return (words[0] || "?").slice(0, 2).toUpperCase();
};

const formatDate = (value?: string | null) => {
  if (!value) return "Not yet updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet updated";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const FriendInfoModal: React.FC<FriendInfoModalProps> = ({
  isOpen,
  profile,
  mode = "friend",
  onClose,
  onMessage,
  onCall,
  onAddFriend,
  isSendingAddFriend = false,
  hasSentAddFriend = false,
  onBlock,
  onRemove,
}) => {
  if (!isOpen || !profile) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white text-slate-800 shadow-[0_24px_70px_rgba(0,0,0,0.35)] animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
        style={{ backgroundColor: "#ffffff", color: "#1e293b" }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-1.5 text-slate-700 hover:bg-gray-300 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="h-36 w-full">
          <img
            src={profile.coverImage || DEFAULT_COVER}
            alt="cover"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="-mt-12 px-6 pb-6">
          <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-green-primary to-green-secondary text-2xl font-bold text-white">
                {getInitials(profile.fullName)}
              </div>
            )}
          </div>

          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">
              {profile.fullName}
            </h2>
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                profile.isOnline
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {profile.isOnline ? "Online" : "Offline"}
            </span>
          </div>

          {mode === "suggested" ? (
            <div className="mb-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onAddFriend?.(profile.id)}
                disabled={isSendingAddFriend || hasSentAddFriend}
                className="flex items-center justify-center gap-2 rounded-lg bg-green-primary py-2.5 text-sm font-semibold text-white transition hover:bg-green-hover cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
              >
                <UserPlus size={16} />
                {hasSentAddFriend
                  ? "Request Sent"
                  : isSendingAddFriend
                    ? "Sending..."
                    : "Add Friend"}
              </button>
              <button
                type="button"
                onClick={() => onMessage(profile.id)}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-600 cursor-pointer"
              >
                <MessageSquare size={16} />
                Chat
              </button>
            </div>
          ) : (
            <div className="mb-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onCall(profile.id)}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-600 cursor-pointer"
              >
                <Phone size={16} />
                Call
              </button>
              <button
                type="button"
                onClick={() => onMessage(profile.id)}
                className="flex items-center justify-center gap-2 rounded-lg bg-green-primary py-2.5 text-sm font-semibold text-white transition hover:bg-green-hover cursor-pointer"
              >
                <MessageSquare size={16} />
                Chat
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Phone size={16} className="text-green-primary" />
              <span>{profile.phoneNumber || "Not yet updated"}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Mail size={16} className="text-green-primary" />
              <span>{profile.email || "Not yet updated"}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <UserIcon size={16} className="text-green-primary" />
              <span>{profile.gender || "Not yet updated"}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Calendar size={16} className="text-green-primary" />
              <span>Birthdate: {formatDate(profile.birthDate)}</span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>Account created on: {formatDate(profile.createdAt)}</p>
            <p>Friend since: {formatDate(profile.friendshipSince)}</p>
          </div>

          {mode === "friend" && (
            <div className="mt-5 space-y-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => onBlock(profile.id)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 cursor-pointer"
              >
                <Ban size={16} className="text-amber-600" />
                Block messages and calls
              </button>
              <button
                type="button"
                onClick={() => onRemove(profile.id)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 cursor-pointer"
              >
                <Trash2 size={16} className="text-red-600" />
                Remove from friends list
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendInfoModal;
