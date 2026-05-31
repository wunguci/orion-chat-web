import { useState, useRef, useEffect } from "react";
import type { BoardColumn, Task } from "../../../types/work-hub.types";
import KanbanCard from "./KanbanCard";

interface KanbanColumnProps {
  column: BoardColumn;
  tasks: Task[];
  onDrop: (taskId: string) => void;
  onTaskClick: (taskId: string) => void;
  onAddTask: () => void;
  onDragStart: (taskId: string) => void;
  isDragOver: boolean;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onEditName?: (columnId: string, name: string) => void;
  onDelete?: (columnId: string) => void;
}

const KanbanColumn = ({
  column,
  tasks,
  onDrop,
  onTaskClick,
  onAddTask,
  onDragStart,
  isDragOver,
  onDragEnter,
  onDragLeave,
  onEditName,
  onDelete,
}: KanbanColumnProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== column.name && onEditName) {
      onEditName(column.id, trimmed);
    } else {
      setEditName(column.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      setEditName(column.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`flex flex-col min-w-[300px] max-w-[350px] rounded-xl transition-all ${
        isDragOver
          ? "bg-wh-green-bg-heavy border-2 border-dashed border-wh-green-primary"
          : "bg-wh-green-bg-light border border-wh-green-border-light"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        onDragEnter();
      }}
      onDragLeave={(e) => {
        // Only fire leave if we're actually leaving the column container
        const relatedTarget = e.relatedTarget as Node | null;
        if (e.currentTarget.contains(relatedTarget)) return;
        onDragLeave();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) {
          onDrop(taskId);
        }
        onDragLeave();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-wh-green-border-light">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color }}
          />
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyDown}
              className="font-semibold text-sm text-gray-800 bg-white border border-wh-green-primary rounded px-1.5 py-0.5 outline-none w-full min-w-0"
            />
          ) : (
            <h3
              className={`font-semibold text-sm text-gray-800 truncate ${onEditName ? "cursor-pointer hover:text-wh-green-primary" : ""}`}
              onClick={() => {
                if (onEditName) {
                  setEditName(column.name);
                  setIsEditing(true);
                }
              }}
              title={onEditName ? "Click to edit column name" : undefined}
            >
              {column.name}
            </h3>
          )}
          <span className="bg-wh-green-bg-heavy text-wh-green-text-primary px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onDelete && isHovered && (
            <button
              onClick={() => onDelete(column.id)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete column"
            >
              <i className="fas fa-trash text-xs"></i>
            </button>
          )}
          <button
            onClick={onAddTask}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-wh-green-primary hover:bg-wh-green-bg-heavy transition-colors"
            title="Add task"
          >
            <i className="fas fa-plus text-xs"></i>
          </button>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex flex-col gap-2.5 p-3 flex-1 overflow-y-auto max-h-[600px]">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              onDragStart={(id) => {
                onDragStart(id);
              }}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <i className="fas fa-inbox text-2xl mb-2 opacity-40"></i>
            <p className="text-xs">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;

