import type { Task } from "../../../types/work-hub.types";
import AvatarGroup from "../../common/AvatarGroup";

interface ListRowProps {
  task: Task;
  onClick: (taskId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  todo: { label: "To Do", color: "#94a3b8" },
  inprogress: { label: "In Progress", color: "#f59e0b" },
  review: { label: "Review", color: "#6c2eff" },
  done: { label: "Done", color: "#10b981" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "#3b82f6" },
  medium: { label: "Med", color: "#f59e0b" },
  high: { label: "High", color: "#f97316" },
  critical: { label: "Crit", color: "#ef4444" },
};

const ListRow = ({ task, onClick }: ListRowProps) => {
  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const subtaskTotal = task.subtasks.length;
  const subtaskDone = task.subtasks.filter((s) => s.status === "done").length;
  const progress = subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : 0;

  return (
    <div
      onClick={() => onClick(task.id)}
      className="flex items-center px-4 py-3 bg-white border-b border-wh-green-border-light hover:bg-wh-green-bg-light cursor-pointer transition-colors group"
    >
      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-wh-green-primary">
          {task.title}
        </p>
      </div>

      {/* Status */}
      <div className="w-28">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: status.color }}
        >
          {status.label}
        </span>
      </div>

      {/* Priority */}
      <div className="w-24">
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priority.color }} />
          {priority.label}
        </span>
      </div>

      {/* Assignees */}
      <div className="w-28">
        {task.assignees.length > 0 ? (
          <AvatarGroup
            users={task.assignees.map((a) => ({ src: a.avatar, alt: a.name }))}
            max={2}
            size="xs"
          />
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </div>

      {/* Deadline */}
      <div className="w-28">
        {task.deadline ? (
          <span className="text-xs text-gray-500">
            {new Date(task.deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </div>

      {/* Progress */}
      <div className="w-24">
        {subtaskTotal > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-wh-green-primary rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] text-gray-400">{progress}%</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </div>
    </div>
  );
};

export default ListRow;

