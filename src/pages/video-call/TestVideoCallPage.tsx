import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCall } from "../../hooks/useCall";

// Mock users for testing
const MOCK_USERS = [
  {
    id: "user-001",
    name: "Alice Wilson",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "user-002",
    name: "Bob Smith",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
];

const TestVideoCallPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId") || "user-001";

  // Tìm người dùng khác (không phải người dùng hiện tại) được chọn mặc định.
  const otherUsers = MOCK_USERS.filter((u) => u.id !== currentUserId);
  const [selectedUser, setSelectedUser] = useState<string>(
    otherUsers.length > 0 ? otherUsers[0].id : MOCK_USERS[0].id,
  );
  const [callType, setCallType] = useState<"audio" | "video">("video");

  const {
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    status,
    localStream,
    remoteStream,
    incomingCall,
    otherUser,
    isAudioEnabled,
    isVideoEnabled,
  } = useCall();

  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);

  // Attach local stream to video element
  React.useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  React.useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleInitiateCall = async () => {
    const targetUser = MOCK_USERS.find((u) => u.id === selectedUser);
    const caller = MOCK_USERS.find((u) => u.id === currentUserId);

    if (targetUser && caller) {
      try {
        // conversationId can be fake for testing, receiverId is the target user
        const fakeConversationId = `conv-${caller.id}-${targetUser.id}`;

        await initiateCall(
          fakeConversationId,
          targetUser.id, // receiverId
          callType,
          {
            name: targetUser.name,
            avatar: targetUser.avatar,
          },
          {
            name: caller.name,
            avatar: caller.avatar,
          },
        );
      } catch (error) {
        console.error("Failed to initiate call:", error);
      }
    }
  };

  const handleAcceptCall = () => {
    acceptCall();
  };

  const handleRejectCall = () => {
    rejectCall();
  };

  const handleEndCall = () => {
    endCall();
  };

  const handleToggleAudio = () => {
    toggleAudio();
  };

  const handleToggleVideo = () => {
    toggleVideo();
  };

  const handleSwitchUser = (userId: string) => {
    localStorage.setItem("userId", userId);
    // Reload page to reinitialize CallProvider with new userId
    window.location.reload();
  };

  const currentUser = MOCK_USERS.find((u) => u.id === currentUserId);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Video Call Test Page
            </h1>
            <p className="text-gray-400">
              Current User:{" "}
              <span className="text-white font-semibold">{currentUserId}</span>
            </p>
          </div>
          <button
            onClick={() => navigate("/chat")}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Chat
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Switcher */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Current User</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
                  <img
                    src={currentUser?.avatar}
                    alt={currentUser?.name}
                    className="w-14 h-14 rounded-full"
                  />
                  <div>
                    <div className="font-semibold text-lg">
                      {currentUser?.name}
                    </div>
                    <div className="text-sm text-gray-400">{currentUserId}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm text-gray-400 mb-2">
                    Switch User:
                  </label>
                  {MOCK_USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSwitchUser(user.id)}
                      disabled={user.id === currentUserId || status !== "idle"}
                      className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                        user.id === currentUserId
                          ? "bg-blue-500 text-white cursor-not-allowed"
                          : status !== "idle"
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-gray-700 text-white hover:bg-gray-600"
                      }`}
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="text-left flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.id}</div>
                      </div>
                      {user.id === currentUserId && (
                        <i className="fas fa-check text-sm"></i>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Call Status */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Call Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      status === "connected"
                        ? "bg-green-500/20 text-green-400"
                        : status === "calling"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : status === "ringing"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Audio:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isAudioEnabled
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {isAudioEnabled ? "ON" : "OFF"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Video:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isVideoEnabled
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {isVideoEnabled ? "ON" : "OFF"}
                  </span>
                </div>
                {otherUser && (
                  <div className="pt-3 border-t border-gray-700">
                    <span className="text-gray-400">Connected with:</span>
                    <div className="mt-2 text-white font-medium">
                      {otherUser.name}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Initiate Call */}
            {status === "idle" && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Start Call</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Select User to Call
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      {MOCK_USERS.filter((u) => u.id !== currentUserId).map(
                        (user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.id})
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Call Type
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCallType("audio")}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                          callType === "audio"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        Audio
                      </button>
                      <button
                        onClick={() => setCallType("video")}
                        className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                          callType === "video"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        Video
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleInitiateCall}
                    disabled={selectedUser === currentUserId}
                    className={`w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      selectedUser === currentUserId
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    <i className="fas fa-phone"></i>
                    Call {MOCK_USERS.find((u) => u.id === selectedUser)?.name}
                  </button>
                </div>
              </div>
            )}

            {/* Incoming Call */}
            {incomingCall && status === "ringing" && (
              <div className="bg-gray-800 rounded-xl p-6 border border-blue-500">
                <h2 className="text-xl font-semibold mb-4">Incoming Call</h2>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <i className="fas fa-phone-alt text-3xl text-blue-400"></i>
                    </div>
                    <div className="text-lg font-medium">
                      {incomingCall.callerName}
                    </div>
                    <div className="text-sm text-gray-400">
                      {incomingCall.callType} call
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRejectCall}
                      className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleAcceptCall}
                      className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Call Controls */}
            {(status === "connected" || status === "calling") && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Controls</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleToggleAudio}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                      isAudioEnabled
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    <i
                      className={`fas fa-microphone${isAudioEnabled ? "" : "-slash"} mr-2`}
                    ></i>
                    {isAudioEnabled ? "Mute" : "Unmute"}
                  </button>
                  <button
                    onClick={handleToggleVideo}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                      isVideoEnabled
                        ? "bg-gray-700 hover:bg-gray-600 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }`}
                  >
                    <i
                      className={`fas fa-video${isVideoEnabled ? "" : "-slash"} mr-2`}
                    ></i>
                    {isVideoEnabled ? "Stop Video" : "Start Video"}
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="col-span-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors"
                  >
                    <i className="fas fa-phone-slash mr-2"></i>
                    End Call
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Video */}
          <div className="lg:col-span-2 space-y-6">
            {/* Remote Video */}
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
              <div className="p-4 bg-gray-900 border-b border-gray-700">
                <h2 className="text-xl font-semibold">
                  {status === "connected" && otherUser
                    ? otherUser.name
                    : "Remote Video"}
                </h2>
              </div>
              <div className="aspect-video bg-gray-900 relative">
                {remoteStream ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <i className="fas fa-user-circle text-6xl text-gray-600 mb-4"></i>
                      <p className="text-gray-400">
                        {status === "connected"
                          ? "Waiting for video..."
                          : "No remote video"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Local Video */}
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
              <div className="p-4 bg-gray-900 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Local Video (You)</h2>
              </div>
              <div className="aspect-video bg-gray-900 relative">
                {localStream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <i className="fas fa-video-slash text-6xl text-gray-600 mb-4"></i>
                      <p className="text-gray-400">Camera off</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <i className="fas fa-info-circle text-blue-400"></i>
            Testing Instructions
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>
              <strong>Step 1:</strong> Open this page in 2 different browsers
              (or incognito windows)
            </li>
            <li>
              <strong>Step 2:</strong> In the first browser, click "Switch User"
              and select <strong>Alice Wilson (user-001)</strong>
            </li>
            <li>
              <strong>Step 3:</strong> In the second browser, click "Switch
              User" and select <strong>Bob Smith (user-002)</strong>
            </li>
            <li>
              <strong>Step 4:</strong> In Alice's window, click "Call Bob Smith"
              to initiate the call
            </li>
            <li>
              <strong>Step 5:</strong> In Bob's window, click "Accept" when the
              incoming call appears
            </li>
            <li>
              <strong>Step 6:</strong> Test audio/video controls (mute, toggle
              video, end call)
            </li>
          </ul>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <strong>Important:</strong> Both users must be connected (online)
              for calls to work. You should see 2 users online in the server
              logs.
            </p>
          </div>
        </div>
      </div>

      {/* FontAwesome CDN */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
    </div>
  );
};

export default TestVideoCallPage;
