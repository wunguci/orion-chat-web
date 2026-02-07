import { useState } from "react";

interface Label {
  text: string;
  type: "feature" | "bug" | "urgent";
}

interface TaskCardProps {
  id: string;
  title: string;
  labels: Label[];
  date: string;
  assignees: string[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
}

const TaskCard = ({
  id,
  title,
  labels,
  date,
  assignees,
  onEdit,
  onDelete,
  onClick,
}: TaskCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  const getLabelClass = (type: "feature" | "bug" | "urgent") => {
    const classes = {
      feature: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
      bug: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
      urgent: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
    };
    return classes[type];
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-[var(--color-primary)] hover:shadow-md group"
      onClick={() => onClick?.(id)}
    >
      {/* Labels & Menu */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-1.5 flex-wrap flex-1">
          {labels.map((label, index) => (
            <span
              key={index}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${getLabelClass(label.type)}`}
            >
              {label.text}
            </span>
          ))}
        </div>
        <div className="relative ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <i className="fas fa-ellipsis-h text-xs"></i>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <i className="fas fa-edit text-xs"></i> Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <i className="fas fa-trash text-xs"></i> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-3 line-clamp-2">
        {title}
      </h4>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <i className="far fa-calendar"></i>
          <span>{date}</span>
        </div>
        <div className="flex -space-x-2">
          {assignees.map((avatar, index) => (
            <img
              key={index}
              src={avatar}
              alt="Assignee"
              className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 object-cover"
              title={`Assignee ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
