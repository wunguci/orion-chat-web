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
    <div className="fixed inset-0 bg-wh-green-text-primary/60 flex items-center justify-center z-50">
      <div className="bg-wh-green-bg-light rounded-2xl p-8 max-w-sm w-full mx-4 shadow-lg border border-wh-green-border-light">
        <div className="text-center">
          {/* Group call icon */}
          <div className="w-24 h-24 rounded-full bg-wh-green-primary mx-auto mb-4 flex items-center justify-center shadow-lg">
            <FaUsers className="text-4xl text-white" />
          </div>

          {/* Header text */}
          <h3 className="text-2xl font-bold text-wh-green-text-primary mb-2">
            Group Call Incoming
          </h3>

          {/* Caller info */}
          <p className="text-wh-green-text-secondary mb-2 font-semibold">
            {incomingCall.initiatorName || incomingCall.callerName || "Someone"} is calling...
          </p>

          {/* Participant count */}
          <p className="text-sm text-wh-green-text-muted mb-6">
            {incomingCall.participantCount} participants
          </p>

          {/* Call type badge */}
          <div className="inline-block px-4 py-2 bg-wh-green-bg-heavy rounded-full text-wh-green-text-primary text-sm font-semibold mb-6 border border-wh-green-border-light">
            {incomingCall.callType === "video" ? "Video Call" : "Audio Call"}
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 justify-center">
            {/* Reject button */}
            <button
              onClick={rejectGroupCall}
              className="flex-1 px-6 py-3 bg-wh-priority-critical text-white rounded-full hover:bg-wh-priority-high transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            >
              <BsFillTelephoneXFill className="text-lg" />
              Reject
            </button>

            {/* Accept button */}
            <button
              onClick={handleAccept}
              className="flex-1 px-6 py-3 bg-wh-green-primary text-white rounded-full hover:bg-wh-green-primary-hover transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
            >
              <BsFillTelephoneOutboundFill className="text-lg" />
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
