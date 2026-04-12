import { useEffect, useRef, useCallback } from "react";
import { useCall } from "../../hooks/useCall";
import { CallControls } from "./CallControls";
import { FaUser } from "react-icons/fa";
import { FiCamera } from "react-icons/fi";
import { CallTimer } from "./CallTimer";

export const CallModal: React.FC = () => {
  const {
    status,
    localStream,
    remoteStream,
    callType,
    otherUser,
    isVideoEnabled,
    startTime,
    error,
    incomingVideoUpgradeRequest,
    respondVideoUpgradeRequest,
  } = useCall();

  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Hàm play video an toàn - xử lý autoplay bị block
  const safePlay = useCallback(async (video: HTMLVideoElement) => {
    try {
      await video.play();
    } catch (err) {
      console.warn("[CallModal] Autoplay blocked, retrying muted then unmuting...", err);
      video.muted = true;
      try {
        await video.play();
        setTimeout(() => {
          video.muted = false;
        }, 100);
      } catch (err2) {
        console.error("[CallModal] Cannot play video even muted:", err2);
      }
    }
  }, []);

  // Dùng ref callback cho local video - tự động gán srcObject mỗi khi element mount
  const localVideoRefCallback = useCallback(
    (videoEl: HTMLVideoElement | null) => {
      if (videoEl && localStream) {
        videoEl.srcObject = localStream;
      }
    },
    [localStream],
  );

  // gắn luồng remote vào video element
  useEffect(() => {
    const videoEl = remoteVideoRef.current;
    if (videoEl && remoteStream) {
      videoEl.srcObject = remoteStream;
      safePlay(videoEl);
    }
  }, [remoteStream, safePlay]);

  // không hiển thị modal nếu idle
  if (status === "idle") return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* remote video (full screen) */}
      <div className="relative w-full h-full">
        {status === "connected" && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
              <FaUser className="text-6xl text-gray-500" />
            </div>
            <h2 className="text-white text-2xl mb-2">
              {otherUser?.name || "Unknown"}
            </h2>
            <p className="text-gray-400">
              {status === "calling" && "Calling..."}
              {status === "ringing" && "Connecting..."}
              {status === "connected" && "Connected"}
              {status === "failed" && (error || "Connection failed")}
            </p>
          </div>
        )}

        {/* local video (picture-in-picture) */}
        {callType === "video" && localStream && (
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            {isVideoEnabled ? (
              <video
                ref={localVideoRefCallback}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <FiCamera className="text-4xl" />
              </div>
            )}
          </div>
        )}

        {/* call timer */}
        {status === "connected" && startTime && (
          <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-lg">
            <CallTimer startTime={startTime} />
          </div>
        )}

        {/* controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <CallControls />
        </div>

        {/* incoming video-upgrade request for ongoing audio call */}
        {status === "connected" &&
          callType === "audio" &&
          incomingVideoUpgradeRequest && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/70 border border-white/20 rounded-xl px-4 py-3 text-white backdrop-blur-sm">
              <p className="text-sm mb-3">
                {otherUser?.name || "Đối phương"} muốn chuyển sang video call
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    void respondVideoUpgradeRequest(false);
                  }}
                  className="px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-sm"
                >
                  Từ chối
                </button>
                <button
                  onClick={() => {
                    void respondVideoUpgradeRequest(true);
                  }}
                  className="px-3 py-1.5 rounded-md bg-green-500 hover:bg-green-600 text-sm"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};
