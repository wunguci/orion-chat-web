import type { ViewMode } from "../../types/work-hub.types";

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

const views: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: "board", icon: "fa-th", label: "Board" },
  { mode: "list", icon: "fa-list", label: "List" },
  { mode: "calendar", icon: "fa-calendar-alt", label: "Calendar" },
];

const ViewSwitcher = ({ currentView, onViewChange }: ViewSwitcherProps) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--wh-green-bg-light)] rounded-lg border border-[var(--wh-green-border-light)]">
      {views.map((v) => (
        <button
          key={v.mode}
          onClick={() => onViewChange(v.mode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            currentView === v.mode
              ? "bg-[var(--wh-green-primary)] text-white shadow-sm"
              : "text-gray-600 hover:text-[var(--wh-green-text-primary)] hover:bg-[var(--wh-green-bg-heavy)]"
          }`}
        >
          <i className={`fas ${v.icon} text-xs`}></i>
          <span className="hidden sm:inline">{v.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;
