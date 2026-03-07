import type { SubTask } from "../../../types/work-hub.types";
import SubTaskItem from "./SubTaskItem";

interface SubTaskListProps {
  subtasks: SubTask[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string | null) => void;
  maxDepth?: number;
}

const SubTaskList = ({ subtasks, onToggle, onDelete, onAdd, maxDepth = 3 }: SubTaskListProps) => {
  const totalCount = countAll(subtasks);
  const doneCount = countDone(subtasks);
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div>
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>
              {doneCount}/{totalCount} subtasks
            </span>
            <span className="font-medium text-[var(--wh-green-text-primary)]">{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--wh-green-primary)] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask tree */}
      <div className="space-y-0.5">
        <RenderTree
          subtasks={subtasks}
          depth={0}
          maxDepth={maxDepth}
          onToggle={onToggle}
          onDelete={onDelete}
          onAdd={onAdd}
        />
      </div>

      {/* Add root subtask */}
      <button
        onClick={() => onAdd(null)}
        className="mt-2 flex items-center gap-2 text-sm text-[var(--wh-green-text-muted)] hover:text-[var(--wh-green-primary)] py-1.5 px-3 rounded-lg hover:bg-[var(--wh-green-bg-light)] transition-colors"
      >
        <i className="fas fa-plus text-xs"></i>
        Add subtask
      </button>
    </div>
  );
};

function RenderTree({
  subtasks,
  depth,
  maxDepth,
  onToggle,
  onDelete,
  onAdd,
}: {
  subtasks: SubTask[];
  depth: number;
  maxDepth: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string | null) => void;
}) {
  return (
    <>
      {subtasks.map((st) => (
        <div key={st.id}>
          <SubTaskItem subtask={st} depth={depth} onToggle={onToggle} onDelete={onDelete} />
          {st.children.length > 0 && (
            <RenderTree
              subtasks={st.children}
              depth={depth + 1}
              maxDepth={maxDepth}
              onToggle={onToggle}
              onDelete={onDelete}
              onAdd={onAdd}
            />
          )}
          {depth < maxDepth - 1 && (
            <button
              onClick={() => onAdd(st.id)}
              className="ml-12 text-[11px] text-gray-300 hover:text-[var(--wh-green-text-muted)] py-0.5 transition-colors"
              style={{ marginLeft: `${36 + depth * 24}px` }}
            >
              <i className="fas fa-plus mr-1"></i>Add child
            </button>
          )}
        </div>
      ))}
    </>
  );
}

function countAll(subtasks: SubTask[]): number {
  let count = 0;
  for (const st of subtasks) {
    count++;
    count += countAll(st.children);
  }
  return count;
}

function countDone(subtasks: SubTask[]): number {
  let count = 0;
  for (const st of subtasks) {
    if (st.status === "done") count++;
    count += countDone(st.children);
  }
  return count;
}

export default SubTaskList;
