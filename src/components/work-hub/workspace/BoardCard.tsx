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
      className="bg-white border border-[var(--wh-green-border-light)] rounded-xl p-5 cursor-pointer transition-all hover:shadow-md hover:border-[var(--wh-green-primary)] group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: board.color }}
          >
            <i className={`fas ${board.icon}`}></i>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-[var(--wh-green-primary)] transition-colors">
              {board.name}
            </h3>
            <p className="text-xs text-gray-500">
              {board.columns.length} columns
            </p>
          </div>
        </div>

        {/* Dropdown menu */}
        <div className="relative" ref={menuRef}>
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
              className="absolute right-0 top-8 w-36 bg-white border border-[var(--wh-green-border-light)] rounded-lg shadow-lg py-1 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit(board);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-[var(--wh-green-bg-light)] transition-colors"
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
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {board.description}
        </p>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>
            {taskCount.completed}/{taskCount.total} tasks completed
          </span>
          <span className="font-medium text-[var(--wh-green-text-primary)]">
            {Math.round(progress)}%
          </span>
        </div>
        <ProgressBar value={progress} size="sm" />
      </div>

      {/* Columns preview */}
      <div className="flex gap-2 flex-wrap">
        {board.columns.map((col) => (
          <span
            key={col.id}
            className="flex items-center gap-1.5 text-[11px] text-gray-500"
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: col.color }}
            ></span>
            {col.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BoardCard;
