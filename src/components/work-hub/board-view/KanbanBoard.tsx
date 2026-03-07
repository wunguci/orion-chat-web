import type { BoardColumn, Task, TaskStatus } from "../../../types/work-hub.types";
import { useDragDrop } from "../../../hooks/useDragDrop";
import KanbanColumn from "./KanbanColumn";

interface KanbanBoardProps {
  columns: BoardColumn[];
  tasks: Task[];
  onTaskMove: (taskId: string, toColumnId: string, toStatus: TaskStatus) => void;
  onTaskClick: (taskId: string) => void;
  onAddTask: (columnId: string) => void;
}

const KanbanBoard = ({ columns, tasks, onTaskMove, onTaskClick, onAddTask }: KanbanBoardProps) => {
  const { draggedItemId, dragOverColumnId, handleDragStart, handleDragEnd, handleDragEnter, handleDragLeave } = useDragDrop();

  const getTasksByColumn = (columnId: string) =>
    tasks.filter((t) => t.columnId === columnId).sort((a, b) => a.order - b.order);

  const handleDrop = (columnId: string, column: BoardColumn) => {
    if (draggedItemId) {
      onTaskMove(draggedItemId, columnId, column.status);
    }
    handleDragEnd();
  };

  return (
    <div
      className="flex gap-4 overflow-x-auto pb-4"
      onDragEnd={handleDragEnd}
    >
      {columns
        .sort((a, b) => a.order - b.order)
        .map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByColumn(column.id)}
            onDrop={() => handleDrop(column.id, column)}
            onTaskClick={onTaskClick}
            onAddTask={() => onAddTask(column.id)}
            onDragStart={(taskId) => {
              handleDragStart(taskId);
            }}
            isDragOver={dragOverColumnId === column.id}
            onDragEnter={() => handleDragEnter(column.id)}
            onDragLeave={handleDragLeave}
          />
        ))}
    </div>
  );
};

export default KanbanBoard;
