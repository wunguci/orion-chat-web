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
    <div className={`grid ${getGridColsClass()} gap-4 p-4 w-full h-full overflow-auto bg-wh-green-bg-medium`}>
      {/* Local stream */}
      {localStream && (
        <div
          className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
            activeParticipantId === localUserId
              ? "border-wh-green-primary ring-2 ring-wh-green-primary"
              : "border-wh-green-border-medium hover:border-wh-green-primary"
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
              ? "border-wh-green-primary ring-2 ring-wh-green-primary"
              : participant.isSpeaking
              ? "border-wh-status-inprogress ring-2 ring-wh-status-inprogress/60"
              : "border-wh-green-border-medium hover:border-wh-green-primary"
          }`}
          onClick={() => onParticipantClick?.(participant.id)}
        >
          {participant.stream ? (
            <RemoteVideoStream stream={participant.stream} />
          ) : (
            <div className="w-full h-full bg-wh-green-bg-heavy flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <FaUser className="text-4xl text-wh-green-text-muted" />
                <p className="text-xs text-wh-green-text-secondary">No video</p>
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
    <div className="absolute inset-0 bg-gradient-to-t from-wh-green-text-primary/90 via-wh-green-text-primary/30 to-transparent pointer-events-none">
      {/* Status badges */}
      <div className="absolute top-2 right-2 flex gap-1.5">
        {isHost && (
          <div className="px-2.5 py-1 bg-wh-status-review/90 rounded-md text-white text-xs font-semibold">
            HOST
          </div>
        )}
        {isSpeaking && (
          <div className="px-2.5 py-1 bg-wh-status-inprogress/90 rounded-md text-white text-xs font-semibold animate-pulse">
            SPEAKING
          </div>
        )}
      </div>

      {/* Name and media status */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-wh-green-primary flex items-center justify-center text-white text-xs font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-white truncate">{displayName}</span>
        </div>
        <div className="flex gap-1.5">
          {isMuted ? (
            <div className="w-6 h-6 rounded-md bg-wh-priority-critical/90 flex items-center justify-center text-white text-xs">
              <FaMicrophoneSlash />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md bg-wh-green-primary/90 flex items-center justify-center text-white text-xs">
              <FaMicrophone />
            </div>
          )}
          {isVideoOff ? (
            <div className="w-6 h-6 rounded-md bg-wh-priority-critical/90 flex items-center justify-center text-white text-xs">
              <FaVideoSlash />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md bg-wh-green-primary-light/90 flex items-center justify-center text-white text-xs">
              <FaVideo />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


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
    <div className="w-full h-full flex flex-col bg-wh-green-bg-medium">
      {/* Main video area */}
      <div className="flex-1 relative rounded-lg overflow-hidden m-4 bg-wh-green-text-primary">
        {mainParticipant?.stream ? (
          <RemoteVideoStream stream={mainParticipant.stream} />
        ) : localStream ? (
          <LocalVideoStream stream={localStream} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaUser className="text-8xl text-wh-green-text-muted" />
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
      <div className="h-24 bg-wh-green-text-primary/70 px-4 py-2 flex items-center gap-3 overflow-x-auto">
        {localStream && (
          <div
            className="w-20 h-20 rounded-lg overflow-hidden border-2 border-wh-green-border-medium flex-shrink-0 cursor-pointer hover:border-wh-green-primary transition-colors"
            onClick={() => onParticipantClick?.(localUserId)}
          >
            <LocalVideoStream stream={localStream} />
          </div>
        )}
        {otherParticipants.map((participant) => (
          <div
            key={participant.id}
            className="w-20 h-20 rounded-lg overflow-hidden border-2 border-wh-green-border-medium flex-shrink-0 cursor-pointer hover:border-wh-green-primary transition-colors"
            onClick={() => onParticipantClick?.(participant.id)}
          >
            {participant.stream ? (
              <RemoteVideoStream stream={participant.stream} />
            ) : (
              <div className="w-full h-full bg-wh-green-bg-heavy flex items-center justify-center">
                <FaUser className="text-xl text-wh-green-text-muted" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
