import { useMemo } from "react";
import type { Task } from "../../../types/work-hub.types";
import TimelineHeader from "./TimelineHeader";
import TimelineBar from "./TimelineBar";

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

const DAY_WIDTH = 40;

const CalendarView = ({ tasks, onTaskClick }: CalendarViewProps) => {
  const { startDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) {
      const now = new Date();
      return { startDate: now, totalDays: 28 };
    }

    let minDate = Infinity;
    let maxDate = -Infinity;

    for (const task of tasks) {
      const start = task.startDate ? new Date(task.startDate).getTime() : new Date(task.createdAt).getTime();
      const end = task.deadline ? new Date(task.deadline).getTime() : start + 7 * 24 * 60 * 60 * 1000;
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    }

    const sd = new Date(minDate);
    sd.setDate(sd.getDate() - 2);
    const ed = new Date(maxDate);
    ed.setDate(ed.getDate() + 3);
    const days = Math.max(14, Math.ceil((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24)));

    return { startDate: sd, totalDays: days };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="bg-white border border-wh-green-border-light rounded-lg p-12 text-center text-gray-400">
        <i className="fas fa-calendar-alt text-3xl mb-3"></i>
        <p className="text-sm">No tasks with dates to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-wh-green-border-light rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${200 + totalDays * DAY_WIDTH}px` }}>
          {/* Header row */}
          <div className="flex">
            <div className="w-[200px] min-w-[200px] bg-wh-green-bg-heavy px-4 py-2.5 border-r border-b border-wh-green-border-light">
              <span className="text-xs font-semibold text-gray-500 uppercase">Task</span>
            </div>
            <div className="flex-1">
              <TimelineHeader startDate={startDate} totalDays={totalDays} dayWidth={DAY_WIDTH} />
            </div>
          </div>

          {/* Task rows */}
          {tasks.map((task) => (
            <div key={task.id} className="flex border-b border-wh-green-border-light hover:bg-wh-green-bg-light">
              {/* Task name sidebar */}
              <div
                className="w-[200px] min-w-[200px] px-4 py-2 border-r border-wh-green-border-light flex items-center cursor-pointer"
                onClick={() => onTaskClick(task.id)}
              >
                <span className="text-sm text-gray-700 truncate hover:text-wh-green-primary">
                  {task.title}
                </span>
              </div>
              {/* Timeline area */}
              <div className="flex-1 relative h-9" style={{ minWidth: `${totalDays * DAY_WIDTH}px` }}>
                <TimelineBar task={task} startDate={startDate} dayWidth={DAY_WIDTH} onClick={onTaskClick} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;

