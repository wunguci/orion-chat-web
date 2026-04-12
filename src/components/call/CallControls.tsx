import { useCall } from "../../hooks/useCall";
import { FaMicrophone } from "react-icons/fa";
import { HiMiniSpeakerXMark } from "react-icons/hi2";
import { FiCamera, FiCameraOff } from "react-icons/fi";
import { MdCallEnd } from "react-icons/md";
import { HiOutlineVideoCamera } from "react-icons/hi2";

export const CallControls: React.FC = () => {
  const {
    isVideoEnabled,
    isAudioEnabled,
    toggleAudio,
    toggleVideo,
    endCall,
    callType,
    status,
    requestVideoUpgrade,
    isRequestingVideoUpgrade,
  } = useCall();

  return (
    <div className="flex items-center gap-4 bg-gray-900/80 px-6 py-4 rounded-full backdrop-blur-sm">
      {/* microphone toggle */}
      <button
        onClick={toggleAudio}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
          isAudioEnabled
            ? "bg-gray-700 hover:bg-gray-600"
            : "bg-red-500 hover:bg-red-600"
        }`}
        title={isAudioEnabled ? "Mute" : "Unmute"}
      >
        <span className="text-white text-xl">
          {isAudioEnabled ? <FaMicrophone /> : <HiMiniSpeakerXMark />}
        </span>
      </button>

      {/* video toggle only for video calls */}
      {callType === "video" && (
        <button
          onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
            isVideoEnabled
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-red-500 hover:bg-red-600"
          }`}
          title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          <span className="text-white text-xl">
            {isVideoEnabled ? <FiCamera /> : <FiCameraOff />}
          </span>
        </button>
      )}

      {/* request video upgrade for ongoing audio call */}
      {callType === "audio" && status === "connected" && (
        <button
          onClick={requestVideoUpgrade}
          disabled={!!isRequestingVideoUpgrade}
          className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center transition"
          title={
            isRequestingVideoUpgrade
              ? "Đang gửi yêu cầu video..."
              : "Yêu cầu chuyển sang video call"
          }
        >
          <HiOutlineVideoCamera className="text-white text-xl" />
        </button>
      )}

      {/* end call button */}
      <button
        onClick={endCall}
        className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition"
        title="End call"
      >
        <MdCallEnd className="text-white text-xl" />
      </button>
    </div>
  );
};
