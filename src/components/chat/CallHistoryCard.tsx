import React from 'react';
import { Phone, Video, PhoneOff, Clock } from 'lucide-react';

export interface CallHistoryData {
    callType: 'audio' | 'video';
    callStatus: 'missed' | 'declined' | 'completed';
    duration?: number; // in seconds
    isMe?: boolean;
    isInitiator?: boolean; // Whether the sender initiated the call
}

export const CallHistoryCard: React.FC<CallHistoryData & { onCallBack?: () => void }> = ({
    callType,
    callStatus,
    duration = 0,
    isMe = false,
    onCallBack,
}) => {
  // Định dạng thời lượng: 0 seconds -> "0 phút", 3 seconds -> "0 phút 3 giây", 65 seconds -> "1 phút 5 giây"
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0 && secs === 0) return "0 phút";
    if (mins === 0) return `${secs} giây`;
    if (secs === 0) return `${mins} phút`;
    return `${mins} phút ${secs} giây`;
  };

  // xác định text, màu sắc và icon dựa trên trạng thái cuộc gọi
  const getStatusInfo = () => {
    // Messages are written by caller only.
    // isMe=true  -> caller view
    // isMe=false -> receiver view

    if (callStatus === "completed") {
      return {
        text: `Cuộc gọi ${callType === "video" ? "video" : "thoại"} ${isMe ? "đi" : "đến"}`,
        color: "text-green-500",
        icon: callType === "video" ? Video : Phone,
      };
    }

    if (callStatus === "missed") {
      return {
        text: isMe ? "Bạn đã hủy" : "Bạn bị nhỡ",
        color: "text-red-500",
        icon: PhoneOff,
      };
    }

    // callStatus === "declined": caller sees receiver declined, receiver sees self declined
    if (isMe) {
      return {
        text: "Người nhận từ chối",
        color: "text-orange-500",
        icon: PhoneOff,
      };
    }

    return {
      text: "Bạn đã từ chối",
      color: "text-orange-500",
      icon: PhoneOff,
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div
      className={`w-full px-4 py-2 rounded-xl border ${
        isMe
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

      {/* Call back button */}
      <button
        onClick={onCallBack}
        className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
          isMe
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        Gọi lại
      </button>
    </div>
  );
};

export default CallHistoryCard;
