import type { Board } from "../../../types/work-hub.types";
import ProgressBar from "../../common/ProgressBar";

interface BoardCardProps {
  board: Board;
  taskCount: { total: number; completed: number };
  onClick: () => void;
}

const BoardCard = ({ board, taskCount, onClick }: BoardCardProps) => {
  const progress = taskCount.total > 0 ? (taskCount.completed / taskCount.total) * 100 : 0;

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
            <p className="text-xs text-gray-500">{board.columns.length} columns</p>
          </div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">
          <i className="fas fa-ellipsis-h text-xs"></i>
        </button>
      </div>

      {/* Description */}
      {board.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{board.description}</p>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>{taskCount.completed}/{taskCount.total} tasks completed</span>
          <span className="font-medium text-[var(--wh-green-text-primary)]">{Math.round(progress)}%</span>
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
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: col.color }}></span>
            {col.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BoardCard;
