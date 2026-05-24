import { useMemo } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaUser } from "react-icons/fa";
import { FiCamera, FiCameraOff } from "react-icons/fi";
import { MdCallEnd } from "react-icons/md";
import { useGroupCallContext } from "../../hooks/useGroupCallContext";
import { CallTimer } from "./CallTimer";
import { GroupCallVideoGrid } from "./GroupCallVideoGrid";
import { useAuth } from "../../hooks/useAuth";

const getInitials = (name?: string) => {
  const trimmed = (name || "").trim();
  if (!trimmed) return "U";
  return trimmed
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join("");
};

export const GroupCallModal: React.FC = () => {
  const { user } = useAuth();
  const {
    status,
    localStream,
    participants,
    callType,
    isVideoEnabled,
    isAudioEnabled,
    startTime,
    error,
    activeParticipantId,
    toggleAudio,
    toggleVideo,
    leaveGroupCall,
    setActiveParticipant,
  } = useGroupCallContext();

  const localUserId = user?.id || user?.userId || "N/A";

  const activeParticipants = useMemo(
    () => participants.filter((participant) => participant.stream),
    [participants],
  );

  if (status === "idle") {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-wh-green-text-primary z-50">
      <div className="relative w-full h-full">
        {activeParticipants.length > 0 || localStream ? (
          <div className="absolute inset-0 px-6 pt-6 pb-24">
            <GroupCallVideoGrid
              participants={activeParticipants}
              localStream={localStream}
              localUserId={localUserId}
              localVideoEnabled={isVideoEnabled}
              onParticipantClick={setActiveParticipant}
              activeParticipantId={activeParticipantId}
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-wh-green-bg-medium">
            <div className="w-32 h-32 rounded-full bg-wh-green-bg-heavy flex items-center justify-center mb-4">
              <FaUser className="text-6xl text-wh-green-text-muted" />
            </div>
            <h2 className="text-wh-green-text-primary text-2xl mb-2">
              Group call
            </h2>
            <p className="text-wh-green-text-secondary">
              {status === "calling" && "Calling..."}
              {status === "ringing" && "Connecting..."}
              {status === "connected" && "Connected"}
              {status === "failed" && (error || "Connection failed")}
            </p>
          </div>
        )}

        {status === "connected" && startTime && (
          <div className="absolute top-4 left-4 bg-wh-green-text-primary/80 px-4 py-2 rounded-lg border border-wh-green-border-dark">
            <CallTimer startTime={startTime} />
          </div>
        )}

        {activeParticipants.length > 0 && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-2 bg-wh-green-text-primary/70 px-4 py-2 rounded-full border border-wh-green-border-light backdrop-blur-sm">
            {activeParticipants.map((participant) => (
              <button
                key={participant.id}
                onClick={() => setActiveParticipant(participant.id)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border ${
                  activeParticipantId === participant.id
                    ? "border-wh-green-primary text-white"
                    : "border-wh-green-border-light text-wh-green-text-secondary"
                }`}
                title={participant.name}
              >
                {getInitials(participant.name)}
              </button>
            ))}
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-wh-green-bg-light/90 px-6 py-4 rounded-full backdrop-blur-sm border border-wh-green-border-light">
          <button
            onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
              isAudioEnabled
                ? "bg-wh-green-primary hover:bg-wh-green-primary-hover"
                : "bg-wh-priority-critical hover:bg-wh-priority-high"
            }`}
            title={isAudioEnabled ? "Mute" : "Unmute"}
          >
            <span className="text-white text-xl">
              {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </span>
          </button>

          {callType === "video" && (
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
                isVideoEnabled
                  ? "bg-wh-green-primary hover:bg-wh-green-primary-hover"
                  : "bg-wh-priority-critical hover:bg-wh-priority-high"
              }`}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              <span className="text-white text-xl">
                {isVideoEnabled ? <FiCamera /> : <FiCameraOff />}
              </span>
            </button>
          )}

          <button
            onClick={leaveGroupCall}
            className="w-14 h-14 rounded-full bg-wh-priority-critical hover:bg-wh-priority-high flex items-center justify-center transition"
            title="End call"
          >
            <MdCallEnd className="text-white text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
};
