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
  const remoteParticipants = participants.filter(
    (participant) => participant.id !== localUserId,
  );

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
      navigate("/");
    }
  };

  // Get main participant for speaker view
  const mainParticipant = activeParticipantId
    ? activeParticipantId === localUserId
      ? null
      : remoteParticipants.find((p) => p.id === activeParticipantId) ||
        remoteParticipants[0] ||
        null
    : remoteParticipants[0] || null;

  const speakerOtherParticipants = mainParticipant
    ? remoteParticipants.filter((p) => p.id !== mainParticipant.id)
    : remoteParticipants;

  if (status === "idle" && !callId) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-4xl text-gray-600 mb-4">📞</div>
          <h1 className="text-2xl font-bold text-white mb-2">No Active Call</h1>
          <p className="text-gray-400 mb-6">Start or join a group call to begin</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-4xl text-red-600 mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Call Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-black overflow-hidden">
      {/* Header */}
      <div
        className={`absolute top-0 left-0 right-0 px-6 py-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex justify-between items-center z-40 transition-all duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">Group Video Call</h1>
          <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-sm text-white/90 border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>{callDuration}</span>
          </div>
          <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-sm text-white/90 border border-white/10">
            {remoteParticipants.length + 1} participants
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === "grid"
                ? "bg-blue-600 shadow-lg shadow-blue-600/50 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode("speaker")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === "speaker"
                ? "bg-blue-600 shadow-lg shadow-blue-600/50 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
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
            participants={remoteParticipants}
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
        className={`absolute bottom-0 left-0 right-0 px-8 py-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex justify-center items-center gap-4 z-40 transition-all duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Mic Toggle */}
        <button
          onClick={toggleAudio}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-xl hover:scale-110 ${
            !isAudioEnabled
              ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/50 text-white"
              : "bg-white/15 hover:bg-white/25 border border-white/30 text-white"
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
              ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/50 text-white"
              : "bg-white/15 hover:bg-white/25 border border-white/30 text-white"
          }`}
          title={isVideoEnabled ? "Turn Off Video" : "Turn On Video"}
        >
          {isVideoEnabled ? (
            <FaVideo className="text-lg" />
          ) : (
            <FaVideoSlash className="text-lg" />
          )}
        </button>

        <div className="h-10 w-px bg-white/20"></div>

        {/* End Call */}
        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all hover:scale-110 hover:shadow-2xl hover:shadow-red-600/50"
          title="Leave Call"
        >
          <FaPhone className="text-xl" />
        </button>

        <div className="h-10 w-px bg-white/20"></div>

        {/* Participants */}
        <button className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white flex items-center justify-center transition-all hover:scale-110 relative">
          <FaUsers className="text-lg" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full text-xs font-bold flex items-center justify-center text-white border-2 border-black">
            {participants.length + 1}
          </span>
        </button>

        {/* Chat */}
        <button className="w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white flex items-center justify-center transition-all hover:scale-110">
          <FaComment className="text-lg" />
        </button>
      </div>
    </div>
  );
};

export default GroupCallPage;
