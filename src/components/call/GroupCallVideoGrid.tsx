import React, { useEffect, useRef } from "react";
import { FaUser, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from "react-icons/fa";
import type { GroupCallParticipant } from "../../types/call";

interface GroupCallVideoGridProps {
  participants: GroupCallParticipant[];
  localStream: MediaStream | null;
  localUserId: string;
  onParticipantClick?: (userId: string) => void;
  activeParticipantId?: string;
}

/**
 * GroupCallVideoGrid
 * Hiển thị video grid cho tất cả participants trong group call
 */
export const GroupCallVideoGrid: React.FC<GroupCallVideoGridProps> = ({
  participants,
  localStream,
  localUserId,
  onParticipantClick,
  activeParticipantId,
}) => {
  // Tính toán grid layout
  const totalParticipants = participants.length + (localStream ? 1 : 0);
  const getGridColsClass = (): string => {
    if (totalParticipants <= 2) return "grid-cols-1 sm:grid-cols-2";
    if (totalParticipants <= 4) return "grid-cols-2";
    if (totalParticipants <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  return (
    <div className={`grid ${getGridColsClass()} gap-4 p-4 w-full h-full overflow-auto bg-gray-900`}>
      {/* Local stream */}
      {localStream && (
        <div
          className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
            activeParticipantId === localUserId
              ? "border-green-500 shadow-lg shadow-green-500/50 ring-2 ring-green-500"
              : "border-gray-600 hover:border-gray-400"
          }`}
          onClick={() => onParticipantClick?.(localUserId)}
        >
          <LocalVideoStream stream={localStream} />
          <VideoInfo name="You (Local)" isMuted={false} isVideoOff={false} isHost />
        </div>
      )}

      {/* Remote participants */}
      {participants.map((participant) => (
        <div
          key={participant.id}
          className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
            activeParticipantId === participant.id
              ? "border-green-500 shadow-lg shadow-green-500/50 ring-2 ring-green-500"
              : participant.isSpeaking
              ? "border-blue-500 shadow-lg shadow-blue-500/30"
              : "border-gray-600 hover:border-gray-400"
          }`}
          onClick={() => onParticipantClick?.(participant.id)}
        >
          {participant.stream ? (
            <RemoteVideoStream stream={participant.stream} />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <FaUser className="text-4xl text-gray-600" />
                <p className="text-xs text-gray-400">No video</p>
              </div>
            </div>
          )}
          <VideoInfo
            name={participant.name}
            isMuted={!participant.isAudioEnabled}
            isVideoOff={!participant.isVideoEnabled}
            isHost={participant.isHost}
            isSpeaking={participant.isSpeaking}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * LocalVideoStream Component
 */
const LocalVideoStream: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    const setupStream = async () => {
      try {
        // Abort previous play attempt if pending
        if (playPromiseRef.current) {
          await playPromiseRef.current.catch(() => {
            // Ignore abort errors
          });
        }

        // Assign new stream
        video.srcObject = stream;
        video.muted = true;

        // Play and store promise
        playPromiseRef.current = video.play();
        await playPromiseRef.current;
        console.log("[LocalVideoStream] Playing stream successfully");
      } catch (err) {
        // Ignore AbortError from previous play attempts
        if (err instanceof DOMException && err.name === "AbortError") {
          console.log("[LocalVideoStream] Play aborted (expected when stream changes)");
        } else {
          console.error("[LocalVideoStream] Play error:", err);
        }
      }
    };

    setupStream();

    return () => {
      // Cleanup: stop stream on unmount
      if (video.srcObject === stream) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover"
    />
  );
};

/**
 * RemoteVideoStream Component
 */
const RemoteVideoStream: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    const setupStream = async () => {
      try {
        // Abort previous play attempt if pending
        if (playPromiseRef.current) {
          await playPromiseRef.current.catch(() => {
            // Ignore abort errors
          });
        }

        // Assign new stream
        video.srcObject = stream;

        // Play and store promise
        playPromiseRef.current = video.play();
        await playPromiseRef.current;
        console.log("[RemoteVideoStream] Playing stream successfully");
      } catch (err) {
        // Ignore AbortError from previous play attempts
        if (err instanceof DOMException && err.name === "AbortError") {
          console.log("[RemoteVideoStream] Play aborted (expected when stream changes)");
        } else {
          console.error("[RemoteVideoStream] Play error:", err);
        }
      }
    };

    setupStream();

    return () => {
      // Cleanup: stop stream on unmount
      if (video.srcObject === stream) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
};

/**
 * VideoInfo Overlay Component
 */
interface VideoInfoProps {
  name: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isHost?: boolean;
  isSpeaking?: boolean;
}

const VideoInfo: React.FC<VideoInfoProps> = ({
  name,
  isMuted,
  isVideoOff,
  isHost,
  isSpeaking,
}) => {
  const displayName = (name || "").trim() || "User";

  return (
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none">
      {/* Status badges */}
      <div className="absolute top-2 right-2 flex gap-1.5">
        {isHost && (
          <div className="px-2.5 py-1 bg-yellow-500/80 rounded-md text-white text-xs font-semibold">
            HOST
          </div>
        )}
        {isSpeaking && (
          <div className="px-2.5 py-1 bg-green-500/80 rounded-md text-white text-xs font-semibold animate-pulse">
            SPEAKING
          </div>
        )}
      </div>

      {/* Name and media status */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-white truncate">{displayName}</span>
        </div>
        <div className="flex gap-1.5">
          {isMuted ? (
            <div className="w-6 h-6 rounded-md bg-red-500/80 flex items-center justify-center text-white text-xs">
              <FaMicrophoneSlash />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md bg-green-500/80 flex items-center justify-center text-white text-xs">
              <FaMicrophone />
            </div>
          )}
          {isVideoOff ? (
            <div className="w-6 h-6 rounded-md bg-red-500/80 flex items-center justify-center text-white text-xs">
              <FaVideoSlash />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md bg-blue-500/80 flex items-center justify-center text-white text-xs">
              <FaVideo />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * GroupCallSpeakerView Component
 * Hiển thị một participant lớn ở giữa + danh sách nhỏ ở dưới
 */
interface GroupCallSpeakerViewProps {
  mainParticipant: GroupCallParticipant | null;
  localStream: MediaStream | null;
  localUserId: string;
  otherParticipants: GroupCallParticipant[];
  onParticipantClick?: (userId: string) => void;
}

export const GroupCallSpeakerView: React.FC<GroupCallSpeakerViewProps> = ({
  mainParticipant,
  localStream,
  localUserId,
  otherParticipants,
  onParticipantClick,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Main video area */}
      <div className="flex-1 relative rounded-lg overflow-hidden m-4 bg-black">
        {mainParticipant?.stream ? (
          <RemoteVideoStream stream={mainParticipant.stream} />
        ) : localStream ? (
          <LocalVideoStream stream={localStream} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaUser className="text-8xl text-gray-600" />
          </div>
        )}
        {mainParticipant && (
          <VideoInfo
            name={mainParticipant.name}
            isMuted={!mainParticipant.isAudioEnabled}
            isVideoOff={!mainParticipant.isVideoEnabled}
            isHost={mainParticipant.isHost}
            isSpeaking={mainParticipant.isSpeaking}
          />
        )}
      </div>

      {/* Thumbnail carousel */}
      <div className="h-24 bg-black/50 px-4 py-2 flex items-center gap-3 overflow-x-auto">
        {localStream && (
          <div
            className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-600 flex-shrink-0 cursor-pointer hover:border-green-500 transition-colors"
            onClick={() => onParticipantClick?.(localUserId)}
          >
            <LocalVideoStream stream={localStream} />
          </div>
        )}
        {otherParticipants.map((participant) => (
          <div
            key={participant.id}
            className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-600 flex-shrink-0 cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => onParticipantClick?.(participant.id)}
          >
            {participant.stream ? (
              <RemoteVideoStream stream={participant.stream} />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <FaUser className="text-xl text-gray-600" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
