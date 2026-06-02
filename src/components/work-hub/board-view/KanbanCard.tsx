import { useState } from "react";
import type { Task } from "../../../types/work-hub.types";
import Badge from "../../common/Badge";
import AvatarGroup from "../../common/AvatarGroup";

interface KanbanCardProps {
  task: Task;
  onClick: (taskId: string) => void;
  onDragStart: (taskId: string) => void;
}

const priorityColors: Record<string, string> = {
  low: "#3b82f6",
  medium: "#F59E0B",
  high: "#f97316",
  critical: "#ef4444",
};

const KanbanCard = ({ task, onClick, onDragStart }: KanbanCardProps) => {
  const subtaskTotal = task.subtasks.length;
  const subtaskDone = task.subtasks.filter((s) => s.status === "done").length;
  const hasSubtasks = subtaskTotal > 0;
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        // CRITICAL: set dataTransfer so KanbanColumn drop handler receives the taskId
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        setIsDragging(true);
        onDragStart(task.id);
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={() => onClick(task.id)}
      className={`bg-white border rounded-lg p-4 cursor-grab transition-all duration-200 hover:shadow-md group select-none ${
        isDragging
          ? "opacity-50 border-dashed border-wh-green-primary shadow-none scale-95"
          : "border-wh-green-border-light hover:border-wh-green-primary hover:shadow-md"
      }`}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {task.labels.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-2.5">
          {task.labels.map((label) => (
            <Badge
              key={label.id}
              text={label.text}
              color={label.color}
              size="sm"
            />
          ))}
        </div>
      )}

      <h4 className="font-medium text-sm text-gray-900 mb-3 line-clamp-2 group-hover:text-wh-green-text-primary">
        {task.title}
      </h4>

      {hasSubtasks && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
            <span>
              <i className="fas fa-list-check mr-1"></i>
              {subtaskDone}/{subtaskTotal}
            </span>
            <span>{Math.round((subtaskDone / subtaskTotal) * 100)}%</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-wh-green-primary rounded-full transition-all"
              style={{ width: `${(subtaskDone / subtaskTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: priorityColors[task.priority] }}
            title={task.priority}
          />
          {task.deadline && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <i className="far fa-calendar text-[10px]"></i>
              {new Date(task.deadline).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
        {task.assignees.length > 0 && (
          <AvatarGroup
            users={task.assignees.map((a) => ({ src: a.avatar, alt: a.name }))}
            max={3}
            size="xs"
          />
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
