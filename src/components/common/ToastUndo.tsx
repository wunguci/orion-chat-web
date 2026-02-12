import React from "react";
import { MdInfo } from "react-icons/md";

interface ToastUndoProps {
  isVisible: boolean;
  message: string;
  onUndo: () => void;
  duration?: number; // in milliseconds
}

export const ToastUndo: React.FC<ToastUndoProps> = ({
  isVisible,
  message,
  onUndo,
  duration = 4000,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-90 flex items-center gap-4 bg-white text-slate-900 px-6 py-4 rounded-2xl shadow-2xl animate-slide-up overflow-hidden min-w-75 border border-slate-200">
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-teal-500 animate-timer-shrink"
        style={{ animationDuration: `${duration}ms` }}
      ></div>

      <div className="flex items-center gap-3 flex-1">
        <MdInfo className="text-slate-400 text-lg" />
        <span className="text-sm font-semibold">{message}</span>
      </div>

      <button
        onClick={onUndo}
        className="text-primary font-black text-xs hover:text-teal-500 transition-colors bg-primary/10 px-3 py-1.5 rounded-lg active:scale-90 cursor-pointer"
      >
        UNDO
      </button>

      <style>{`
        @keyframes slideUp {
          from { transform: translateX(0) translateY(100%); opacity: 0;}
          to { transform: translateX(0) translateY(0); opacity: 1; }
        }
        @keyframes timerShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-timer-shrink { animation: timerShrink linear forwards; }
      `}</style>
    </div>
  );
};
