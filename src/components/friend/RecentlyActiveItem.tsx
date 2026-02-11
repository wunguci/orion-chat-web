import React from "react";
import type { RecentlyActive } from "../../types/friend"; 

interface RecentlyActiveItemProps {
  item: RecentlyActive;
}

const RecentlyActiveItem: React.FC<RecentlyActiveItemProps> = ({ item }) => {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer">
      <div
        className={`w-16 h-16 rounded-full p-1 border-2 transition-colors ${item.isActive ? "border-teal-500" : "border-slate-200"}`}
      >
        <div
          className="w-full h-full rounded-full bg-slate-200 overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: `url('${item.avatar}')` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-700">{item.name}</span>
    </div>
  );
};

export default RecentlyActiveItem;
