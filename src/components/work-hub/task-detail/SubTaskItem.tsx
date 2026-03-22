import type { SubTask } from "../../../types/work-hub.types";

interface SubTaskItemProps {
  subtask: SubTask;
  depth: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  todo: "#94a3b8",
  inprogress: "#f59e0b",
  review: "#6c2eff",
  done: "#10b981",
};

const SubTaskItem = ({ subtask, depth, onToggle, onDelete }: SubTaskItemProps) => {
  const isDone = subtask.status === "done";

  return (
    <div
      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-wh-green-bg-light group"
      style={{ paddingLeft: `${12 + depth * 24}px` }}
    >
      <button
        onClick={() => onToggle(subtask.id)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          isDone
            ? "bg-wh-green-primary border-wh-green-primary"
            : "border-gray-300 hover:border-wh-green-primary"
        }`}
      >
        {isDone && <i className="fas fa-check text-white text-[10px]"></i>}
      </button>

      <span
        className={`flex-1 text-sm ${
          isDone ? "line-through text-gray-400" : "text-gray-700"
        }`}
      >
        {subtask.title}
      </span>

      {subtask.assignee && (
        <img
          src={subtask.assignee.avatar}
          alt={subtask.assignee.name}
          title={subtask.assignee.name}
          className="w-5 h-5 rounded-full flex-shrink-0"
        />
      )}

      {subtask.deadline && (
        <span className="text-[11px] text-gray-400 flex-shrink-0">
          {new Date(subtask.deadline).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}

      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: statusColors[subtask.status] }}
        title={subtask.status}
      />

      <button
        onClick={() => onDelete(subtask.id)}
        className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
      >
        <i className="fas fa-times text-xs"></i>
      </button>
    </div>
  );
};

export default SubTaskItem;

