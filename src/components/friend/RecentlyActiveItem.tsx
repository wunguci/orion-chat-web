import React from "react";
import type { RecentlyActive } from "../../types/friend";
import { Avatar } from "../common/Avatar";

interface RecentlyActiveItemProps {
  item: RecentlyActive;
  onViewInfo: (friendId: string) => void;
}

const RecentlyActiveItem: React.FC<RecentlyActiveItemProps> = ({
  item,
  onViewInfo,
}) => {
  return (
    <button
      type="button"
      onClick={() => onViewInfo(item.id)}
      className="flex flex-col items-center gap-2 cursor-pointer"
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full border-2 p-1 transition-colors ${item.isActive ? "border-teal-500" : "border-slate-200"}`}
      >
        <Avatar src={item.avatar || undefined} alt={item.name} size="lg" />
      </div>
      <span className="text-xs font-medium text-slate-700">{item.name}</span>
    </button>
  );
};

export default RecentlyActiveItem;
