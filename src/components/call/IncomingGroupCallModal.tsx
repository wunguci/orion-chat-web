import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGroupCallContext } from "../../hooks/useGroupCallContext";
import { FaUsers } from "react-icons/fa";
import {
  BsFillTelephoneOutboundFill,
  BsFillTelephoneXFill,
} from "react-icons/bs";

/**
 * IncomingGroupCallModal
 * Hiển thị modal khi có incoming group call
 */
export const IncomingGroupCallModal: React.FC = () => {
  const { incomingCall, acceptGroupCall, rejectGroupCall } = useGroupCallContext();
  const navigate = useNavigate();
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<number | null>(null);

  // Play ringtone
  useEffect(() => {
    if (!incomingCall) {
      if (ringIntervalRef.current) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) {
      return;
    }

    const audioContext = new AudioCtx();
    audioContextRef.current = audioContext;

    const playBeep = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 850;
      gainNode.gain.value = 0.04;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    };

    playBeep();
    ringIntervalRef.current = window.setInterval(playBeep, 1200);

    return () => {
      if (ringIntervalRef.current) {
        window.clearInterval(ringIntervalRef.current);
        ringIntervalRef.current = null;
      }
      audioContext.close().catch(() => undefined);
      audioContextRef.current = null;
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  const handleAccept = async () => {
    try {
      await acceptGroupCall();
      navigate("/group-call");
    } catch {
      // Ignore; error state is handled in context
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--app-overlay)] flex items-center justify-center z-50">
      <div className="bg-[var(--app-surface)] rounded-2xl p-6 max-w-sm w-full mx-4 border border-[var(--app-primary-border)] shadow-2xl">
        <div className="text-center">
          {/* Group call icon */}
          <div className="w-20 h-20 rounded-full bg-[var(--chat-primary-bg)] mx-auto mb-4 flex items-center justify-center border border-[var(--app-primary-border)] overflow-hidden">
            {incomingCall.callerAvatar ? (
              <img
                src={incomingCall.callerAvatar}
                alt={incomingCall.initiatorName || incomingCall.callerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUsers className="text-4xl text-[var(--chat-primary)]" />
            )}
          </div>

          {/* Header text */}
          <h3 className="text-xl font-bold text-[var(--app-text)] mb-2">
            Incoming group call
          </h3>

          {/* Caller info */}
          <p className="text-[var(--app-text)] mb-2 font-semibold">
            {incomingCall.initiatorName || incomingCall.callerName || "Unknown"} is calling...
          </p>

          {/* Participant count */}
          <p className="text-sm text-[var(--app-muted)] mb-6">
            {incomingCall.participantCount} members
          </p>

          {/* Call type badge */}
          <div className="inline-block px-4 py-2 bg-[var(--chat-primary-bg)] text-[var(--chat-primary)] text-sm font-semibold mb-6 border border-[var(--app-primary-border)] rounded-full">
            {incomingCall.callType === "video" ? "Video call" : "Voice call"}
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 justify-center">
            {/* Reject button */}
            <button
              onClick={rejectGroupCall}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            >
              <BsFillTelephoneXFill className="text-lg" />
              Decline
            </button>

            {/* Accept button */}
            <button
              onClick={handleAccept}
              className="flex-1 px-6 py-3 bg-[var(--chat-primary)] text-white rounded-full hover:bg-[var(--chat-primary-hover)] transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            >
              <BsFillTelephoneOutboundFill className="text-lg" />
              Answer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
