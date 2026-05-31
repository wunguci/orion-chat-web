import { useState, useRef, useEffect } from "react";
import type { Board } from "../../../types/work-hub.types";
import ProgressBar from "../../common/ProgressBar";

interface BoardCardProps {
  board: Board;
  taskCount: { total: number; completed: number };
  onClick: () => void;
  onEdit?: (board: Board) => void;
  onDelete?: (boardId: string) => void;
}

const BoardCard = ({
  board,
  taskCount,
  onClick,
  onEdit,
  onDelete,
}: BoardCardProps) => {
  const progress =
    taskCount.total > 0 ? (taskCount.completed / taskCount.total) * 100 : 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-wh-green-border-light rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:border-wh-green-primary group flex flex-col min-h-[160px]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
            style={{ backgroundColor: board.color }}
          >
            <i className={`fas ${board.icon} text-sm`}></i>
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="font-semibold text-gray-900 group-hover:text-wh-green-primary transition-colors truncate text-sm leading-tight"
              title={board.name}
            >
              {board.name}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {board.columns.length} columns
            </p>
          </div>
        </div>

        {/* Dropdown menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
          >
            <i className="fas fa-ellipsis-h text-xs"></i>
          </button>

          {menuOpen && (onEdit || onDelete) && (
            <div
              className="absolute right-0 top-8 w-36 bg-white border border-wh-green-border-light rounded-lg shadow-lg py-1 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit(board);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-wh-green-bg-light transition-colors"
                >
                  <i className="fas fa-edit text-xs text-gray-400 w-4 text-center"></i>
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(board.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <i className="fas fa-trash-alt text-xs w-4 text-center"></i>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {board.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-1">
          {board.description}
        </p>
      )}

      {/* Spacer to push progress to bottom */}
      <div className="flex-1" />

      {/* Progress */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>
            {taskCount.completed}/{taskCount.total} tasks
          </span>
          <span className="font-medium text-wh-green-text-primary">
            {Math.round(progress)}%
          </span>
        </div>
        <ProgressBar value={progress} size="sm" />
      </div>

      {/* Columns preview */}
      <div className="flex gap-1.5 flex-wrap mt-2">
        {board.columns.slice(0, 4).map((col) => (
          <span
            key={col.id}
            className="flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 rounded-full px-2 py-0.5"
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: col.color }}
            ></span>
            <span className="truncate max-w-[60px]">{col.name}</span>
          </span>
        ))}
        {board.columns.length > 4 && (
          <span className="text-[10px] text-gray-400">+{board.columns.length - 4}</span>
        )}
      </div>
    </div>
  );
};

export default BoardCard;
