import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import type {
  TaskStatus,
  TaskFormData,
  Workspace,
  Board,
  User,
  Label,
} from "../../../types/work-hub.types";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import {
  mapWorkspace,
  mapLabel,
} from "../../../features/work-hub/work-hub.mappers";
import { useTask } from "../../../hooks/useTask";
import { useViewMode } from "../../../hooks/useViewMode";
import { getUser } from "../../../utils/token";
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
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);

    const fetchData = async () => {
      try {
        const [wsData, labelsData] = await Promise.all([
          workHubApi.getWorkspace(workspaceId),
          workHubApi.getLabels(workspaceId),
        ]);

        const mapped = mapWorkspace(wsData);
        setWorkspace(mapped);
        setUsers(mapped.members.map((m) => m.user));
        setLabels(labelsData.map(mapLabel));

        if (boardId) {
          const foundBoard = mapped.boards.find((b) => b.id === boardId);
          setBoard(foundBoard || null);
        }
      } catch {
        setWorkspace(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workspaceId, boardId]);

  const authUser = getUser();
  const currentUser: User = authUser
    ? {
        id: authUser.userId ?? authUser.id ?? "",
        name: authUser.fullName,
        email: authUser.email ?? "",
        phone: authUser.phoneNumber ?? "",
        avatar: authUser.avatarUrl || "/avatar-user.png",
        status: "online" as const,
      }
    : users[0] || {
        id: "",
        name: "User",
        email: "",
        phone: "",
        avatar: "/avatar-user.png",
        status: "online" as const,
      };

  const {
    tasks,
    selectedTask,
    selectedTaskId,
    setSelectedTaskId,
    createTask,
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-wh-green-bg-light">
        <i
          className="fas fa-spinner fa-spin text-3xl"
          style={{ color: "#0d9488" }}
        ></i>
      </div>
    );
  }

  if (!workspace || !board) {
    return (
      <div className="flex-1 flex items-center justify-center bg-wh-green-bg-light">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-4xl text-wh-green-text-muted mb-3"></i>
          <p className="text-wh-green-text-primary font-semibold">
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

  const handleSaveTask = async (data: TaskFormData) => {
    const columnId =
      addToColumnId ||
      board.columns.find((c) => c.status === data.status)?.id ||
      board.columns[0]?.id ||
      "";
    try {
      await createTask({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        boardId: boardId || "",
        columnId,
        startDate: data.startDate,
        deadline: data.deadline,
        createdBy: currentUser,
        assignees: users.filter((u) => data.assigneeIds.includes(u.id)),
        labels: labels.filter((l) => data.labelIds.includes(l.id)),
        subtasks: [],
        comments: [],
        attachments: [],
      });
    } catch {
      // Lỗi
    }
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
      author: currentUser,
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
    const toUser = users.find((u) => u.id === toUserId);
    if (!toUser) return;
    void transferTask({
      taskId,
      fromUser: currentUser,
      toUser,
      reason,
      timestamp: new Date().toISOString(),
    });
  };

  const refetchBoard = async () => {
    if (!workspaceId) return;
    try {
      const wsData = await workHubApi.getWorkspace(workspaceId);
      const mapped = mapWorkspace(wsData);
      setWorkspace(mapped);
      setUsers(mapped.members.map((m) => m.user));
      if (boardId) {
        const foundBoard = mapped.boards.find((b) => b.id === boardId);
        setBoard(foundBoard || null);
      }
    } catch {
      // silent
    }
  };

  const handleAddColumn = async (
    name: string,
    status: string,
    color: string,
  ) => {
    if (!boardId) return;
    try {
      await workHubApi.createColumn(boardId, { name, status, color });
      await refetchBoard();
    } catch (err) {
      console.error("Failed to create column:", err);
    }
  };

  const handleEditColumn = async (columnId: string, name: string) => {
    if (!boardId) return;
    try {
      await workHubApi.updateColumn(boardId, columnId, { name });
      await refetchBoard();
    } catch (err) {
      console.error("Failed to update column:", err);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!boardId) return;
    try {
      await workHubApi.deleteColumn(boardId, columnId);
      await refetchBoard();
    } catch (err) {
      console.error("Failed to delete column:", err);
    }
  };

  const statuses = ["all", "todo", "inprogress", "review", "done"] as const;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-wh-green-bg-light">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-wh-green-border-light">
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
              className="px-4 py-2 bg-wh-green-primary text-white rounded-lg hover:bg-wh-green-primary-hover transition-colors text-sm font-medium"
            >
              <i className="fas fa-plus mr-2"></i>Add Task
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-wh-green-bg-light border border-wh-green-border-light rounded-lg px-3 py-1.5">
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
                    ? "bg-wh-green-primary text-white"
                    : "bg-wh-green-bg-heavy text-gray-600 hover:bg-wh-green-bg-medium"
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
            onAddColumn={handleAddColumn}
            onEditColumn={handleEditColumn}
            onDeleteColumn={handleDeleteColumn}
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
        users={users}
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
        users={users}
        labels={labels}
      />
    </div>
  );
};

export default BoardPage;

