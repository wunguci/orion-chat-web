import React from "react";
import type { FriendRequest } from "../../types/friend";
import { FaCheck } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

interface FriendRequestCardProps {
  request: FriendRequest;
}

const FriendRequestCard: React.FC<FriendRequestCardProps> = ({ request }) => {
  return (
    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl group hover:shadow-sm transition-all flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full bg-slate-300 bg-cover bg-center shrink-0 border-2 border-white shadow-sm"
          style={{ backgroundImage: `url('${request.avatar}')` }}
        />
        <div className="flex-1 overflow-hidden">
          <p className="font-bold text-slate-900 truncate">{request.name}</p>
          <p className="text-xs text-slate-500">{request.timeAgo}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            className="w-10 h-10 flex items-center justify-center bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors shadow-sm shadow-primary/20 cursor-pointer"
            title="Accept"
          >
            <FaCheck className="text-xl" />
          </button>
          <button
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-slate-600 hover:border-slate-300 transition-colors cursor-pointer"
            title="Decline"
          >
            <IoClose className="text-xl" />
          </button>
        </div>
      </div>

      {request.message && (
        <div className="relative bg-white/60 p-3 rounded-xl border border-slate-100 italic text-sm text-slate-600 before:content-[''] before:absolute before:-top-2 before:left-6 before:w-4 before:h-4 before:bg-white/60 before:border-l before:border-t before:border-slate-100 before:rotate-45">
          "{request.message}"
        </div>
      )}
    </div>
  );
};

export default FriendRequestCard;