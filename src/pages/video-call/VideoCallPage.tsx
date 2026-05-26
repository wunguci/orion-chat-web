import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { StreamCallView } from "../../components/call/StreamCallView";
import { useAuth } from "../../hooks/useAuth";
import { useCall } from "../../hooks/useCall";

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
  (name || "Friend")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "F";

function StreamVideo({
  stream,
  muted,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  className: string;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    video.play().catch((error) => {
      console.warn("[VideoCallPage] Media autoplay blocked:", error);
    });
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={className}
    />
  );
}

const VideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const call = useCall();
  const currentUserId = user?.userId || user?.id || "";
  const conversationId = call.conversationId;
  const memberIds = [currentUserId, call.otherUser?.id].filter(Boolean) as string[];
  const title = call.otherUser?.name || "Video call";
  const showRemoteVideo =
    call.callType === "video" && call.remoteStream && call.isVideoEnabled;

  if (!conversationId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 px-6 text-white">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-semibold">No active call</h1>
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
    <div className="relative flex h-screen w-screen flex-col bg-neutral-950 text-white">
      <div className="absolute left-0 right-0 top-6 z-20 flex flex-col items-center px-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-white/70">
          {statusText[call.status] || call.status}
        </p>
        {call.error ? (
          <p className="mt-2 text-center text-sm text-red-300">{call.error}</p>
        ) : null}
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {call.remoteStream ? (
          <StreamVideo
            stream={call.remoteStream}
            className={showRemoteVideo ? "h-full w-full object-cover" : "hidden"}
          />
        ) : null}

        {!showRemoteVideo ? (
          <div className="flex flex-col items-center">
            <div className="grid h-28 w-28 place-items-center rounded-full bg-neutral-800 text-3xl font-semibold">
              {getInitials(title)}
            </div>
            <p className="mt-4 text-white/70">
              {call.remoteStream ? "Audio connected" : "Waiting for media..."}
            </p>
          </div>
        ) : null}

        {call.callType === "video" && call.localStream ? (
          <div className="absolute right-5 top-24 h-44 w-32 overflow-hidden rounded-lg border border-white/20 bg-black">
            <StreamVideo
              stream={call.localStream}
              muted
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-3 border-t border-white/10 px-6 py-5">
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
          onClick={call.endCall}
          className="grid h-12 w-12 place-items-center rounded-full bg-red-600"
          title="End call"
        >
          <PhoneOff size={21} />
        </button>
      </div>
    </div>
  );

  return (
    <StreamCallView
      conversationId={conversationId}
      mode="direct"
      title={title}
      memberIds={memberIds}
      custom={{
        signalingCallId: call.callId,
        callType: call.callType,
      }}
      onLeave={call.endCall}
      fallback={fallback}
    />
  );
};

export default VideoCallPage;
