import React, { useEffect, useRef } from "react";
import { FaUser, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from "react-icons/fa";
import type { GroupCallParticipant } from "../../types/call";

interface GroupCallVideoGridProps {
  participants: GroupCallParticipant[];
  localStream: MediaStream | null;
  localUserId: string;
  localVideoEnabled: boolean;
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
  localVideoEnabled,
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
    <div
      className={`grid ${getGridColsClass()} gap-4 p-4 w-full h-full overflow-auto`}
    >
      {/* Local stream */}
      {localStream && (
        <div
          className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer ${
            activeParticipantId === localUserId
              ? "border-[color:var(--gc-accent)]"
              : "border-[color:var(--gc-border)] hover:border-[color:var(--gc-accent)]"
          }`}
          onClick={() => onParticipantClick?.(localUserId)}
        >
          {localVideoEnabled && localStream.getVideoTracks().length ? (
            <LocalVideoStream stream={localStream} />
          ) : (
            <div className="w-full h-full bg-[color:var(--gc-surface)] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <FaUser className="text-3xl text-[color:var(--gc-muted)]" />
                <p className="text-xs text-[color:var(--gc-muted)]">Camera off</p>
              </div>
            </div>
          )}
          <VideoInfo
            name="You"
            isMuted={false}
            isVideoOff={!localVideoEnabled}
            isHost
          />
        </div>
      )}

      {/* Remote participants */}
      {participants.map((participant) => (
        <div
          key={participant.id}
          className={`relative rounded-xl overflow-hidden border transition-all cursor-pointer ${
            activeParticipantId === participant.id
              ? "border-[color:var(--gc-accent)]"
              : "border-[color:var(--gc-border)] hover:border-[color:var(--gc-accent)]"
          }`}
          onClick={() => onParticipantClick?.(participant.id)}
        >
          {participant.stream ? (
            <>
              <RemoteAudioStream stream={participant.stream} />
              {participant.isVideoEnabled ? (
                <RemoteVideoStream stream={participant.stream} />
              ) : (
                <div className="w-full h-full bg-[color:var(--gc-surface)] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <FaUser className="text-3xl text-[color:var(--gc-muted)]" />
                    <p className="text-xs text-[color:var(--gc-muted)]">Camera off</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-[color:var(--gc-surface)] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <FaUser className="text-3xl text-[color:var(--gc-muted)]" />
                <p className="text-xs text-[color:var(--gc-muted)]">No video</p>
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
  const videoTrackId = stream.getVideoTracks()[0]?.id;

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
        if (err instanceof DOMException && err.name === "AbortError") {
          console.log("[LocalVideoStream] Play aborted (expected when stream changes)");
          return;
        }

        console.warn("[LocalVideoStream] Autoplay blocked, retrying muted", err);
        video.muted = true;
        try {
          playPromiseRef.current = video.play();
          await playPromiseRef.current;
        } catch (err2) {
          console.error("[LocalVideoStream] Play error:", err2);
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
  }, [stream, videoTrackId]);

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
  const videoTrackId = stream.getVideoTracks()[0]?.id;
  const audioTrackId = stream.getAudioTracks()[0]?.id;

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
        if (err instanceof DOMException && err.name === "AbortError") {
          console.log("[RemoteVideoStream] Play aborted (expected when stream changes)");
          return;
        }

        console.warn("[RemoteVideoStream] Autoplay blocked, retrying muted", err);
        video.muted = true;
        try {
          playPromiseRef.current = video.play();
          await playPromiseRef.current;
          setTimeout(() => {
            video.muted = false;
          }, 100);
        } catch (err2) {
          console.error("[RemoteVideoStream] Play error:", err2);
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
  }, [stream, videoTrackId, audioTrackId]);

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
 * RemoteAudioStream Component
 */
const RemoteAudioStream: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioTrackId = stream.getAudioTracks()[0]?.id;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setupStream = async () => {
      try {
        audio.srcObject = stream;
        await audio.play();
      } catch (err) {
        console.warn("[RemoteAudioStream] Autoplay blocked", err);
      }
    };

    setupStream();

    return () => {
      if (audio.srcObject === stream) {
        audio.srcObject = null;
      }
    };
  }, [stream, audioTrackId]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
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
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between bg-black/45">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[color:var(--gc-surface)] border border-[color:var(--gc-border)] flex items-center justify-center text-[color:var(--gc-text)] text-xs font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-[color:var(--gc-text)] truncate">
            {displayName}
          </span>
          {isHost ? (
            <span className="text-[10px] text-[color:var(--gc-muted)]">Host</span>
          ) : null}
          {isSpeaking ? (
            <span className="text-[10px] text-[color:var(--gc-muted)]">Speaking</span>
          ) : null}
        </div>
        <div className="flex gap-1.5 text-[color:var(--gc-text)]">
          {isMuted ? (
            <div className="w-6 h-6 rounded-md border border-[color:var(--gc-border)] flex items-center justify-center text-xs text-[color:var(--gc-danger)]">
              <FaMicrophoneSlash />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md border border-[color:var(--gc-border)] flex items-center justify-center text-xs">
              <FaMicrophone />
            </div>
          )}
          {isVideoOff ? (
            <div className="w-6 h-6 rounded-md border border-[color:var(--gc-border)] flex items-center justify-center text-xs text-[color:var(--gc-danger)]">
              <FaVideoSlash />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md border border-[color:var(--gc-border)] flex items-center justify-center text-xs">
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
    <div className="w-full h-full flex flex-col">
      {/* Main video area */}
      <div className="flex-1 relative rounded-xl overflow-hidden m-4 bg-[color:var(--gc-surface)] border border-[color:var(--gc-border)]">
        {mainParticipant?.stream ? (
          <RemoteVideoStream stream={mainParticipant.stream} />
        ) : localStream ? (
          <LocalVideoStream stream={localStream} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaUser className="text-7xl text-[color:var(--gc-muted)]" />
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
      <div className="h-24 px-4 py-2 flex items-center gap-3 overflow-x-auto border-t border-[color:var(--gc-border)] bg-[color:var(--gc-surface)]/70">
        {localStream && (
          <div
            className="w-20 h-20 rounded-lg overflow-hidden border border-[color:var(--gc-border)] flex-shrink-0 cursor-pointer hover:border-[color:var(--gc-accent)] transition-colors"
            onClick={() => onParticipantClick?.(localUserId)}
          >
            <LocalVideoStream stream={localStream} />
          </div>
        )}
        {otherParticipants.map((participant) => (
          <div
            key={participant.id}
            className="w-20 h-20 rounded-lg overflow-hidden border border-[color:var(--gc-border)] flex-shrink-0 cursor-pointer hover:border-[color:var(--gc-accent)] transition-colors"
            onClick={() => onParticipantClick?.(participant.id)}
          >
            {participant.stream ? (
              <RemoteVideoStream stream={participant.stream} />
            ) : (
              <div className="w-full h-full bg-[color:var(--gc-surface)] flex items-center justify-center">
                <FaUser className="text-xl text-[color:var(--gc-muted)]" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
