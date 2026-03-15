import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import { mapUser } from "../../../features/work-hub/work-hub.mappers";
import type { User } from "../../../types/work-hub.types";

interface WorkloadMember {
  user: User;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  doneTasks: number;
  overdueTasks: number;
  lowPriority: number;
  mediumPriority: number;
  highPriority: number;
  urgentPriority: number;
}

const WorkloadPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workloads, setWorkloads] = useState<WorkloadMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"cards" | "chart">("cards");

  const fetchWorkload = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const data = await workHubApi.getWorkload(workspaceId);
      const mapped: WorkloadMember[] = data.map((w) => ({
        user: mapUser(w.user),
        totalTasks: w.totalTasks,
        todoTasks: w.todoTasks,
        inProgressTasks: w.inProgressTasks,
        reviewTasks: w.reviewTasks,
        doneTasks: w.doneTasks,
        overdueTasks: w.overdueTasks,
        lowPriority: w.lowPriority,
        mediumPriority: w.mediumPriority,
        highPriority: w.highPriority,
        urgentPriority: w.urgentPriority,
      }));
      setWorkloads(mapped);
    } catch {
      setWorkloads([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchWorkload();
  }, [fetchWorkload]);

  const maxTasks =
    workloads.length > 0
      ? Math.max(...workloads.map((w) => w.totalTasks), 1)
      : 1;

  const getLoadStatus = (w: WorkloadMember) => {
    if (w.overdueTasks > 0)
      return {
        label: "Overloaded",
        color: "text-red-600",
        bg: "bg-red-50 border-red-200",
        bar: "bg-red-500",
      };
    if (w.totalTasks >= 10)
      return {
        label: "High Load",
        color: "text-orange-600",
        bg: "bg-orange-50 border-orange-200",
        bar: "bg-orange-500",
      };
    if (w.totalTasks >= 5)
      return {
        label: "Balanced",
        color: "text-green-600",
        bg: "bg-green-50 border-green-200",
        bar: "bg-green-500",
      };
    return {
      label: "Low Load",
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
      bar: "bg-blue-500",
    };
  };

  const totalTasks = workloads.reduce((s, w) => s + w.totalTasks, 0);
  const totalDone = workloads.reduce((s, w) => s + w.doneTasks, 0);
  const totalOverdue = workloads.reduce((s, w) => s + w.overdueTasks, 0);
  const completionRate =
    totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  // Loading state
  if (loading) {
    return (
      <div className="p-6 overflow-auto h-full">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">
            Workload & Resources
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualize task distribution and balance assignments across team
            members.
          </p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <i className="fas fa-spinner fa-spin text-2xl text-[var(--wh-green-primary)]" />
            <span className="text-sm text-gray-500">
              Loading workload data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (workloads.length === 0) {
    return (
      <div className="p-6 overflow-auto h-full">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">
            Workload & Resources
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualize task distribution and balance assignments across team
            members.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <i className="fas fa-users text-4xl text-gray-300" />
          <p className="text-gray-500">No workload data available</p>
          <p className="text-sm text-gray-400">
            Assign tasks to team members to see workload distribution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Workload & Resources
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualize task distribution and balance assignments across team
            members.
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView("cards")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "cards" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}
          >
            <i className="fas fa-th-large mr-1.5" />
            Cards
          </button>
          <button
            onClick={() => setView("chart")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${view === "chart" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}
          >
            <i className="fas fa-chart-bar mr-1.5" />
            Chart
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-4">
          <div className="text-sm text-gray-500">Total Assigned Tasks</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">
            {totalTasks}
          </div>
          <div className="text-xs text-gray-400">
            across {workloads.length} members
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-4">
          <div className="text-sm text-gray-500">Completion Rate</div>
          <div className="text-2xl font-bold text-[var(--wh-green-primary)] mt-1">
            {completionRate}%
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
            <div
              className="h-2 rounded-full bg-[var(--wh-green-primary)]"
              style={{
                width: `${completionRate}%`,
              }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-4">
          <div className="text-sm text-gray-500">Overdue Tasks</div>
          <div
            className={`text-2xl font-bold mt-1 ${totalOverdue > 0 ? "text-red-500" : "text-green-500"}`}
          >
            {totalOverdue}
          </div>
          <div className="text-xs text-gray-400">
            {totalOverdue === 0 ? "No overdue tasks" : "Need attention"}
          </div>
        </div>
      </div>

      {view === "cards" ? (
        /* Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workloads.map((w) => {
            const load = getLoadStatus(w);
            return (
              <div
                key={w.user.id}
                className={`bg-white rounded-xl border p-5 ${w.overdueTasks > 0 ? "border-red-200" : "border-[var(--wh-green-border-light)]"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={w.user.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${w.user.status === "online" ? "bg-green-400" : w.user.status === "away" ? "bg-yellow-400" : "bg-gray-300"}`}
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">
                        {w.user.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {w.user.email}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium border ${load.bg} ${load.color}`}
                  >
                    {load.label}
                  </span>
                </div>

                {/* Task count bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{w.totalTasks} tasks assigned</span>
                    {w.overdueTasks > 0 && (
                      <span className="text-red-500">
                        {w.overdueTasks} overdue
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${load.bar}`}
                      style={{
                        width: `${Math.min(100, (w.totalTasks / maxTasks) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Status breakdown */}
                <div className="grid grid-cols-4 gap-1 mb-3">
                  <div className="text-center p-1.5 bg-gray-50 rounded">
                    <div className="text-sm font-semibold text-gray-700">
                      {w.todoTasks}
                    </div>
                    <div className="text-[10px] text-gray-400">To Do</div>
                  </div>
                  <div className="text-center p-1.5 bg-gray-50 rounded">
                    <div className="text-sm font-semibold text-gray-700">
                      {w.inProgressTasks}
                    </div>
                    <div className="text-[10px] text-gray-400">Active</div>
                  </div>
                  <div className="text-center p-1.5 bg-gray-50 rounded">
                    <div className="text-sm font-semibold text-gray-700">
                      {w.reviewTasks}
                    </div>
                    <div className="text-[10px] text-gray-400">Review</div>
                  </div>
                  <div className="text-center p-1.5 bg-gray-50 rounded">
                    <div className="text-sm font-semibold text-gray-700">
                      {w.doneTasks}
                    </div>
                    <div className="text-[10px] text-gray-400">Done</div>
                  </div>
                </div>

                {/* Priority breakdown */}
                <div className="flex gap-2 text-xs">
                  {w.urgentPriority > 0 && (
                    <span className="text-red-500">
                      <i className="fas fa-exclamation-circle mr-0.5" />
                      {w.urgentPriority}
                    </span>
                  )}
                  {w.highPriority > 0 && (
                    <span className="text-orange-500">
                      <i className="fas fa-arrow-up mr-0.5" />
                      {w.highPriority}
                    </span>
                  )}
                  {w.mediumPriority > 0 && (
                    <span className="text-yellow-500">
                      <i className="fas fa-minus mr-0.5" />
                      {w.mediumPriority}
                    </span>
                  )}
                  {w.lowPriority > 0 && (
                    <span className="text-blue-400">
                      <i className="fas fa-arrow-down mr-0.5" />
                      {w.lowPriority}
                    </span>
                  )}
                </div>

                {/* Overdue indicator */}
                {w.overdueTasks > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-xs text-red-500">
                    <i className="fas fa-exclamation-triangle mr-1.5" />
                    {w.overdueTasks} overdue{" "}
                    {w.overdueTasks === 1 ? "task" : "tasks"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Chart View */
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Task Load per Member
          </h3>
          <div className="space-y-4">
            {workloads.map((w) => {
              const load = getLoadStatus(w);
              return (
                <div key={w.user.id} className="flex items-center gap-4">
                  <div className="w-28 flex items-center gap-2 flex-shrink-0">
                    <img
                      src={w.user.avatar}
                      alt=""
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm text-gray-700 truncate">
                      {w.user.name.split(" ").pop()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="relative w-full bg-gray-100 rounded-full h-6">
                      {/* Task bar segments */}
                      <div
                        className="absolute inset-y-0 left-0 flex rounded-full overflow-hidden"
                        style={{
                          width: `${(w.totalTasks / maxTasks) * 100}%`,
                        }}
                      >
                        {w.doneTasks > 0 && (
                          <div
                            className="bg-green-500 h-full"
                            style={{
                              width: `${(w.doneTasks / w.totalTasks) * 100}%`,
                            }}
                          />
                        )}
                        {w.reviewTasks > 0 && (
                          <div
                            className="bg-yellow-500 h-full"
                            style={{
                              width: `${(w.reviewTasks / w.totalTasks) * 100}%`,
                            }}
                          />
                        )}
                        {w.inProgressTasks > 0 && (
                          <div
                            className="bg-blue-500 h-full"
                            style={{
                              width: `${(w.inProgressTasks / w.totalTasks) * 100}%`,
                            }}
                          />
                        )}
                        {w.todoTasks > 0 && (
                          <div
                            className="bg-gray-400 h-full"
                            style={{
                              width: `${(w.todoTasks / w.totalTasks) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-20 text-right flex-shrink-0">
                    <span className={`text-sm font-semibold ${load.color}`}>
                      {w.totalTasks}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100 justify-center text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500" /> Done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-500" /> Review
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500" /> In Progress
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-400" /> To Do
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkloadPage;
