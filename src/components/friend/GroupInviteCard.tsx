import React from "react";
import type { CommunityInvite } from "../../types/friend";

interface GroupInviteCardProps {
  invite: CommunityInvite;
  onAccept: (inviteId: string) => void;
  onDecline: (inviteId: string) => void;
}

const GroupInviteCard: React.FC<GroupInviteCardProps> = ({
  invite,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl bg-slate-200 bg-cover bg-center"
          style={{
            backgroundImage: invite.groupAvatar
              ? `url('${invite.groupAvatar}')`
              : undefined,
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate">
            {invite.groupName}
          </p>
          <p className="text-xs text-slate-500">
            Invited by {invite.inviterName} • {invite.invitedAt}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => onAccept(invite.id)}
          className="py-2 rounded-lg bg-green-primary text-white font-semibold hover:bg-green-secondary cursor-pointer"
        >
          Accept
        </button>
        <button
          onClick={() => onDecline(invite.id)}
          className="py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
        >
          Decline
        </button>
      </div>
    </div>
  );
};

export default GroupInviteCard;
