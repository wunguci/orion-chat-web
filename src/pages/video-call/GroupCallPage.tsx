import { Mic, MicOff, PhoneOff, Users, Video, VideoOff } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { StreamCallView } from "../../components/call/StreamCallView";
import { useAuth } from "../../hooks/useAuth";
import { useGroupCallContext } from "../../hooks/useGroupCallContext";

const statusText: Record<string, string> = {
  idle: "Ready",
  calling: "Calling...",
  ringing: "Ringing...",
  connected: "Connecting...",
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
  avatar,
  stream,
  isLocal,
  isVideoEnabled,
  isAudioEnabled,
  isHost,
  active,
  onClick,
}: {
  name: string;
  avatar?: string;
  stream?: MediaStream | null;
  isLocal?: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isHost?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const showVideo = Boolean(stream) && isVideoEnabled;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.play().catch((error) => {
      console.warn("[GroupCallPage] Media autoplay blocked:", error);
    });

    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-0 overflow-hidden rounded-lg border bg-slate-950 text-left shadow-sm ${
        active ? "border-[var(--chat-primary)]" : "border-slate-200"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--chat-primary-bg)] text-xl font-semibold text-[var(--chat-primary)]">
              {getInitials(name)}
            </div>
          )}
          <div className="mt-3 text-sm text-white/60">
            {stream ? "Camera off" : "Waiting for signal"}
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

  const tiles = useMemo(() => {
    const seenIds = new Set<string>();
    if (currentUserId) {
      seenIds.add(currentUserId);
    }

    const list = [
      {
        id: "local",
        name: "You",
        avatar: user?.avatarUrl || "",
        stream: call.localStream,
        isLocal: true,
        isVideoEnabled: call.isVideoEnabled,
        isAudioEnabled: call.isAudioEnabled,
        isHost: call.isHost,
      }
    ];

    (call.participants || []).forEach((participant) => {
      if (participant.id && participant.id !== currentUserId && !seenIds.has(participant.id)) {
        seenIds.add(participant.id);
        list.push({
          id: participant.id,
          name: participant.name || "Member",
          avatar: participant.avatar || "",
          stream: participant.stream || null,
          isLocal: false,
          isVideoEnabled: !!participant.isVideoEnabled,
          isAudioEnabled: !!participant.isAudioEnabled,
          isHost: !!participant.isHost,
        });
      }
    });

    return list;
  }, [
    call.localStream,
    call.isVideoEnabled,
    call.isAudioEnabled,
    call.isHost,
    call.participants,
    currentUserId,
    user?.avatarUrl,
  ]);

  if (!conversationId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-semibold">No active group call</h1>
          <button
            onClick={() => navigate("/chat")}
            className="mt-4 rounded-lg bg-[var(--chat-primary)] px-4 py-2 font-medium text-white"
          >
            Back to chat
          </button>
        </div>
      </div>
    );
  }

  const fallback = (
    <div className="flex h-screen w-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-[var(--chat-primary)]" />
            <h1 className="truncate text-lg font-semibold">
              Group {call.callType === "video" ? "video" : "voice"} call
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {statusText[call.status] || call.status} · {tiles.length} members
          </p>
          {call.error ? (
            <p className="mt-1 text-sm text-red-600">{call.error}</p>
          ) : null}
        </div>
      </header>

      <main className="grid flex-1 min-h-0 gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <MediaTile
            key={tile.id}
            {...tile}
            active={call.activeParticipantId === tile.id}
            onClick={() => call.setActiveParticipant(tile.id)}
          />
        ))}
      </main>

      <footer className="flex items-center justify-center gap-3 border-t border-slate-200 bg-white px-5 py-5">
        <button
          type="button"
          onClick={call.toggleAudio}
          className={`grid h-12 w-12 place-items-center rounded-full ${
            call.isAudioEnabled ? "bg-slate-100 text-slate-700" : "bg-amber-500 text-white"
          }`}
          title={call.isAudioEnabled ? "Mute mic" : "Unmute mic"}
        >
          {call.isAudioEnabled ? <Mic size={21} /> : <MicOff size={21} />}
        </button>

        <button
          type="button"
          onClick={call.toggleVideo}
          className={`grid h-12 w-12 place-items-center rounded-full ${
            call.isVideoEnabled ? "bg-slate-100 text-slate-700" : "bg-amber-500 text-white"
          }`}
          title={call.isVideoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {call.isVideoEnabled ? <Video size={21} /> : <VideoOff size={21} />}
        </button>

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
      title="Group call"
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
