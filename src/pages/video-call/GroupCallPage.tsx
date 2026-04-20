import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGroupCallContext } from "../../hooks/useGroupCallContext";
import { GroupCallVideoGrid, GroupCallSpeakerView } from "../../components/call/GroupCallVideoGrid";
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaPhone, FaUsers, FaComment } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";

type ViewMode = "grid" | "speaker";

/**
 * GroupCallPage
 * Hiển thị giao diện group video call
 */
const GroupCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    callId,
    status,
    localStream,
    participants,
    isAudioEnabled,
    isVideoEnabled,
    error,
    startTime,
    activeParticipantId,
    toggleAudio,
    toggleVideo,
    leaveGroupCall,
    setActiveParticipant,
  } = useGroupCallContext();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [callDuration, setCallDuration] = useState("00:00:00");
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localUserId = user?.id || user?.userId || "N/A";
  const joinedParticipants = participants.filter(
    (participant) => participant.id !== localUserId && participant.stream,
  );
  const joinedCount = joinedParticipants.length + (localStream ? 1 : 0);

  // Update call duration
  useEffect(() => {
    if (!startTime || status !== "connected") return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(elapsed / 3600)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((elapsed % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (elapsed % 60).toString().padStart(2, "0");
      setCallDuration(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, status]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  const handleEndCall = () => {
    if (window.confirm("Are you sure you want to leave this group call?")) {
      leaveGroupCall();
      navigate("/chat");
    }
  };

  // Get main participant for speaker view
  const mainParticipant = activeParticipantId
    ? activeParticipantId === localUserId
      ? null
      : joinedParticipants.find((p) => p.id === activeParticipantId) ||
        joinedParticipants[0] ||
        null
    : joinedParticipants[0] || null;

  const speakerOtherParticipants = mainParticipant
    ? joinedParticipants.filter((p) => p.id !== mainParticipant.id)
    : joinedParticipants;

  if (status === "idle" && !callId) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-wh-green-bg-light">
        <div className="text-center">
          <div className="text-4xl text-wh-green-text-muted mb-4">📞</div>
          <h1 className="text-2xl font-bold text-wh-green-text-primary mb-2">No Active Call</h1>
          <p className="text-wh-green-text-secondary mb-6">Start or join a group call to begin</p>
          <button
            onClick={() => navigate("/chat")}
            className="px-6 py-3 bg-wh-green-primary hover:bg-wh-green-primary-hover text-white rounded-lg font-semibold transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-wh-green-bg-light">
        <div className="text-center">
          <div className="text-4xl text-wh-priority-critical mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-wh-green-text-primary mb-2">Call Error</h1>
          <p className="text-wh-green-text-secondary mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-wh-green-primary hover:bg-wh-green-primary-hover text-white rounded-lg font-semibold transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-wh-green-text-primary overflow-hidden">
      {/* Header */}
      <div
        className={`absolute top-0 left-0 right-0 px-6 py-4 bg-gradient-to-b from-wh-green-text-primary/95 via-wh-green-text-primary/70 to-transparent flex justify-between items-center z-40 transition-all duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">Group Video Call</h1>
          <div className="px-3 py-1.5 bg-wh-green-bg-light/95 backdrop-blur-sm rounded-lg text-sm text-wh-green-text-primary border border-wh-green-border-light flex items-center gap-2">
            <div className="w-2 h-2 bg-wh-green-primary rounded-full animate-pulse"></div>
            <span className="font-semibold">{callDuration}</span>
          </div>
          <div className="px-3 py-1.5 bg-wh-green-bg-light/95 backdrop-blur-sm rounded-lg text-sm text-wh-green-text-primary border border-wh-green-border-light">
            {joinedCount} participants
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === "grid"
                ? "bg-wh-green-primary text-white"
                : "bg-wh-green-bg-light text-wh-green-text-secondary hover:bg-wh-green-bg-heavy"
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode("speaker")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === "speaker"
                ? "bg-wh-green-primary text-white"
                : "bg-wh-green-bg-light text-wh-green-text-secondary hover:bg-wh-green-bg-heavy"
            }`}
          >
            Speaker View
          </button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center">
        {viewMode === "grid" ? (
          <GroupCallVideoGrid
            participants={joinedParticipants}
            localStream={localStream}
            localUserId={localUserId}
            onParticipantClick={setActiveParticipant}
            activeParticipantId={activeParticipantId}
          />
        ) : (
          <GroupCallSpeakerView
            mainParticipant={mainParticipant || null}
            localStream={localStream}
            localUserId={localUserId}
            otherParticipants={speakerOtherParticipants}
            onParticipantClick={setActiveParticipant}
          />
        )}
      </div>

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-8 py-6 bg-gradient-to-t from-wh-green-text-primary/95 via-wh-green-text-primary/80 to-transparent flex justify-center items-center gap-4 z-40 transition-all duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Mic Toggle */}
        <button
          onClick={toggleAudio}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-xl hover:scale-110 ${
            !isAudioEnabled
              ? "bg-wh-priority-critical hover:bg-wh-priority-high text-white"
              : "bg-wh-green-primary hover:bg-wh-green-primary-hover text-white"
          }`}
          title={isAudioEnabled ? "Mute Mic" : "Unmute Mic"}
        >
          {isAudioEnabled ? (
            <FaMicrophone className="text-lg" />
          ) : (
            <FaMicrophoneSlash className="text-lg" />
          )}
        </button>

        {/* Video Toggle */}
        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-xl hover:scale-110 ${
            !isVideoEnabled
              ? "bg-wh-priority-critical hover:bg-wh-priority-high text-white"
              : "bg-wh-green-primary hover:bg-wh-green-primary-hover text-white"
          }`}
          title={isVideoEnabled ? "Turn Off Video" : "Turn On Video"}
        >
          {isVideoEnabled ? (
            <FaVideo className="text-lg" />
          ) : (
            <FaVideoSlash className="text-lg" />
          )}
        </button>

        <div className="h-10 w-px bg-wh-green-border-medium"></div>

        {/* End Call */}
        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-wh-priority-critical hover:bg-wh-priority-high text-white flex items-center justify-center transition-all hover:scale-110"
          title="Leave Call"
        >
          <FaPhone className="text-xl" />
        </button>

        <div className="h-10 w-px bg-wh-green-border-medium"></div>

        {/* Participants */}
        <button className="w-14 h-14 rounded-full bg-wh-green-bg-light hover:bg-wh-green-bg-heavy border border-wh-green-border-light text-wh-green-text-primary flex items-center justify-center transition-all hover:scale-110 relative">
          <FaUsers className="text-lg" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-wh-green-primary rounded-full text-xs font-bold flex items-center justify-center text-white border-2 border-wh-green-bg-light">
            {joinedCount}
          </span>
        </button>

        {/* Chat */}
        <button className="w-14 h-14 rounded-full bg-wh-green-bg-light hover:bg-wh-green-bg-heavy border border-wh-green-border-light text-wh-green-text-primary flex items-center justify-center transition-all hover:scale-110">
          <FaComment className="text-lg" />
        </button>
      </div>
    </div>
  );
};

export default GroupCallPage;
