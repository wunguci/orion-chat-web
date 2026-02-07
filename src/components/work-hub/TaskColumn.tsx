import TaskCard from "./TaskCard";

interface Task {
  id: string;
  title: string;
  labels: Array<{ text: string; type: "feature" | "bug" | "urgent" }>;
  date: string;
  assignees: string[];
}

interface TaskColumnProps {
  title: string;
  count: number;
  tasks: Task[];
  statusColor?: string;
  onAddTask?: () => void;
  onEditTask?: (id: string) => void;
  onDeleteTask?: (id: string) => void;
  onTaskClick?: (id: string) => void;
}

const TaskColumn = ({
  title,
  count,
  tasks,
  statusColor = "#94a3b8",
  onAddTask,
  onEditTask,
  onDeleteTask,
  onTaskClick,
}: TaskColumnProps) => {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          ></div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <span className="bg-slate-200 dark:bg-slate-700 px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400">
            {count}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={onAddTask}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[var(--color-primary)] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Add task"
          >
            <i className="fas fa-plus text-sm"></i>
          </button>
        )}
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              {...task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onClick={onTaskClick}
            />
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500">
            <i className="fas fa-inbox text-3xl mb-2 opacity-50"></i>
            <p className="text-sm">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskColumn;
