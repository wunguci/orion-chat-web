import React from 'react';
import { Phone, Video, PhoneOff, Clock } from 'lucide-react';

export interface CallHistoryData {
    callType: 'audio' | 'video';
    callStatus: 'missed' | 'declined' | 'completed' | 'active';
    duration?: number; // in seconds
    isMe?: boolean;
    isInitiator?: boolean; // Whether the sender initiated the call
    callId?: string;
    callMode?: 'group' | 'direct' | string;
    onJoinCall?: () => void;
}

export const CallHistoryCard: React.FC<CallHistoryData & { onCallBack?: () => void }> = ({
    callType,
    callStatus,
    duration = 0,
    isMe = false,
    callMode,
    onCallBack,
    onJoinCall,
}) => {
  // Định dạng thời lượng: 0 seconds -> "0 phút", 3 seconds -> "0 phút 3 giây", 65 seconds -> "1 phút 5 giây"
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0 && secs === 0) return "0 minutes";
    if (mins === 0) return `${secs} seconds`;
    if (secs === 0) return `${mins} minutes`;
    return `${mins} minutes ${secs} seconds`;
  };

  // xác định text, màu sắc và icon dựa trên trạng thái cuộc gọi
  const getStatusInfo = () => {
    // Messages are written by caller only.
    // isMe=true  -> caller view
    // isMe=false -> receiver view

    if (callMode === "group") {
      if (callStatus === "active") {
        return {
          text: "Group call is ongoing",
          color: "text-indigo-600 font-bold animate-pulse",
          icon: callType === "video" ? Video : Phone,
        };
      }
      return {
        text: "Group call has ended",
        color: "text-slate-500 font-semibold",
        icon: callType === "video" ? Video : Phone,
      };
    }

    if (callStatus === "active") {
      return {
        text: "Group call is in progress.",
        color: "text-indigo-600 font-bold animate-pulse",
        icon: callType === "video" ? Video : Phone,
      };
    }

    if (callStatus === "completed") {
      return {
        text: `Call ${callType === "video" ? "video" : "audio"} ${isMe ? "outgoing" : "incoming"}`,
        color: "text-green-500",
        icon: callType === "video" ? Video : Phone,
      };
    }

    if (callStatus === "missed") {
      return {
        text: isMe ? "You canceled" : "You missed",
        color: "text-red-500",
        icon: PhoneOff,
      };
    }

    // callStatus === "declined": caller sees receiver declined, receiver sees self declined
    if (isMe) {
      return {
        text: "The other person declined",
        color: "text-orange-500",
        icon: PhoneOff,
      };
    }

    return {
      text: "You declined",
      color: "text-orange-500",
      icon: PhoneOff,
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className={`w-full px-4 py-2 rounded-xl border ${
        callStatus === "active"
          ? "bg-indigo-50 border-indigo-300 text-slate-800 shadow-sm"
          : isMe
            ? "bg-green-message border-green-400 text-white"
            : "bg-white border-slate-200 text-slate-800"
      }`}
    >
      {/* Header: trạng thái + icon */}
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
        <span className={`text-sm font-semibold ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
      </div>

      {/* Duration - for completed calls */}
      {callStatus === "completed" && duration !== undefined && (
        <div
          className={`flex items-center gap-1 text-xs mb-2 ${
            isMe ? "text-green-100" : "text-slate-500"
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>{formatDuration(duration)}</span>
        </div>
      )}

      {/* Call button */}
      {callStatus === "active" ? (
        <button
          onClick={onJoinCall}
          className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
        >
          Join Call
        </button>
      ) : (
        <button
          onClick={onCallBack}
          className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            isMe
              ? "bg-white/20 hover:bg-white/30 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          Call back
        </button>
      )}
    </div>
  );
};

export default CallHistoryCard;
