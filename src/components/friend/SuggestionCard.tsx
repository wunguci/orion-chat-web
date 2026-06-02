import React from "react";
import type { SuggestedFriend } from "../../types/friend";
import { Avatar } from "../common/Avatar";

interface SuggestionCardProps {
  suggestion: SuggestedFriend;
  onViewInfo: (friendId: string) => void;
  onAddFriend: (friendId: string) => void;
  isSending?: boolean;
  isSent?: boolean;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onViewInfo,
  onAddFriend,
  isSending = false,
  isSent = false,
}) => {
  return (
    <button
      type="button"
      onClick={() => onViewInfo(suggestion.id)}
      className="w-full text-left bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Visual Header / Banner Area */}
      <div className="h-20 bg-green-primary relative">
        <div className="absolute -bottom-6 left-4 rounded-full border-4 border-white shadow-sm">
          <Avatar
            src={suggestion.avatar || undefined}
            alt={suggestion.name}
            size="lg"
          />
        </div>
      </div>

      <div className="p-4 pt-8">
        <p className="font-bold text-slate-900">{suggestion.name}</p>
        <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">group</span>
          <span className="text-sm">
            {suggestion.mutualFriends} mutual friends
          </span>
        </p>
        {!!suggestion.mutualGroupCount && (
          <p className="text-xs text-slate-500 mb-4">
            {suggestion.mutualGroupCount} mutual groups
            {suggestion.mutualGroupNames?.length
              ? ` • ${suggestion.mutualGroupNames.slice(0, 2).join(", ")}`
              : ""}
          </p>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAddFriend(suggestion.id);
          }}
          disabled={isSending || isSent}
          className="w-full py-2 bg-green-primary text-white font-bold rounded-lg hover:bg-green-secondary transition-all text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSent ? "Request Sent" : isSending ? "Sending..." : "Add Friend"}
        </button>
      </div>
    </button>
  );
};

export default SuggestionCard;
