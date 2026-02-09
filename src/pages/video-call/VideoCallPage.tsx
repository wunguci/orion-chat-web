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
      avatarBg: "#4207f2",
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
      author: "Phan Phước Hiệp",
      avatar: "JD",
      avatarBg: "#80a1ba",
      time: "2:30 PM",
      text: "Hey everyone! Ready to start the meeting?",
    },
    {
      id: "2",
      author: "Giang",
      avatar: "SJ",
      avatarBg: "#4869ec",
      time: "2:31 PM",
      text: "Yes, let's go through the project updates first",
    },
    {
      id: "3",
      author: "Michael Vũ",
      avatar: "MC",
      avatarBg: "#f59e0b",
      time: "2:32 PM",
      text: "I'll share my screen to show the latest designs",
    },
  ]);

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

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

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
      <div
        className={`absolute top-0 left-0 right-0 px-6 py-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex justify-between items-center z-[100] transition-all duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Meeting with Phan Phước Hiệp
          </h3>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-sm text-white/90 border border-white/10">
            <i className="fas fa-clock text-xs"></i>
            <span className="font-medium">{callDuration}</span>
          </div>
          {recording && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-lg text-xs text-red-400 animate-pulse backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="font-medium">Recording</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => switchView("1-1")}
            className={`group relative w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
              currentView === "1-1"
                ? "bg-blue-500 shadow-lg shadow-blue-500/50 scale-105"
                : "bg-white/10 hover:bg-white/20 hover:scale-105"
            }`}
            title="1-1 View"
          >
            <i
              className={`fas fa-user text-base ${
                currentView === "1-1"
                  ? "text-white"
                  : "text-white/70 group-hover:text-white"
              }`}
            ></i>
            <span
              className={`text-[9px] mt-0.5 font-medium ${
                currentView === "1-1"
                  ? "text-white"
                  : "text-white/60 group-hover:text-white/90"
              }`}
            >
              1-1
            </span>
          </button>
          <button
            onClick={() => switchView("grid")}
            className={`group relative w-12 h-12 rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
              currentView === "grid"
                ? "bg-blue-500 shadow-lg shadow-blue-500/50 scale-105"
                : "bg-white/10 hover:bg-white/20 hover:scale-105"
            }`}
            title="Grid View"
          >
            <i
              className={`fas fa-th text-base ${
                currentView === "grid"
                  ? "text-white"
                  : "text-white/70 group-hover:text-white"
              }`}
            ></i>
            <span
              className={`text-[9px] mt-0.5 font-medium ${
                currentView === "grid"
                  ? "text-white"
                  : "text-white/60 group-hover:text-white/90"
              }`}
            >
              Grid
            </span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 flex items-center justify-center hover:bg-white/20 hover:border-white/40 hover:scale-110 transition-all duration-200"
            title="Fullscreen"
          >
            <i className="fas fa-expand text-sm"></i>
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative bg-black">
        {currentView === "1-1" && (
          <div className="w-full h-full relative">
            <div className="w-full h-full relative">
              <div
                className="w-full h-full object-cover bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url(https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/07/anh-sieu-xe.jpg)",
                }}
              ></div>

              <div className="absolute top-20 left-6 flex items-center gap-3 px-4 py-3 bg-black/80 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 z-[110] transition-all duration-300 hover:bg-black/90">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm text-white shadow-lg"
                  style={{ background: "#48c3ec" }}
                >
                  SJ
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">
                    Sarah Johnson
                  </span>
                  <span className="text-xs text-white/60">Speaking...</span>
                </div>
                <div className="flex gap-1.5 ml-2 pl-2 border-l border-white/20">
                  <div className="w-7 h-7 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-[11px] text-green-400">
                    <i className="fas fa-microphone"></i>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[11px] text-blue-400">
                    <i className="fas fa-video"></i>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="absolute bottom-24 right-6 w-64 h-[180px] rounded-2xl overflow-hidden border-3 border-white/30 shadow-2xl transition-all duration-300 cursor-pointer hover:scale-105 hover:border-blue-500 hover:shadow-blue-500/30 bg-cover bg-center group"
              style={{
                backgroundImage:
                  "url(https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/07/anh-sieu-xe.jpg)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/80 backdrop-blur-sm rounded-lg text-xs font-semibold text-white border border-white/20">
                You (Host)
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button className="w-8 h-8 rounded-lg bg-black/80 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-red-500 transition-colors">
                  <i className="fas fa-expand-alt text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        )}

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

      <div
        className={`absolute bottom-0 left-0 right-0 px-8 py-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex justify-center items-center gap-3 z-[100] transition-all duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={toggleMic}
          className={`group w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-200 backdrop-blur-xl hover:-translate-y-1 hover:shadow-xl ${
            !micEnabled
              ? "bg-red-500 shadow-lg shadow-red-500/50"
              : "bg-white/15 hover:bg-white/25 border border-white/30"
          }`}
        >
          <i
            className={`fas fa-microphone${!micEnabled ? "-slash" : ""} text-lg ${
              !micEnabled ? "text-white" : "text-white/90"
            }`}
          ></i>
        </button>

        <button
          onClick={toggleVideo}
          className={`group w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-200 backdrop-blur-xl hover:-translate-y-1 hover:shadow-xl ${
            !videoEnabled
              ? "bg-red-500 shadow-lg shadow-red-500/50"
              : "bg-white/15 hover:bg-white/25 border border-white/30"
          }`}
        >
          <i
            className={`fas fa-video${!videoEnabled ? "-slash" : ""} text-lg ${
              !videoEnabled ? "text-white" : "text-white/90"
            }`}
          ></i>
        </button>

        <button
          onClick={toggleScreenShare}
          className="group w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white/90 flex flex-col items-center justify-center transition-all duration-200 backdrop-blur-xl hover:-translate-y-1 hover:shadow-xl"
        >
          <i className="fas fa-desktop text-lg"></i>
        </button>

        <button
          onClick={toggleRecording}
          className={`group w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-200 backdrop-blur-xl hover:-translate-y-1 hover:shadow-xl ${
            recording
              ? "bg-red-500 shadow-lg shadow-red-500/50 animate-pulse"
              : "bg-white/15 hover:bg-white/25 border border-white/30"
          }`}
        >
          <i
            className={`fas fa-circle text-lg ${
              recording ? "text-white" : "text-red-400"
            }`}
          ></i>
        </button>

        <div className="h-10 w-px bg-white/20 mx-2"></div>

        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center transition-all duration-200 hover:bg-red-600 hover:scale-110 hover:shadow-2xl hover:shadow-red-500/50"
        >
          <i className="fas fa-phone-slash text-xl"></i>
        </button>

        <div className="h-10 w-px bg-white/20 mx-2"></div>

        <button
          onClick={() => togglePanel("participants")}
          className={`group w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-200 backdrop-blur-xl hover:-translate-y-1 hover:shadow-xl ${
            participantsPanelOpen
              ? "bg-blue-500 shadow-lg shadow-blue-500/50"
              : "bg-white/15 hover:bg-white/25 border border-white/30"
          }`}
        >
          <i className="fas fa-users text-lg text-white/90"></i>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-black">
            {participants.length}
          </span>
        </button>

        <button
          onClick={() => togglePanel("chat")}
          className={`group w-14 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-200 backdrop-blur-xl hover:-translate-y-1 hover:shadow-xl ${
            chatPanelOpen
              ? "bg-blue-500 shadow-lg shadow-blue-500/50"
              : "bg-white/15 hover:bg-white/25 border border-white/30"
          }`}
        >
          <i className="fas fa-comment text-lg text-white/90"></i>
        </button>

        <button
          onClick={raiseHand}
          className="group w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white/90 flex flex-col items-center justify-center transition-all duration-200 backdrop-blur-xl hover:-translate-y-1 hover:shadow-xl"
        >
          <i className="fas fa-hand-paper text-lg"></i>
        </button>

        <button className="group w-14 h-14 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 text-white/90 flex flex-col items-center justify-center transition-all duration-200 backdrop-blur-xl hover:-translate-y-1 hover:shadow-xl">
          <i className="fas fa-ellipsis-h text-lg"></i>
        </button>
      </div>

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
      {notification && (
        <div className="absolute top-[100px] right-5 px-4 py-3.5 bg-slate-900/95 border border-[#80a1ba] rounded-xl text-[#fff7dd] text-sm shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-[10px] animate-[slideInRight_0.3s_ease] z-[150]">
          {notification}
        </div>
      )}

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
    </div>
  );
};

export default VideoCallPage;
