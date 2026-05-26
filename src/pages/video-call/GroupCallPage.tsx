import { Mic, MicOff, PhoneOff, Users, Video, VideoOff } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { StreamCallView } from "../../components/call/StreamCallView";
import { useAuth } from "../../hooks/useAuth";
import { useGroupCallContext } from "../../hooks/useGroupCallContext";

const statusText: Record<string, string> = {
  idle: "Idle",
  calling: "Calling...",
  ringing: "Ringing...",
  connected: "Connected",
  ended: "Call ended",
  rejected: "Call rejected",
  failed: "Call failed",
};

const getInitials = (name?: string) =>
  (name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

function MediaTile({
  name,
  stream,
  isLocal,
  isVideoEnabled,
  isAudioEnabled,
  isHost,
  callType,
  active,
  onClick,
}: {
  name: string;
  stream?: MediaStream | null;
  isLocal?: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isHost?: boolean;
  callType: "audio" | "video";
  active?: boolean;
  onClick?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const showVideo = callType === "video" && Boolean(stream) && isVideoEnabled;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.play().catch((error) => {
      console.warn("[GroupCallPage] Media autoplay blocked:", error);
    });
  }, [stream]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-0 overflow-hidden rounded-lg border bg-neutral-900 text-left ${
        active ? "border-emerald-400" : "border-white/10"
      }`}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={showVideo ? "h-full w-full object-cover" : "hidden"}
        />
      ) : null}

      {!showVideo ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15 text-xl font-semibold text-emerald-100">
            {getInitials(name)}
          </div>
          <div className="mt-3 text-sm text-white/60">
            {stream ? "Camera off" : "Waiting for media"}
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 rounded-full bg-black/60 px-3 py-1.5">
          <span className="truncate text-sm font-medium text-white">{name}</span>
          {isHost ? (
            <span className="text-xs font-medium text-emerald-300">Host</span>
          ) : null}
        </div>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/60">
          {isAudioEnabled ? (
            <Mic size={16} className="text-emerald-200" />
          ) : (
            <MicOff size={16} className="text-red-300" />
          )}
        </div>
      </div>
    </button>
  );
}

const GroupCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const call = useGroupCallContext();
  const currentUserId = user?.userId || user?.id || "";
  const conversationId = call.conversationId;
  const memberIds = [
    currentUserId,
    ...call.participants.map((participant) => participant.id),
  ].filter(Boolean) as string[];

  const tiles = useMemo(
    () => [
      {
        id: "local",
        name: "You",
        stream: call.localStream,
        isLocal: true,
        isVideoEnabled: call.isVideoEnabled,
        isAudioEnabled: call.isAudioEnabled,
        isHost: call.isHost,
      },
      ...call.participants.map((participant) => ({
        id: participant.id,
        name: participant.name,
        stream: participant.stream,
        isLocal: false,
        isVideoEnabled: participant.isVideoEnabled,
        isAudioEnabled: participant.isAudioEnabled,
        isHost: participant.isHost,
      })),
    ],
    [
      call.localStream,
      call.isVideoEnabled,
      call.isAudioEnabled,
      call.isHost,
      call.participants,
    ],
  );

  if (!conversationId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-semibold">No active group call</h1>
          <button
            onClick={() => navigate("/chat")}
            className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-white"
          >
            Back to chat
          </button>
        </div>
      </div>
    );
  }

  const fallback = (
    <div className="flex h-screen w-screen flex-col bg-neutral-950 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-emerald-300" />
            <h1 className="truncate text-lg font-semibold">
              Group {call.callType === "video" ? "Video" : "Audio"} Call
            </h1>
          </div>
          <p className="mt-1 text-sm text-white/60">
            {statusText[call.status] || call.status} · {tiles.length} members
          </p>
          {call.error ? (
            <p className="mt-1 text-sm text-red-300">{call.error}</p>
          ) : null}
        </div>
      </header>

      <main className="grid flex-1 min-h-0 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <MediaTile
            key={tile.id}
            {...tile}
            callType={call.callType}
            active={call.activeParticipantId === tile.id}
            onClick={() => call.setActiveParticipant(tile.id)}
          />
        ))}
      </main>

      <footer className="flex items-center justify-center gap-3 border-t border-white/10 px-5 py-5">
        <button
          type="button"
          onClick={call.toggleAudio}
          className={`grid h-12 w-12 place-items-center rounded-full ${
            call.isAudioEnabled ? "bg-neutral-800" : "bg-amber-600"
          }`}
          title={call.isAudioEnabled ? "Mute" : "Unmute"}
        >
          {call.isAudioEnabled ? <Mic size={21} /> : <MicOff size={21} />}
        </button>

        {call.callType === "video" ? (
          <button
            type="button"
            onClick={call.toggleVideo}
            className={`grid h-12 w-12 place-items-center rounded-full ${
              call.isVideoEnabled ? "bg-neutral-800" : "bg-amber-600"
            }`}
            title={call.isVideoEnabled ? "Stop video" : "Start video"}
          >
            {call.isVideoEnabled ? <Video size={21} /> : <VideoOff size={21} />}
          </button>
        ) : null}

        <button
          type="button"
          onClick={call.leaveGroupCall}
          className="grid h-12 w-12 place-items-center rounded-full bg-red-600"
          title="Leave call"
        >
          <PhoneOff size={21} />
        </button>
      </footer>
    </div>
  );

  return (
    <StreamCallView
      conversationId={conversationId}
      mode="group"
      title="Group video call"
      memberIds={memberIds}
      custom={{
        signalingCallId: call.callId,
        callType: call.callType,
      }}
      onLeave={call.leaveGroupCall}
      fallback={fallback}
    />
  );
};

export default GroupCallPage;
