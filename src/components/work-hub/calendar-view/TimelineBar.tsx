import type { Task } from "../../../types/work-hub.types";

interface TimelineBarProps {
  task: Task;
  startDate: Date;
  dayWidth: number;
  onClick: (taskId: string) => void;
}

const priorityColors: Record<string, string> = {
  low: "#3b82f6",
  medium: "#F59E0B",
  high: "#f97316",
  critical: "#ef4444",
};

const TimelineBar = ({
  task,
  startDate,
  dayWidth,
  onClick,
}: TimelineBarProps) => {
  const taskStart = task.startDate
    ? new Date(task.startDate)
    : new Date(task.createdAt);
  const taskEnd = task.deadline
    ? new Date(task.deadline)
    : new Date(taskStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const offsetDays = Math.max(
    0,
    Math.floor(
      (taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
  const durationDays = Math.max(
    1,
    Math.ceil(
      (taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  const left = offsetDays * dayWidth;
  const width = durationDays * dayWidth;
  const color = priorityColors[task.priority] || "#0d9488";

  return (
    <div
      className="absolute h-7 rounded-md cursor-pointer flex items-center px-2 text-white text-xs font-medium overflow-hidden hover:opacity-90 transition-opacity shadow-sm"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: color,
        top: "4px",
      }}
      onClick={() => onClick(task.id)}
      title={`${task.title}\n${taskStart.toLocaleDateString()} - ${taskEnd.toLocaleDateString()}`}
    >
      <span className="truncate">{task.title}</span>
    </div>
  );
};

export default TimelineBar;
