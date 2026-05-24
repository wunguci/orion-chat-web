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
    isRemoteVideoEnabled,
    startTime,
    error,
    incomingVideoUpgradeRequest,
    respondVideoUpgradeRequest,
  } = useCall();

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const remoteVideoTrackId = remoteStream?.getVideoTracks()[0]?.id;
  const remoteAudioTrackId = remoteStream?.getAudioTracks()[0]?.id;
  const localVideoTrackId = localStream?.getVideoTracks()[0]?.id;

  // Hàm play video an toàn - xử lý autoplay bị block
  const safePlay = useCallback(async (
    video: HTMLVideoElement,
    keepMuted: boolean = false,
  ) => {
    try {
      await video.play();
    } catch (err) {
      console.warn("[CallModal] Autoplay blocked, retrying muted then unmuting...", err);
      video.muted = true;
      try {
        await video.play();
        if (!keepMuted) {
          setTimeout(() => {
            video.muted = false;
          }, 100);
        }
      } catch (err2) {
        console.error("[CallModal] Cannot play video even muted:", err2);
      }
    }
  }, []);

  // gắn luồng remote vào video element
  useEffect(() => {
    const videoEl = remoteVideoRef.current;
    if (!videoEl) return;

    if (remoteStream && isRemoteVideoEnabled) {
      videoEl.srcObject = remoteStream;
      safePlay(videoEl);
      return;
    }

    videoEl.srcObject = null;
  }, [remoteStream, isRemoteVideoEnabled, remoteVideoTrackId, safePlay]);

  // gắn luồng remote vào audio element để đảm bảo nghe được khi video bị tắt
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (audioEl && remoteStream) {
      audioEl.srcObject = remoteStream;
      void safePlay(audioEl);
    }
  }, [remoteStream, remoteAudioTrackId, safePlay]);

  // gắn local stream vào preview và đảm bảo video phát được
  useEffect(() => {
    const videoEl = localVideoRef.current;
    if (!videoEl) {
      return;
    }

    if (!localStream || !isVideoEnabled || !localStream.getVideoTracks().length) {
      videoEl.srcObject = null;
      return;
    }

    videoEl.srcObject = localStream;
    void safePlay(videoEl, true);
  }, [localStream, isVideoEnabled, localVideoTrackId, safePlay]);

  // không hiển thị modal nếu idle
  if (status === "idle") return null;

  return (
    <div className="fixed inset-0 bg-wh-green-text-primary z-50">
      {/* remote video (full screen) */}
      <div className="relative w-full h-full">
        {status === "connected" && remoteStream && isRemoteVideoEnabled ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-wh-green-bg-medium">
            <div className="w-32 h-32 rounded-full bg-wh-green-bg-heavy flex items-center justify-center mb-4">
              <FaUser className="text-6xl text-wh-green-text-muted" />
            </div>
            <h2 className="text-wh-green-text-primary text-2xl mb-2">
              {otherUser?.name || "Unknown"}
            </h2>
            <p className="text-wh-green-text-secondary">
              {status === "calling" && "Calling..."}
              {status === "ringing" && "Connecting..."}
              {status === "connected" && "Connected"}
              {status === "failed" && (error || "Connection failed")}
            </p>
          </div>
        )}

        {remoteStream && (
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
        )}

        {/* local video (picture-in-picture) */}
        {callType === "video" && localStream ? (
          <div className="absolute top-4 right-4 w-48 h-36 bg-wh-green-bg-heavy rounded-lg overflow-hidden shadow-lg border border-wh-green-border-light">
            {isVideoEnabled && localStream.getVideoTracks().length ? (
              <video
                ref={localVideoRef}
                key={localVideoTrackId || "no-video"}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-wh-green-border-medium">
                <FiCamera className="text-4xl text-wh-green-text-muted" />
              </div>
            )}
          </div>
        ) : null}

        {/* call timer */}
        {status === "connected" && startTime && (
          <div className="absolute top-4 left-4 bg-wh-green-text-primary/80 px-4 py-2 rounded-lg border border-wh-green-border-dark">
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
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-wh-green-text-primary/80 border border-wh-green-border-dark rounded-xl px-4 py-3 text-white backdrop-blur-sm">
              <p className="text-sm mb-3">
                {otherUser?.name || "Đối phương"} muốn chuyển sang video call
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    void respondVideoUpgradeRequest(false);
                  }}
                  className="px-3 py-1.5 rounded-md bg-wh-priority-critical hover:bg-wh-priority-high text-sm"
                >
                  Từ chối
                </button>
                <button
                  onClick={() => {
                    void respondVideoUpgradeRequest(true);
                  }}
                  className="px-3 py-1.5 rounded-md bg-wh-green-primary hover:bg-wh-green-primary-hover text-sm"
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
