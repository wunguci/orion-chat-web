import { useEffect, useRef } from "react";
import { useCall } from "../../hooks/useCall";
import { FaUser } from "react-icons/fa";
import {
  BsFillTelephoneOutboundFill,
  BsFillTelephoneXFill,
} from "react-icons/bs";

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<number | null>(null);

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

  return (
    <div className="fixed inset-0 bg-[var(--app-overlay)] flex items-center justify-center z-50">
      <div className="bg-[var(--app-surface)] rounded-2xl p-6 max-w-sm w-full mx-4 border border-[var(--app-primary-border)] shadow-lg">
        <div className="text-center">
          {/* avatar */}
          <div className="w-20 h-20 rounded-full bg-[var(--chat-primary-bg)] mx-auto mb-4 flex items-center justify-center border border-[var(--app-primary-border)] overflow-hidden">
            {incomingCall.callerAvatar ? (
              <img
                src={incomingCall.callerAvatar}
                alt={incomingCall.callerName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <FaUser className="text-3xl text-[var(--chat-primary)]" />
            )}
          </div>

          {/* caller name */}
          <h3 className="text-xl font-semibold mb-2 text-[var(--app-text)]">
            {incomingCall.callerName || "Unknown"}
          </h3>

          {/* call type */}
          <p className="text-[var(--app-muted)] mb-6">
            Incoming {incomingCall.callType} call...
          </p>

          {/* action buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={rejectCall}
              className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
            >
              <BsFillTelephoneXFill className="inline-block mr-2" />
            </button>
            <button
              onClick={acceptCall}
              className="px-6 py-3 bg-[var(--chat-primary)] text-white rounded-full hover:bg-[var(--chat-primary-hover)] transition"
            >
              <BsFillTelephoneOutboundFill className="inline-block mr-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
