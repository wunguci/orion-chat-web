import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
interface Participant {
  id: string;
  name: string;
  avatar: string;
  avatarBg: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking?: boolean;
  isHost?: boolean;
  status?: string;
}

interface ChatMessage {
  id: string;
  author: string;
  avatar: string;
  avatarBg: string;
  time: string;
  text: string;
}

const VideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [recording, setRecording] = useState(false);
  const [currentView, setCurrentView] = useState<"1-1" | "grid">("1-1");
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [participantsPanelOpen, setParticipantsPanelOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [callDuration, setCallDuration] = useState("00:00:00");
  const [notification, setNotification] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState("");

  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const callStartTimeRef = useRef(Date.now());

  // Mock data
  const participants: Participant[] = [
    {
      id: "1",
      name: "John Doe",
      avatar: "JD",
      avatarBg: "#80a1ba",
      isMuted: false,
      isVideoOff: false,
      isHost: true,
      status: "Host",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      avatar: "SJ",
      avatarBg: "#ec4899",
      isMuted: false,
      isVideoOff: false,
      isSpeaking: true,
      status: "Speaking...",
    },
    {
      id: "3",
      name: "Michael Chen",
      avatar: "MC",
      avatarBg: "#f59e0b",
      isMuted: true,
      isVideoOff: false,
      status: "Muted",
    },
    {
      id: "4",
      name: "You",
      avatar: "YO",
      avatarBg: "#10b981",
      isMuted: false,
      isVideoOff: false,
      status: "Active",
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      author: "John Doe",
      avatar: "JD",
      avatarBg: "#80a1ba",
      time: "2:30 PM",
      text: "Hey everyone! Ready to start the meeting?",
    },
    {
      id: "2",
      author: "Sarah Johnson",
      avatar: "SJ",
      avatarBg: "#ec4899",
      time: "2:31 PM",
      text: "Yes, let's go through the project updates first",
    },
    {
      id: "3",
      author: "Michael Chen",
      avatar: "MC",
      avatarBg: "#f59e0b",
      time: "2:32 PM",
      text: "I'll share my screen to show the latest designs",
    },
  ]);

  // Call duration timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - callStartTimeRef.current) / 1000,
      );
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
  }, []);

  // Auto-hide controls
  const handleMouseMove = () => {
    setControlsVisible(true);

    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    hideControlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  // Show notification
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Handlers
  const toggleMic = () => {
    setMicEnabled(!micEnabled);
  };

  const toggleVideo = () => {
    setVideoEnabled(!videoEnabled);
  };

  const toggleScreenShare = () => {
    showNotification("Screen sharing started");
  };

  const toggleRecording = () => {
    setRecording(!recording);
    showNotification(recording ? "Recording stopped" : "Recording started");
  };

  const switchView = (view: "1-1" | "grid") => {
    setCurrentView(view);
  };

  const togglePanel = (panel: "chat" | "participants") => {
    if (panel === "chat") {
      setChatPanelOpen(!chatPanelOpen);
      setParticipantsPanelOpen(false);
    } else {
      setParticipantsPanelOpen(!participantsPanelOpen);
      setChatPanelOpen(false);
    }
  };

  const raiseHand = () => {
    showNotification("You raised your hand");
  };

  const endCall = () => {
    if (window.confirm("Are you sure you want to leave this call?")) {
      navigate("/work-hub");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        author: "You",
        avatar: "YO",
        avatarBg: "#10b981",
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        text: chatMessage,
      };
      setMessages([...messages, newMessage]);
      setChatMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col relative bg-black overflow-hidden">
      {/* Header */}
      <div
        className={`absolute top-0 left-0 right-0 px-8 py-5 bg-gradient-to-b from-slate-900/95 to-transparent flex justify-between items-center z-[100] transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-[#fff7dd]">
            Meeting with Sarah Johnson
          </h3>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#80a1ba]/20 rounded-full text-sm text-[#fff7dd]">
            <i className="fas fa-clock"></i>
            <span>{callDuration}</span>
          </div>
          {recording && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500 rounded-full text-xs text-red-500 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span>Recording</span>
            </div>
          )}
        </div>
        <div className="flex gap-2.5">
          <button
            className="w-10 h-10 rounded-lg bg-[#80a1ba]/20 border border-[#80a1ba]/30 text-[#fff7dd] flex items-center justify-center hover:bg-[#91c4c3]/15 hover:border-[#80a1ba] hover:scale-105 transition-all backdrop-blur-[10px]"
            title="Settings"
          >
            <i className="fas fa-cog"></i>
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-lg bg-[#80a1ba]/20 border border-[#80a1ba]/30 text-[#fff7dd] flex items-center justify-center hover:bg-[#91c4c3]/15 hover:border-[#80a1ba] hover:scale-105 transition-all backdrop-blur-[10px]"
            title="Fullscreen"
          >
            <i className="fas fa-expand"></i>
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="absolute top-5 right-5 flex gap-2 p-1.5 bg-slate-900/80 rounded-lg backdrop-blur-[10px] z-[90]">
        <button
          onClick={() => switchView("1-1")}
          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
            currentView === "1-1"
              ? "bg-[#80a1ba] border-[#80a1ba] text-white"
              : "bg-transparent border-transparent text-[#b4debd] hover:bg-[#91c4c3]/15 hover:text-[#fff7dd]"
          }`}
          title="1-1 View"
        >
          <i className="fas fa-user"></i>
        </button>
        <button
          onClick={() => switchView("grid")}
          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
            currentView === "grid"
              ? "bg-[#80a1ba] border-[#80a1ba] text-white"
              : "bg-transparent border-transparent text-[#b4debd] hover:bg-[#91c4c3]/15 hover:text-[#fff7dd]"
          }`}
          title="Grid View"
        >
          <i className="fas fa-th"></i>
        </button>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex items-center justify-center relative bg-black">
        {/* 1-1 Call View */}
        {currentView === "1-1" && (
          <div className="w-full h-full relative">
            <div className="w-full h-full relative">
              {/* Main Video */}
              <div
                className="w-full h-full object-cover bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url(https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/07/anh-sieu-xe.jpg)",
                }}
              ></div>

              {/* Participant Overlay */}
              <div className="absolute top-5 left-5 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/80 rounded-lg backdrop-blur-[10px]">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[13px] text-white"
                  style={{ background: "#ec4899" }}
                >
                  SJ
                </div>
                <span className="text-sm font-medium text-[#fff7dd]">
                  Sarah Johnson
                </span>
                <div className="flex gap-2 ml-2.5">
                  <div className="w-6 h-6 rounded-md bg-[#80a1ba]/20 flex items-center justify-center text-[11px]">
                    <i className="fas fa-microphone"></i>
                  </div>
                  <div className="w-6 h-6 rounded-md bg-[#80a1ba]/20 flex items-center justify-center text-[11px]">
                    <i className="fas fa-video"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Self Video PiP */}
            <div
              className="absolute bottom-5 right-5 w-60 h-[180px] rounded-xl overflow-hidden border-2 border-[#80a1ba] shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all cursor-pointer hover:scale-105 hover:border-[#80a1ba] bg-cover bg-center"
              style={{
                backgroundImage:
                  "url(https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/07/anh-sieu-xe.jpg)",
              }}
            >
              <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-slate-900/90 rounded-md text-[11px] font-medium text-[#fff7dd]">
                You
              </div>
            </div>
          </div>
        )}

        {/* Group Call Grid View */}
        {currentView === "grid" && (
          <div className="grid grid-cols-2 grid-rows-2 gap-4 p-5 w-full h-full overflow-y-auto">
            {participants.map((participant, index) => (
              <div
                key={participant.id}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all min-h-[200px] bg-cover bg-center ${
                  participant.isSpeaking
                    ? "border-green-500 shadow-[0_0_0_3px_rgba(16,185,129,0.3)]"
                    : "border-[#80a1ba] hover:border-[#80a1ba] hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(128,161,186,0.3)]"
                }`}
                style={{
                  backgroundImage:
                    "url(https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/07/anh-sieu-xe.jpg)",
                }}
              >
                {/* Participant Info */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center px-3.5 py-2.5 bg-slate-900/90 rounded-lg backdrop-blur-[10px]">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs text-white"
                      style={{ background: participant.avatarBg }}
                    >
                      {participant.avatar}
                    </div>
                    <span className="text-[13px] text-[#fff7dd]">
                      {participant.name}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] ${
                        participant.isMuted
                          ? "bg-red-500/20 text-red-500"
                          : "bg-[#80a1ba]/20"
                      }`}
                    >
                      <i
                        className={`fas fa-microphone${participant.isMuted ? "-slash" : ""}`}
                      ></i>
                    </div>
                    <div className="w-7 h-7 rounded-md bg-[#80a1ba]/20 flex items-center justify-center text-[11px]">
                      <i className="fas fa-video"></i>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-8 py-8 bg-gradient-to-t from-slate-900/95 to-transparent flex justify-center items-center gap-4 z-[100] transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={toggleMic}
          className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center transition-all backdrop-blur-[10px] hover:bg-[#91c4c3]/15 hover:border-[#80a1ba] hover:-translate-y-1 ${
            !micEnabled
              ? "bg-[#80a1ba] border-[#80a1ba] text-white"
              : "bg-[#80a1ba]/20 border-[#80a1ba]/30 text-[#fff7dd]"
          }`}
        >
          <i
            className={`fas fa-microphone${!micEnabled ? "-slash" : ""} text-xl`}
          ></i>
          <span className="text-[10px] mt-1 font-medium">Mic</span>
        </button>

        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center transition-all backdrop-blur-[10px] hover:bg-[#91c4c3]/15 hover:border-[#80a1ba] hover:-translate-y-1 ${
            !videoEnabled
              ? "bg-[#80a1ba] border-[#80a1ba] text-white"
              : "bg-[#80a1ba]/20 border-[#80a1ba]/30 text-[#fff7dd]"
          }`}
        >
          <i
            className={`fas fa-video${!videoEnabled ? "-slash" : ""} text-xl`}
          ></i>
          <span className="text-[10px] mt-1 font-medium">Video</span>
        </button>

        <button
          onClick={toggleScreenShare}
          className="w-14 h-14 rounded-2xl bg-[#80a1ba]/20 border border-[#80a1ba]/30 text-[#fff7dd] flex flex-col items-center justify-center transition-all backdrop-blur-[10px] hover:bg-[#91c4c3]/15 hover:border-[#80a1ba] hover:-translate-y-1"
        >
          <i className="fas fa-desktop text-xl"></i>
          <span className="text-[10px] mt-1 font-medium">Share</span>
        </button>

        <button
          onClick={toggleRecording}
          className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center transition-all backdrop-blur-[10px] hover:bg-[#91c4c3]/15 hover:border-[#80a1ba] hover:-translate-y-1 ${
            recording
              ? "bg-[#80a1ba] border-[#80a1ba] text-white"
              : "bg-[#80a1ba]/20 border-[#80a1ba]/30 text-[#fff7dd]"
          }`}
        >
          <i className="fas fa-record-vinyl text-xl"></i>
          <span className="text-[10px] mt-1 font-medium">Record</span>
        </button>

        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center transition-all mx-5 hover:bg-red-600 hover:scale-110 hover:shadow-[0_8px_24px_rgba(239,68,68,0.5)]"
        >
          <i className="fas fa-phone-slash text-2xl"></i>
        </button>

        <button
          onClick={() => togglePanel("participants")}
          className="w-14 h-14 rounded-2xl bg-[#80a1ba]/20 border border-[#80a1ba]/30 text-[#fff7dd] flex flex-col items-center justify-center transition-all backdrop-blur-[10px] hover:bg-[#91c4c3]/15 hover:border-[#80a1ba] hover:-translate-y-1"
        >
          <i className="fas fa-users text-xl"></i>
          <span className="text-[10px] mt-1 font-medium">People</span>
        </button>

        <button
          onClick={() => togglePanel("chat")}
          className="w-14 h-14 rounded-2xl bg-[#80a1ba]/20 border border-[#80a1ba]/30 text-[#fff7dd] flex flex-col items-center justify-center transition-all backdrop-blur-[10px] hover:bg-[#91c4c3]/15 hover:border-[#80a1ba] hover:-translate-y-1"
        >
          <i className="fas fa-comment text-xl"></i>
          <span className="text-[10px] mt-1 font-medium">Chat</span>
        </button>

        <button
          onClick={raiseHand}
          className="w-14 h-14 rounded-2xl bg-[#80a1ba]/20 border border-[#80a1ba]/30 text-[#fff7dd] flex flex-col items-center justify-center transition-all backdrop-blur-[10px] hover:bg-[#91c4c3]/15 hover:border-[#80a1ba] hover:-translate-y-1"
        >
          <i className="fas fa-hand-paper text-xl"></i>
          <span className="text-[10px] mt-1 font-medium">Raise</span>
        </button>

        <button className="w-14 h-14 rounded-2xl bg-[#80a1ba]/20 border border-[#80a1ba]/30 text-[#fff7dd] flex flex-col items-center justify-center transition-all backdrop-blur-[10px] hover:bg-[#91c4c3]/15 hover:border-[#80a1ba] hover:-translate-y-1">
          <i className="fas fa-ellipsis-h text-xl"></i>
          <span className="text-[10px] mt-1 font-medium">More</span>
        </button>
      </div>

      {/* Chat Sidebar */}
      <div
        className={`absolute top-0 h-full w-[400px] bg-[#1e293b] border-l border-[#80a1ba] z-[200] flex flex-col transition-all duration-300 ${
          chatPanelOpen ? "right-0" : "-right-[400px]"
        }`}
      >
        <div className="px-5 py-5 border-b border-[#80a1ba] flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#fff7dd]">Chat</h3>
          <button
            onClick={() => setChatPanelOpen(false)}
            className="w-8 h-8 rounded-lg bg-transparent text-[#b4debd] flex items-center justify-center hover:bg-[#91c4c3]/15 hover:text-[#fff7dd] transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[13px] text-white flex-shrink-0"
                  style={{ background: message.avatarBg }}
                >
                  {message.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#fff7dd]">
                      {message.author}
                    </span>
                    <span className="text-[11px] text-[#b4debd]">
                      {message.time}
                    </span>
                  </div>
                  <div className="text-sm text-[#fff7dd] leading-relaxed bg-[#0f172a] px-3.5 py-2.5 rounded-xl border border-[#80a1ba]">
                    {message.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 py-5 border-t border-[#80a1ba] bg-[#0f172a]">
          <div className="flex gap-2.5 items-end">
            <textarea
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-3 bg-[#334155] border border-[#80a1ba] rounded-xl text-[#fff7dd] text-sm resize-none max-h-[120px] focus:outline-none focus:border-[#80a1ba]"
              placeholder="Type a message..."
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              className="w-11 h-11 rounded-xl bg-[#80a1ba] text-white flex items-center justify-center hover:bg-[#91c4c3] hover:scale-105 transition-all"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Participants Sidebar */}
      <div
        className={`absolute top-0 h-full w-[400px] bg-[#1e293b] border-l border-[#80a1ba] z-[200] flex flex-col transition-all duration-300 ${
          participantsPanelOpen ? "right-0" : "-right-[400px]"
        }`}
      >
        <div className="px-5 py-5 border-b border-[#80a1ba] flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#fff7dd]">
            Participants ({participants.length})
          </h3>
          <button
            onClick={() => setParticipantsPanelOpen(false)}
            className="w-8 h-8 rounded-lg bg-transparent text-[#b4debd] flex items-center justify-center hover:bg-[#91c4c3]/15 hover:text-[#fff7dd] transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 px-3 py-3 bg-[#0f172a] border border-[#80a1ba] rounded-xl hover:border-[#80a1ba] hover:bg-[#91c4c3]/15 transition-all"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm text-white"
                  style={{ background: participant.avatarBg }}
                >
                  {participant.avatar}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#fff7dd] mb-0.5">
                    {participant.name}
                  </div>
                  <div className="text-xs text-[#b4debd] flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    <span>{participant.status}</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      participant.isMuted
                        ? "bg-transparent border-[#80a1ba] text-red-500"
                        : "bg-transparent border-[#80a1ba] text-[#b4debd] hover:bg-[#91c4c3]/15 hover:border-[#80a1ba] hover:text-[#fff7dd]"
                    }`}
                  >
                    <i
                      className={`fas fa-microphone${participant.isMuted ? "-slash" : ""}`}
                    ></i>
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-transparent border border-[#80a1ba] text-[#b4debd] flex items-center justify-center hover:bg-[#91c4c3]/15 hover:border-[#80a1ba] hover:text-[#fff7dd] transition-all">
                    <i className="fas fa-video"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="absolute top-[100px] right-5 px-4 py-3.5 bg-slate-900/95 border border-[#80a1ba] rounded-xl text-[#fff7dd] text-sm shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[10px] animate-[slideInRight_0.3s_ease] z-[150]">
          {notification}
        </div>
      )}

      {/* Add FontAwesome */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
    </div>
  );
};

export default VideoCallPage;
