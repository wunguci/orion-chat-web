import React from "react";
import type { CommunityGroup } from "../../types/friend";

interface GroupCardProps {
  group: CommunityGroup;
  onOpen?: (groupId: string) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onOpen }) => {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl bg-slate-200 bg-cover bg-center"
          style={{
            backgroundImage: group.avatar
              ? `url('${group.avatar}')`
              : undefined,
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate">{group.name}</p>
          <p className="text-xs text-slate-500">
            {group.memberCount} members • {group.type}
          </p>
        </div>
        <span
          className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
            group.isPublic
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {group.isPublic ? "Public" : "Private"}
        </span>
      </div>

      {group.description && (
        <p className="mt-3 text-sm text-slate-600 line-clamp-2">
          {group.description}
        </p>
      )}

      <button
        onClick={() => onOpen?.(group.id)}
        className="mt-4 w-full py-2 rounded-lg bg-green-primary text-white font-semibold hover:bg-green-secondary transition-colors cursor-pointer"
      >
        Open Group
      </button>
    </div>
  );
};

export default GroupCard;
