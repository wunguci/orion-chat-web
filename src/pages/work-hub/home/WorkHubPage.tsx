import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Board, ActivityEntry } from "../../../types/work-hub.types";
import { MOCK_WORKSPACES, MOCK_TASKS } from "../../../data/work-hub-mock";
import StatCard from "../../../components/work-hub/StatCard";
import ProgressOverview from "../../../components/work-hub/ProgressOverview";
import BoardCard from "../../../components/work-hub/workspace/BoardCard";

const WorkHubPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  // Find the workspace
  const workspace = useMemo(
    () => MOCK_WORKSPACES.find((ws) => ws.id === workspaceId),
    [workspaceId],
  );

  // Get all board IDs for this workspace
  const boardIds = useMemo(
    () => (workspace ? workspace.boards.map((b) => b.id) : []),
    [workspace],
  );

  // Filter tasks that belong to boards in this workspace
  const workspaceTasks = useMemo(
    () => MOCK_TASKS.filter((t) => boardIds.includes(t.boardId)),
    [boardIds],
  );

  // Calculate stats
  const stats = useMemo(() => {
    const total = workspaceTasks.length;
    const completed = workspaceTasks.filter((t) => t.status === "done").length;
    const inProgress = workspaceTasks.filter(
      (t) => t.status === "inprogress",
    ).length;

    const now = new Date();
    const overdue = workspaceTasks.filter((t) => {
      if (t.status === "done" || !t.deadline) return false;
      return new Date(t.deadline) < now;
    }).length;

    return { total, completed, inProgress, overdue };
  }, [workspaceTasks]);

  // Count tasks per status
  const todoCount = workspaceTasks.filter((t) => t.status === "todo").length;

  // Compute task count per board
  const boardTaskCounts = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    if (!workspace) return map;
    for (const board of workspace.boards) {
      const boardTasks = workspaceTasks.filter((t) => t.boardId === board.id);
      map[board.id] = {
        total: boardTasks.length,
        completed: boardTasks.filter((t) => t.status === "done").length,
      };
    }
    return map;
  }, [workspace, workspaceTasks]);

  // Collect recent activities from all tasks, sort by timestamp desc, take last 5
  const recentActivities = useMemo(() => {
    const all: Array<ActivityEntry & { taskTitle: string }> = [];
    for (const task of workspaceTasks) {
      for (const entry of task.activityHistory) {
        all.push({ ...entry, taskTitle: task.title });
      }
    }
    all.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    return all.slice(0, 5);
  }, [workspaceTasks]);

  // Activity icon mapping
  const getActivityIcon = (type: ActivityEntry["type"]): string => {
    const icons: Record<ActivityEntry["type"], string> = {
      created: "fa-plus-circle",
      updated: "fa-edit",
      status_changed: "fa-exchange-alt",
      assigned: "fa-user-plus",
      transferred: "fa-share",
      commented: "fa-comment",
      attachment: "fa-paperclip",
      completed: "fa-check-circle",
    };
    return icons[type] || "fa-info-circle";
  };

  const getActivityColor = (type: ActivityEntry["type"]): string => {
    const colors: Record<ActivityEntry["type"], string> = {
      created: "#226262",
      updated: "#5a9e9e",
      status_changed: "#F59E0B",
      assigned: "#3b82f6",
      transferred: "#8b5cf6",
      commented: "#10b981",
      attachment: "#6366f1",
      completed: "#10b981",
    };
    return colors[type] || "#226262";
  };

  const formatTimestamp = (ts: string): string => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (!workspace) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: "var(--wh-green-bg-light)" }}
      >
        <div className="text-center">
          <i
            className="fas fa-folder-open text-5xl mb-4"
            style={{ color: "var(--wh-green-text-muted)" }}
          ></i>
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--wh-green-text-primary)" }}
          >
            Workspace not found
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--wh-green-text-muted)" }}
          >
            The workspace you are looking for does not exist.
          </p>
          <button
            onClick={() => navigate("/work-hub")}
            className="mt-4 px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--wh-green-primary)" }}
          >
            Back to WorkHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ backgroundColor: "var(--wh-green-bg-light)" }}
    >
      {/* Header */}
      <div
        className="px-6 lg:px-8 py-4 border-b"
        style={{
          backgroundColor: "#ffffff",
          borderColor: "var(--wh-green-border-light)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--wh-green-text-primary)" }}
            >
              Dashboard
            </h1>
            <div
              className="hidden md:flex items-center gap-2 text-sm"
              style={{ color: "var(--wh-green-text-muted)" }}
            >
              <i className="fas fa-home"></i>
              <i className="fas fa-chevron-right text-xs"></i>
              <span>WorkHub</span>
              <i className="fas fa-chevron-right text-xs"></i>
              <span>{workspace.name}</span>
              <i className="fas fa-chevron-right text-xs"></i>
              <span style={{ color: "var(--wh-green-text-primary)" }}>
                Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Members preview */}
            <div className="hidden sm:flex items-center -space-x-2 mr-2">
              {workspace.members.slice(0, 4).map((m) => (
                <img
                  key={m.user.id}
                  src={m.user.avatar}
                  alt={m.user.name}
                  title={m.user.name}
                  className="w-8 h-8 rounded-full border-2 border-white"
                />
              ))}
              {workspace.members.length > 4 && (
                <div
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-white"
                  style={{ backgroundColor: "var(--wh-green-primary)" }}
                >
                  +{workspace.members.length - 4}
                </div>
              )}
            </div>

            {/* Settings */}
            <button
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
              style={{
                backgroundColor: "var(--wh-green-bg-heavy)",
                color: "var(--wh-green-text-primary)",
              }}
            >
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon="fa-tasks"
              iconColor="#226262"
              value={stats.total}
              label="Total Tasks"
              trend={12}
              trendDirection="up"
            />
            <StatCard
              icon="fa-check-circle"
              iconColor="#10b981"
              value={stats.completed}
              label="Completed"
              trend={8}
              trendDirection="up"
            />
            <StatCard
              icon="fa-spinner"
              iconColor="#F59E0B"
              value={stats.inProgress}
              label="In Progress"
              trend={3}
              trendDirection="down"
            />
            <StatCard
              icon="fa-exclamation-triangle"
              iconColor="#ef4444"
              value={stats.overdue}
              label="Overdue"
              trend={stats.overdue > 0 ? 5 : 0}
              trendDirection="up"
            />
          </div>

          {/* Progress Overview */}
          <ProgressOverview
            totalTasks={stats.total}
            todoCount={todoCount}
            inProgressCount={stats.inProgress}
            completedCount={stats.completed}
            overdueCount={stats.overdue}
          />

          {/* Boards Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--wh-green-text-primary)" }}
              >
                <i className="fas fa-th-large mr-2"></i>
                Boards
              </h2>
              <span
                className="text-sm"
                style={{ color: "var(--wh-green-text-muted)" }}
              >
                {workspace.boards.length} board
                {workspace.boards.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspace.boards.map((board: Board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  taskCount={
                    boardTaskCounts[board.id] || { total: 0, completed: 0 }
                  }
                  onClick={() =>
                    navigate(`/work-hub/${workspaceId}/boards/${board.id}`)
                  }
                />
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--wh-green-text-primary)" }}
              >
                <i className="fas fa-clock mr-2"></i>
                Recent Activity
              </h2>
              <button
                className="text-sm font-medium hover:underline"
                style={{ color: "var(--wh-green-primary)" }}
              >
                View All
              </button>
            </div>

            <div
              className="bg-white rounded-xl p-5 border"
              style={{ borderColor: "var(--wh-green-border-light)" }}
            >
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <i
                    className="fas fa-inbox text-3xl mb-3"
                    style={{ color: "var(--wh-green-text-muted)" }}
                  ></i>
                  <p
                    className="text-sm"
                    style={{ color: "var(--wh-green-text-muted)" }}
                  >
                    No recent activity
                  </p>
                </div>
              ) : (
                recentActivities.map((activity, index) => {
                  const iconColor = getActivityColor(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className={`flex gap-4 py-3.5 ${
                        index !== recentActivities.length - 1 ? "border-b" : ""
                      }`}
                      style={{ borderColor: "var(--wh-green-border-light)" }}
                    >
                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${iconColor}18`,
                          color: iconColor,
                        }}
                      >
                        <i
                          className={`fas ${getActivityIcon(activity.type)}`}
                        ></i>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm mb-0.5">
                          <span className="font-semibold text-gray-900">
                            {activity.user.name}
                          </span>{" "}
                          <span className="text-gray-600">
                            {activity.description}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 text-xs"
                          style={{ color: "var(--wh-green-text-muted)" }}
                        >
                          <span>{formatTimestamp(activity.timestamp)}</span>
                          <span>in</span>
                          <span
                            className="font-medium"
                            style={{ color: "var(--wh-green-text-primary)" }}
                          >
                            {activity.taskTitle}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkHubPage;
