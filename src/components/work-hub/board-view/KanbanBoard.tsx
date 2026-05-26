import { useState } from "react";
import type {
  BoardColumn,
  Task,
  TaskStatus,
} from "../../../types/work-hub.types";
import { useDragDrop } from "../../../hooks/useDragDrop";
import KanbanColumn from "./KanbanColumn";

interface KanbanBoardProps {
  columns: BoardColumn[];
  tasks: Task[];
  onTaskMove: (
    taskId: string,
    toColumnId: string,
    toStatus: TaskStatus,
  ) => void;
  onTaskClick: (taskId: string) => void;
  onAddTask: (columnId: string) => void;
  onAddColumn?: (name: string, status: string, color: string) => void;
  onEditColumn?: (columnId: string, name: string) => void;
  onDeleteColumn?: (columnId: string) => void;
}

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REVIEW", label: "Review" },
  { value: "DONE", label: "Done" },
];

const COLOR_OPTIONS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

const KanbanBoard = ({
  columns,
  tasks,
  onTaskMove,
  onTaskClick,
  onAddTask,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
}: KanbanBoardProps) => {
  const {
    draggedItemId,
    dragOverColumnId,
    handleDragStart,
    handleDragEnd,
    handleDragEnter,
    handleDragLeave,
  } = useDragDrop();
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnStatus, setNewColumnStatus] = useState("TODO");
  const [newColumnColor, setNewColumnColor] = useState("#6366f1");

  const getTasksByColumn = (columnId: string) =>
    tasks
      .filter((t) => t.columnId === columnId)
      .sort((a, b) => a.order - b.order);

  const handleDrop = (taskId: string, columnId: string, column: BoardColumn) => {
    const nextTaskId = taskId || draggedItemId;
    if (nextTaskId) {
      onTaskMove(nextTaskId, columnId, column.status);
    }
    handleDragEnd();
  };

  const handleAddColumnSubmit = () => {
    const trimmed = newColumnName.trim();
    if (trimmed && onAddColumn) {
      onAddColumn(trimmed, newColumnStatus, newColumnColor);
      setNewColumnName("");
      setNewColumnStatus("TODO");
      setNewColumnColor("#6366f1");
      setShowAddColumn(false);
    }
  };

  const handleAddColumnKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddColumnSubmit();
    } else if (e.key === "Escape") {
      setShowAddColumn(false);
      setNewColumnName("");
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" onDragEnd={handleDragEnd}>
      {columns
        .sort((a, b) => a.order - b.order)
        .map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByColumn(column.id)}
            onDrop={(taskId) => handleDrop(taskId, column.id, column)}
            onTaskClick={onTaskClick}
            onAddTask={() => onAddTask(column.id)}
            onDragStart={(taskId) => {
              handleDragStart(taskId);
            }}
            isDragOver={dragOverColumnId === column.id}
            onDragEnter={() => handleDragEnter(column.id)}
            onDragLeave={handleDragLeave}
            onEditName={onEditColumn}
            onDelete={onDeleteColumn}
          />
        ))}

      {/* Add Column Button / Form */}
      {onAddColumn && (
        <div className="min-w-[300px] max-w-[350px] flex-shrink-0">
          {showAddColumn ? (
            <div className="bg-wh-green-bg-light border border-wh-green-border-light rounded-xl p-4">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={handleAddColumnKeyDown}
                placeholder="Column name..."
                autoFocus
                className="w-full px-3 py-2 border border-wh-green-border-light rounded-lg text-sm outline-none focus:border-wh-green-primary mb-3"
              />
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">
                  Status
                </label>
                <select
                  value={newColumnStatus}
                  onChange={(e) => setNewColumnStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-wh-green-border-light rounded-lg text-sm outline-none focus:border-wh-green-primary bg-white"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">
                  Color
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewColumnColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        newColumnColor === color
                          ? "border-gray-800 scale-110"
                          : "border-transparent hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddColumnSubmit}
                  disabled={!newColumnName.trim()}
                  className="flex-1 px-3 py-1.5 bg-wh-green-primary text-white rounded-lg text-sm font-medium hover:bg-wh-green-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Column
                </button>
                <button
                  onClick={() => {
                    setShowAddColumn(false);
                    setNewColumnName("");
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddColumn(true)}
              className="w-full h-16 border-2 border-dashed border-wh-green-border-light rounded-xl flex items-center justify-center gap-2 text-gray-400 hover:text-wh-green-primary hover:border-wh-green-primary transition-colors"
            >
              <i className="fas fa-plus text-sm"></i>
              <span className="text-sm font-medium">Add Column</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;

