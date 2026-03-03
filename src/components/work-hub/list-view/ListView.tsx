import type { Task, SortConfig } from "../../../types/work-hub.types";
import ListHeader from "./ListHeader";
import ListRow from "./ListRow";

interface ListViewProps {
  tasks: Task[];
  sortConfig: SortConfig[];
  onSort: (field: string) => void;
  onTaskClick: (taskId: string) => void;
}

const ListView = ({ tasks, sortConfig, onSort, onTaskClick }: ListViewProps) => {
  return (
    <div className="bg-white border border-[var(--wh-green-border-light)] rounded-lg overflow-hidden">
      <ListHeader sortConfig={sortConfig} onSort={onSort} />
      <div className="max-h-[600px] overflow-y-auto">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <ListRow key={task.id} task={task} onClick={onTaskClick} />
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-inbox text-2xl mb-2"></i>
            <p className="text-sm">No tasks found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView;
