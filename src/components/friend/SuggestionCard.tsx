import React from "react";
import type { SuggestedFriend } from "../../types/friend";

interface SuggestionCardProps {
  suggestion: SuggestedFriend;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Visual Header / Banner Area */}
      <div className="h-20 bg-teal-400 relative">
        <div
          className="absolute -bottom-6 left-4 w-12 h-12 rounded-full border-4 border-white bg-slate-300 bg-cover bg-center shadow-sm"
          style={{ backgroundImage: `url('${suggestion.avatar}')` }}
        />
      </div>

      <div className="p-4 pt-8">
        <p className="font-bold text-slate-900">{suggestion.name}</p>
        <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">group</span>
          <span className="text-sm">
            {suggestion.mutualFriends} mutual friends
          </span>
        </p>
        <button className="w-full py-2 bg-teal-400 text-white font-bold rounded-lg hover:bg-teal-600 transition-all text-sm cursor-pointer">
          Add Friend
        </button>
      </div>
    </div>
  );
};

export default SuggestionCard;
