import React from "react";
import { Phone, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { CommunityGroup } from "../../types/friend";
import { useGroupCallContext } from "../../hooks/useGroupCallContext";
import { useAuth } from "../../hooks/useAuth";
import { friendListService } from "../../services/friendListService";

interface GroupCardProps {
  group: CommunityGroup;
  onOpen?: (groupId: string) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, onOpen }) => {
  const navigate = useNavigate();
  const { initiateGroupCall } = useGroupCallContext();
  const { user } = useAuth();
  const currentUserId = user?.id || user?.userId || "user1";

  const startGroupCall = async (callType: "audio" | "video") => {
    try {
      const memberResponse = await friendListService.getGroupMembers(group.id);
      const members = memberResponse.items || [];

      const participantIds = members
        .filter((member) => member.userId !== currentUserId)
        .map((member) => member.userId);

      const participantNames: Record<string, string> = {};
      members.forEach((member) => {
        if (member.userId !== currentUserId) {
          participantNames[member.userId] = member.fullName;
        }
      });

      if (participantIds.length === 0) {
        alert("No other participants in this group");
        return;
      }

      await initiateGroupCall(group.id, participantIds, callType, participantNames);
      navigate("/group-call");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`Failed to start ${callType} call: ${errorMsg}`);
    }
  };

  const handleAudioCall = async () => {
    await startGroupCall("audio");
  };

  const handleVideoCall = async () => {
    await startGroupCall("video");
  };
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

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onOpen?.(group.id)}
          className="flex-1 py-2 rounded-lg bg-green-primary text-white font-semibold hover:bg-green-secondary transition-colors cursor-pointer"
        >
          Open Group
        </button>
        <button
          onClick={handleAudioCall}
          className="py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
          title="Audio Call"
        >
          <Phone size={18} />
        </button>
        <button
          onClick={handleVideoCall}
          className="py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
          title="Video Call"
        >
          <Video size={18} />
        </button>
      </div>
    </div>
  );
};

export default GroupCard;
