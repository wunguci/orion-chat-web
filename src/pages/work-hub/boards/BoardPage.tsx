import { useState } from "react";
import { useParams } from "react-router-dom";
import type { TaskStatus, TaskFormData } from "../../../types/work-hub.types";
import { MOCK_WORKSPACES, MOCK_USERS } from "../../../data/work-hub-mock";
import { useTask } from "../../../hooks/useTask";
import { useViewMode } from "../../../hooks/useViewMode";
import ViewSwitcher from "../../../components/work-hub/ViewSwitcher";
import KanbanBoard from "../../../components/work-hub/board-view/KanbanBoard";
import ListView from "../../../components/work-hub/list-view/ListView";
import CalendarView from "../../../components/work-hub/calendar-view/CalendarView";
import TaskDetailPanel from "../../../components/work-hub/task-detail/TaskDetailPanel";
import TaskModal from "../../../components/work-hub/TaskModal";

const BoardPage = () => {
  const { workspaceId, boardId } = useParams<{
    workspaceId: string;
    boardId: string;
  }>();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [addToColumnId, setAddToColumnId] = useState<string | null>(null);

  const workspace = MOCK_WORKSPACES.find((ws) => ws.id === workspaceId);
  const board = workspace?.boards.find((b) => b.id === boardId);

  const {
    tasks,
    selectedTask,
    selectedTaskId,
    setSelectedTaskId,
    moveTask,
    addComment,
    updateSubtask,
    deleteSubtask,
    addSubtask,
    transferTask,
  } = useTask(boardId || "");

  const {
    viewMode,
    setViewMode,
    sortConfigs,
    addSort,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    applyFiltersAndSort,
  } = useViewMode();

  if (!workspace || !board) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--wh-green-bg-light)]">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-4xl text-[var(--wh-green-text-muted)] mb-3"></i>
          <p className="text-[var(--wh-green-text-primary)] font-semibold">
            Board not found
          </p>
        </div>
      </div>
    );
  }

  const filteredTasks = applyFiltersAndSort(tasks);

  const handleTaskMove = (
    taskId: string,
    toColumnId: string,
    toStatus: TaskStatus,
  ) => {
    moveTask(taskId, toColumnId, toStatus);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleAddTask = (columnId: string) => {
    setAddToColumnId(columnId);
    setShowTaskModal(true);
  };

  const handleSaveTask = (_data: TaskFormData) => {
    setShowTaskModal(false);
    setAddToColumnId(null);
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    const col = board.columns.find((c) => c.status === status);
    if (col) moveTask(taskId, col.id, status);
  };

  const handleAddComment = (taskId: string, text: string) => {
    addComment(taskId, {
      text,
      author: MOCK_USERS[0],
      createdAt: new Date().toISOString(),
    });
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const findSubtask = (
      items: typeof task.subtasks,
    ): (typeof task.subtasks)[0] | undefined => {
      for (const st of items) {
        if (st.id === subtaskId) return st;
        const found = findSubtask(st.children);
        if (found) return found;
      }
      return undefined;
    };

    const st = findSubtask(task.subtasks);
    if (st) {
      updateSubtask(taskId, subtaskId, {
        status: st.status === "done" ? "todo" : "done",
      });
    }
  };

  const handleAddSubtask = (taskId: string, parentId: string | null) => {
    addSubtask(taskId, parentId, {
      parentId: parentId || taskId,
      title: "New subtask",
      status: "todo",
    });
  };

  const handleTransfer = (taskId: string, toUserId: string, reason: string) => {
    const toUser = MOCK_USERS.find((u) => u.id === toUserId);
    if (!toUser) return;
    transferTask({
      taskId,
      fromUser: MOCK_USERS[0],
      toUser,
      reason,
      timestamp: new Date().toISOString(),
    });
  };

  const statuses = ["all", "todo", "inprogress", "review", "done"] as const;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--wh-green-bg-light)]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[var(--wh-green-border-light)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: board.color }}
            >
              <i className={`fas ${board.icon} text-sm`}></i>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{board.name}</h1>
              {board.description && (
                <p className="text-xs text-gray-500">{board.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
            <button
              onClick={() => setShowTaskModal(true)}
              className="px-4 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg hover:bg-[var(--wh-green-primary-hover)] transition-colors text-sm font-medium"
            >
              <i className="fas fa-plus mr-2"></i>Add Task
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-[var(--wh-green-bg-light)] border border-[var(--wh-green-border-light)] rounded-lg px-3 py-1.5">
            <i className="fas fa-search text-gray-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="bg-transparent border-none outline-none text-sm w-40"
            />
          </div>

          {/* Status filter chips */}
          <div className="flex items-center gap-1">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterStatus === s
                    ? "bg-[var(--wh-green-primary)] text-white"
                    : "bg-[var(--wh-green-bg-heavy)] text-gray-600 hover:bg-[var(--wh-green-bg-medium)]"
                }`}
              >
                {s === "all"
                  ? "All"
                  : s === "inprogress"
                    ? "In Progress"
                    : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === "board" && (
          <KanbanBoard
            columns={board.columns}
            tasks={filteredTasks}
            onTaskMove={handleTaskMove}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTask}
          />
        )}
        {viewMode === "list" && (
          <ListView
            tasks={filteredTasks}
            sortConfig={sortConfigs}
            onSort={addSort}
            onTaskClick={handleTaskClick}
          />
        )}
        {viewMode === "calendar" && (
          <CalendarView tasks={filteredTasks} onTaskClick={handleTaskClick} />
        )}
      </div>

      {/* Task Detail Panel */}
      <TaskDetailPanel
        task={selectedTask}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onStatusChange={handleStatusChange}
        onAddComment={handleAddComment}
        onToggleSubtask={handleToggleSubtask}
        onDeleteSubtask={(taskId, subtaskId) =>
          deleteSubtask(taskId, subtaskId)
        }
        onAddSubtask={handleAddSubtask}
        onTransfer={handleTransfer}
        users={MOCK_USERS}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setAddToColumnId(null);
        }}
        onSave={handleSaveTask}
        initialStatus={
          addToColumnId
            ? board.columns.find((c) => c.id === addToColumnId)?.status ||
              "todo"
            : "todo"
        }
      />
    </div>
  );
};

export default BoardPage;
