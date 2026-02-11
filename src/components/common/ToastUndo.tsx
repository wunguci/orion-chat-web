import React from "react";

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
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-90 flex items-center gap-4 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl animate-slide-up overflow-hidden min-w-75">
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-primary animate-timer-shrink"
        style={{ animationDuration: `${duration}ms` }}
      ></div>

      <div className="flex items-center gap-3 flex-1">
        <span className="material-symbols-outlined text-slate-400 text-lg">
          info
        </span>
        <span className="text-sm font-semibold">{message}</span>
      </div>

      <button
        onClick={onUndo}
        className="text-primary font-black text-xs hover:text-white transition-colors bg-primary/10 px-3 py-1.5 rounded-lg active:scale-90"
      >
        UNDO
      </button>

      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
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
