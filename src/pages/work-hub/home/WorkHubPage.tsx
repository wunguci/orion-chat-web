import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Board, Workspace } from "../../../types/work-hub.types";
import type { WorkspaceDashboardStatsResponse } from "../../../features/work-hub/work-hub.api.types";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import { mapWorkspace } from "../../../features/work-hub/work-hub.mappers";
import { dispatchWorkhubWorkspaceUpdated } from "../../../utils/workhubEvents";
import { getUser } from "../../../utils/token";
import BoardCard from "../../../components/work-hub/workspace/BoardCard";
import BoardFormDialog from "../../../components/work-hub/workspace/BoardFormDialog";

import { useWorkspace } from "../../../contexts/WorkspaceContext";
import { AlertTriangle } from "lucide-react";

const WorkHubPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const [dashboardStats, setDashboardStats] =
    useState<WorkspaceDashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);

  const loadWorkspaceDashboard = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);

    try {
      const statsData = await workHubApi.getDashboardStats(workspaceId);
      setDashboardStats(statsData);
    } catch {
      setDashboardStats(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadWorkspaceDashboard();
  }, [loadWorkspaceDashboard]);

  const stats =
    dashboardStats?.summary ??
    {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      reviewTasks: 0,
      todoTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      totalBoards: workspace?.boards.length ?? 0,
      totalMembers: workspace?.members.length ?? 0,
    };

  const todoCount = stats.todoTasks;

  const boardTaskCounts = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    for (const boardStat of dashboardStats?.boardStats ?? []) {
      map[boardStat.boardId] = {
        total: boardStat.totalTasks,
        completed: boardStat.completedTasks,
      };
    }
    return map;
  }, [dashboardStats]);

  const recentActivities = dashboardStats?.recentActivities ?? [];

  const completionRate = stats.completionRate;
  
  const { isOwner, isAdmin } = useWorkspace();
  const canManageWorkspace = isOwner || isAdmin;
  const canDisbandWorkspace = isOwner;

  const trendSeries = useMemo(() => {
    const source = dashboardStats?.trendLast7Days ?? [];

    if (source.length > 0) {
      return source.map((item) => {
        const date = new Date(item.date);
        const label = date.toLocaleDateString("en-US", { weekday: "short" });
        return {
          label,
          value: item.completed,
        };
      });
    }

    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return labels.map((label, index) => ({
      label,
      value: [2, 3, 4, 3, 2, 5, 3][index],
    }));
  }, [dashboardStats]);

  const getActivityIcon = (type: string): string => {
    const icons: Record<string, string> = {
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

  const getActivityColor = (type: string): string => {
    const colors: Record<string, string> = {
      created: "#0d9488",
      updated: "#5a9e9e",
      status_changed: "#F59E0B",
      assigned: "#3b82f6",
      transferred: "#8b5cf6",
      commented: "#10b981",
      attachment: "#6366f1",
      completed: "#10b981",
    };
    return colors[type] || "#0d9488";
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

  const handleSaveBoard = async (data: {
    name: string;
    description: string;
    color: string;
    icon: string;
  }) => {
    if (!workspaceId) return;
    try {
      if (editingBoard) {
        await workHubApi.updateBoard(workspaceId, editingBoard.id, {
          boardName: data.name,
          description: data.description,
          backgroundColor: data.color,
          icon: data.icon,
        });
      } else {
        await workHubApi.createBoard(workspaceId, {
          boardName: data.name,
          description: data.description,
          backgroundColor: data.color,
          icon: data.icon,
        });
      }
      await loadWorkspaceDashboard();
      dispatchWorkhubWorkspaceUpdated(workspaceId);
      setShowBoardForm(false);
      setEditingBoard(null);
    } catch (err) {
      console.error("Failed to save board:", err);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!workspaceId || !confirm("Ban co chac muon xoa board nay?")) return;
    try {
      await workHubApi.deleteBoard(workspaceId, boardId);
      await loadWorkspaceDashboard();
      dispatchWorkhubWorkspaceUpdated(workspaceId);
    } catch (err) {
      console.error("Failed to delete board:", err);
    }
  };

  const handleDisbandWorkspace = async () => {
    if (!workspaceId || !canDisbandWorkspace) return;
    try {
      await workHubApi.deleteWorkspace(workspaceId);
      navigate("/work-hub");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to disband WorkHub");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <i className="fas fa-spinner fa-spin text-3xl text-teal-600"></i>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100 px-6">
        <div className="text-center bg-white rounded-3xl border border-slate-200 px-8 py-10 shadow-sm max-w-md w-full">
          <i className="fas fa-folder-open text-5xl mb-4 text-slate-400"></i>
          <h2 className="text-xl font-semibold text-slate-800">
            Workspace not found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            The workspace you are looking for does not exist.
          </p>
          <button
            onClick={() => navigate("/work-hub")}
            className="mt-5 px-4 py-2 rounded-xl text-white font-medium bg-teal-600 transition hover:bg-teal-700"
          >
            Back to WorkHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-200/60">
      <div className="max-w-[1550px] mx-auto p-4 lg:p-6">
        <div className="rounded-[30px] border border-slate-200 bg-slate-50/90 shadow-lg overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-slate-200 bg-white/70 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <i className="fas fa-chart-pie"></i>
                </div> */}
                <div className="min-w-0">
                  {/* <h1 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
                    {workspace.name} Dashboard
                  </h1> */}
                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <i className="fas fa-home"></i>
                    <i className="fas fa-chevron-right text-[10px]"></i>
                    <span>WorkHub</span>
                    <i className="fas fa-chevron-right text-[10px]"></i>
                    <span>{workspace.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden md:flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-500 min-w-[220px]">
                  <i className="fas fa-search"></i>
                  <span className="truncate">Search tasks, boards...</span>
                </div>

                <div className="hidden sm:flex items-center -space-x-2 mr-1">
                  {workspace.members.slice(0, 4).map((m) => (
                    <img
                      key={m.user.id}
                      src={m.user.avatar}
                      alt={m.user.name}
                      title={m.user.name}
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                  {workspace.members.length > 4 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-teal-600 text-white text-xs font-semibold flex items-center justify-center">
                      +{workspace.members.length - 4}
                    </div>
                  )}
                </div>

                {canDisbandWorkspace && (
                  <button
                    onClick={() => setShowDisbandConfirm(true)}
                    className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Disband WorkHub"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-800">
                        Incoming Task Summary
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Weekly snapshot
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {workspace.boards.length} boards
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xl font-bold text-slate-800">
                        {stats.totalTasks}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Total</div>
                    </div>
                    <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
                      <div className="text-xl font-bold text-teal-700">
                        {stats.inProgressTasks}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        In Progress
                      </div>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xl font-bold text-emerald-700">
                        {stats.completedTasks}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Completed
                      </div>
                    </div>
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                      <div className="text-xl font-bold text-rose-700">
                        {stats.overdueTasks}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Overdue</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-800">
                        Productivity Pulse
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Completed trend (last 7 days)
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">Weekly</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 items-end">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <div className="text-4xl font-bold text-slate-800">
                        {completionRate}%
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        Task completion rate
                      </p>
                      <div className="mt-4 text-sm font-semibold text-emerald-600">
                        <i className="fas fa-arrow-up-right-dots mr-1"></i>
                        {stats.completedTasks} completed
                      </div>
                    </div>

                    <div className="h-44 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-end gap-3">
                      {trendSeries.map((item) => {
                        const maxVal = Math.max(
                          ...trendSeries.map((s) => s.value),
                          1,
                        );
                        const barHeight = Math.max(
                          16,
                          Math.round((item.value / maxVal) * 110),
                        );

                        return (
                          <div
                            key={item.label}
                            className="flex-1 flex flex-col items-center gap-2"
                          >
                            <div
                              className="w-full max-w-[30px] rounded-t-xl bg-teal-500/85"
                              style={{ height: `${barHeight}px` }}
                            ></div>
                            <span className="text-[11px] text-slate-500">
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-slate-800">
                      Boards
                    </h2>
                    <div className="flex items-center gap-3">
                      <button
                        disabled={!canManageWorkspace}
                        onClick={() => {
                          setEditingBoard(null);
                          setShowBoardForm(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-teal-600 transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <i className="fas fa-plus text-xs"></i>
                        Create Board
                      </button>
                      <span className="text-xs text-slate-500">
                        {workspace.boards.length} board
                        {workspace.boards.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-3 auto-rows-fr">
                    {workspace.boards.map((board: Board) => (
                      <BoardCard
                        key={board.id}
                        board={board}
                        taskCount={
                          boardTaskCounts[board.id] || {
                            total: 0,
                            completed: 0,
                          }
                        }
                        onClick={() =>
                          navigate(
                            `/work-hub/${workspaceId}/boards/${board.id}`,
                          )
                        }
                        onEdit={(b) => {
                          if (!canManageWorkspace) return;
                          setEditingBoard(b);
                          setShowBoardForm(true);
                        }}
                        onDelete={
                          canManageWorkspace ? handleDeleteBoard : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-500">
                        Good day
                      </div>
                      <h3
                        className="text-xl font-bold text-slate-800 mt-1 truncate"
                        title={workspace.name}
                      >
                        {workspace.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Team workspace overview
                      </p>
                    </div>
                    <div
                      className="w-24 h-24 rounded-full grid place-items-center flex-shrink-0 ml-4"
                      style={{
                        background: `conic-gradient(#0d9488 ${completionRate * 3.6}deg, #e2e8f0 0deg)`,
                      }}
                    >
                      <div className="w-[74px] h-[74px] bg-white rounded-full grid place-items-center border border-slate-200">
                        <div className="text-center">
                          <div className="text-xl font-bold text-slate-800">
                            {completionRate}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            done%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">To do</div>
                      <div className="text-lg font-bold text-slate-800 mt-1">
                        {todoCount}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">In progress</div>
                      <div className="text-lg font-bold text-amber-600 mt-1">
                        {stats.inProgressTasks}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-slate-800">
                      Recent Activity
                    </h2>
                    <button className="text-xs font-medium text-teal-600 hover:underline">
                      View All
                    </button>
                  </div>

                  {recentActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="fas fa-inbox text-3xl mb-3 text-slate-400"></i>
                      <p className="text-sm text-slate-500">
                        No recent activity
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {recentActivities.map((activity, index) => {
                        const iconColor = getActivityColor(activity.action);
                        return (
                          <div
                            key={activity.activityId}
                            className={`flex gap-3 py-3 ${
                              index !== recentActivities.length - 1
                                ? "border-b border-slate-200"
                                : ""
                            }`}
                          >
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: `${iconColor}18`,
                                color: iconColor,
                              }}
                            >
                              <i
                                className={`fas ${getActivityIcon(activity.action)}`}
                              ></i>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-sm mb-0.5">
                                <span className="font-semibold text-slate-900">
                                  {activity.user.fullName}
                                </span>{" "}
                                <span className="text-slate-600">
                                  {activity.description}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>
                                  {formatTimestamp(activity.timestamp)}
                                </span>
                                <span>in</span>
                                <span className="font-medium text-slate-700 truncate">
                                  {activity.task?.title || "Task"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h2 className="text-sm font-semibold text-slate-800 mb-4">
                    Your Team Today
                  </h2>
                  <div className="space-y-2">
                    {workspace.members.slice(0, 6).map((member) => (
                      <div
                        key={member.user.id}
                        onClick={() =>
                          window.dispatchEvent(
                            new CustomEvent("workhub:open-member-chat", {
                              detail: { userId: member.user.id },
                            }),
                          )
                        }
                        className="flex cursor-pointer items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={member.user.avatar}
                            alt={member.user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-800 truncate">
                              {member.user.name}
                            </div>
                            <div className="text-xs text-slate-500 capitalize">
                              {member.role}
                            </div>
                          </div>
                        </div>
                        <i className="fas fa-comment text-slate-400 text-xs"></i>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Board Form Dialog */}
      <BoardFormDialog
        isOpen={showBoardForm}
        onClose={() => {
          setShowBoardForm(false);
          setEditingBoard(null);
        }}
        onSave={handleSaveBoard}
        board={editingBoard ?? undefined}
      />

      {showDisbandConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Disband WorkHub?</h2>
            <p className="mt-2 text-sm text-gray-600">
              This will permanently remove the workspace, boards, tasks, files,
              and member access. This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDisbandConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDisbandWorkspace()}
                className="px-4 py-2 rounded-lg bg-rose-600 text-sm font-medium text-white hover:bg-rose-700"
              >
                Disband
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkHubPage;
