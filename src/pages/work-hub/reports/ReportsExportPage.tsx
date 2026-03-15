import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import { mapUser } from "../../../features/work-hub/work-hub.mappers";
import type { ReportDataResponse } from "../../../features/work-hub/work-hub.api.types";
import type { User } from "../../../types/work-hub.types";

type TabType = "period" | "board" | "member" | "overdue";

interface MappedReportData {
  period: ReportDataResponse["period"];
  boards: ReportDataResponse["boards"];
  members: {
    user: User;
    totalTasks: number;
    completedTasks: number;
    avgCompletionDays: number;
  }[];
  overdue: {
    taskId: string;
    title: string;
    dueDate: string;
    assignees: User[];
    daysOverdue: number;
  }[];
}

const BOARD_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f97316",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#ec4899",
  "#f59e0b",
];

const ReportsExportPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>("period");
  const [data, setData] = useState<MappedReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const res = await workHubApi.getReports(workspaceId);
      const mapped: MappedReportData = {
        period: res.period,
        boards: res.boards,
        members: res.members.map((m) => ({
          user: mapUser(m.user),
          totalTasks: m.totalTasks,
          completedTasks: m.completedTasks,
          avgCompletionDays: m.avgCompletionDays,
        })),
        overdue: res.overdue.map((o) => ({
          taskId: o.taskId,
          title: o.title,
          dueDate: o.dueDate,
          assignees: o.assignees.map(mapUser),
          daysOverdue: o.daysOverdue,
        })),
      };
      setData(mapped);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "period", label: "Overview", icon: "fa-calendar-alt" },
    { id: "board", label: "By Board", icon: "fa-columns" },
    { id: "member", label: "By Member", icon: "fa-users" },
    { id: "overdue", label: "Overdue", icon: "fa-exclamation-triangle" },
  ];

  const handleExport = (format: "csv" | "pdf") => {
    if (!data) return;

    if (format === "csv") {
      let csv = "";

      // Period overview
      csv += "=== Overview ===\n";
      csv += "Total Tasks,Completed Tasks,New Tasks,Completion Rate\n";
      csv += `${data.period.totalTasks},${data.period.completedTasks},${data.period.newTasks},${data.period.completionRate}%\n\n`;

      // Boards
      csv += "=== By Board ===\n";
      csv += "Board,Total Tasks,Completed,In Progress\n";
      data.boards.forEach((b) => {
        csv += `${b.boardName},${b.totalTasks},${b.completedTasks},${b.inProgressTasks}\n`;
      });
      csv += "\n";

      // Members
      csv += "=== By Member ===\n";
      csv += "Member,Total Tasks,Completed,Avg Completion Days\n";
      data.members.forEach((m) => {
        csv += `${m.user.name},${m.totalTasks},${m.completedTasks},${m.avgCompletionDays}\n`;
      });
      csv += "\n";

      // Overdue
      csv += "=== Overdue Tasks ===\n";
      csv += "Task,Due Date,Days Overdue,Assignees\n";
      data.overdue.forEach((o) => {
        csv += `"${o.title}",${o.dueDate},${o.daysOverdue},"${o.assignees.map((a) => a.name).join(", ")}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "workspace-report.csv";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert("PDF export coming soon. Use CSV export for now.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 overflow-auto h-full">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Reports & Export
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Custom reports on task completion, team performance, and trends.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <i className="fas fa-spinner fa-spin text-2xl text-[var(--wh-green-primary)]" />
            <span className="text-sm text-gray-500">
              Loading report data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 overflow-auto h-full">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Reports & Export
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Custom reports on task completion, team performance, and trends.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-12 text-center">
          <i className="fas fa-chart-bar text-4xl text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">
            Unable to load report data. Please try again later.
          </p>
          <button
            onClick={fetchReports}
            className="mt-3 px-4 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg text-sm hover:bg-[var(--wh-green-primary-hover)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const maxBoardTasks = Math.max(...data.boards.map((b) => b.totalTasks), 1);

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Reports & Export</h1>
          <p className="text-sm text-gray-500 mt-1">
            Custom reports on task completion, team performance, and trends.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <i className="fas fa-file-csv mr-1.5" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="px-3 py-2 bg-[var(--wh-green-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--wh-green-primary-hover)] transition-colors"
          >
            <i className="fas fa-file-pdf mr-1.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white shadow-sm text-gray-800"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className={`fas ${tab.icon} mr-1.5`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-[var(--wh-green-border-light)] p-6">
        {activeTab === "period" && (
          <>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Period Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {data.period.totalTasks}
                </div>
                <div className="text-xs text-gray-500 mt-1">Total Tasks</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.period.completedTasks}
                </div>
                <div className="text-xs text-gray-500 mt-1">Completed</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.period.newTasks}
                </div>
                <div className="text-xs text-gray-500 mt-1">New Tasks</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.period.completionRate}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Completion Rate
                </div>
              </div>
            </div>

            {/* Completion rate visual bar */}
            <div className="mt-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Overall Progress</span>
                <span className="text-sm font-semibold text-[var(--wh-green-primary)]">
                  {data.period.completionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4">
                <div
                  className="h-4 rounded-full bg-[var(--wh-green-primary)] transition-all"
                  style={{
                    width: `${Math.min(data.period.completionRate, 100)}%`,
                  }}
                />
              </div>
              <div className="flex gap-6 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[var(--wh-green-primary)]" />
                  Completed ({data.period.completedTasks})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-gray-200" />
                  Remaining (
                  {data.period.totalTasks - data.period.completedTasks})
                </span>
              </div>
            </div>
          </>
        )}

        {activeTab === "board" && (
          <>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Completion by Board
            </h3>
            {data.boards.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No board data available.
              </p>
            ) : (
              <div className="space-y-4">
                {data.boards.map((row, i) => {
                  const pct =
                    row.totalTasks > 0
                      ? Math.round((row.completedTasks / row.totalTasks) * 100)
                      : 0;
                  const color = BOARD_COLORS[i % BOARD_COLORS.length];
                  return (
                    <div key={row.boardId}>
                      <div className="flex justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {row.boardName}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {row.completedTasks} / {row.totalTasks} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all"
                          style={{
                            width: `${(row.totalTasks / maxBoardTasks) * 100}%`,
                            backgroundColor: color,
                            opacity: 0.3,
                          }}
                        />
                        <div
                          className="h-3 rounded-full transition-all -mt-3"
                          style={{
                            width: `${(row.completedTasks / maxBoardTasks) * 100}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-400">
                        <span>In Progress: {row.inProgressTasks}</span>
                        <span>
                          Remaining:{" "}
                          {row.totalTasks -
                            row.completedTasks -
                            row.inProgressTasks}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "member" && (
          <>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Performance by Member
            </h3>
            {data.members.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No member data available.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 text-gray-500 font-medium">
                        Member
                      </th>
                      <th className="text-center py-3 px-2 text-gray-500 font-medium">
                        Completed
                      </th>
                      <th className="text-center py-3 px-2 text-gray-500 font-medium">
                        Total
                      </th>
                      <th className="text-center py-3 px-2 text-gray-500 font-medium">
                        Rate
                      </th>
                      <th className="text-center py-3 px-2 text-gray-500 font-medium">
                        Avg Days
                      </th>
                      <th className="py-3 px-2 text-gray-500 font-medium">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.members.map((row, i) => {
                      const rate =
                        row.totalTasks > 0
                          ? Math.round(
                              (row.completedTasks / row.totalTasks) * 100,
                            )
                          : 0;
                      return (
                        <tr
                          key={i}
                          className="border-b border-gray-50 hover:bg-gray-50"
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={row.user.avatar}
                                alt=""
                                className="w-7 h-7 rounded-full"
                              />
                              <span className="font-medium text-gray-700">
                                {row.user.name}
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-2 text-gray-800 font-semibold">
                            {row.completedTasks}
                          </td>
                          <td className="text-center py-3 px-2 text-gray-600">
                            {row.totalTasks}
                          </td>
                          <td className="text-center py-3 px-2">
                            <span
                              className={`font-semibold ${rate >= 80 ? "text-green-600" : rate >= 60 ? "text-yellow-600" : "text-red-600"}`}
                            >
                              {rate}%
                            </span>
                          </td>
                          <td className="text-center py-3 px-2 text-gray-600">
                            {row.avgCompletionDays}d
                          </td>
                          <td className="py-3 px-2 w-32">
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${rate >= 80 ? "bg-green-500" : rate >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === "overdue" && (
          <>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Overdue Tasks
            </h3>
            {data.overdue.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-check-circle text-3xl text-green-400 mb-2" />
                <p className="text-sm text-gray-400">
                  No overdue tasks. Great job!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.overdue.map((item) => (
                  <div
                    key={item.taskId}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            item.daysOverdue >= 7
                              ? "bg-red-100 text-red-700"
                              : item.daysOverdue >= 3
                                ? "bg-orange-100 text-orange-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {item.daysOverdue}d overdue
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>
                          <i className="fas fa-calendar mr-1" />
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </span>
                        {item.assignees.length > 0 && (
                          <span className="flex items-center gap-1">
                            <i className="fas fa-users mr-1" />
                            {item.assignees.map((a) => a.name).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex -space-x-2 ml-3">
                      {item.assignees.slice(0, 3).map((a) => (
                        <img
                          key={a.id}
                          src={a.avatar}
                          alt={a.name}
                          title={a.name}
                          className="w-6 h-6 rounded-full border-2 border-white"
                        />
                      ))}
                      {item.assignees.length > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-500">
                          +{item.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Summary bar */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    <i className="fas fa-exclamation-circle mr-1 text-red-400" />
                    {data.overdue.filter((o) => o.daysOverdue >= 7).length}{" "}
                    critical (7+ days)
                  </span>
                  <span>
                    <i className="fas fa-exclamation-triangle mr-1 text-orange-400" />
                    {
                      data.overdue.filter(
                        (o) => o.daysOverdue >= 3 && o.daysOverdue < 7,
                      ).length
                    }{" "}
                    warning (3-6 days)
                  </span>
                  <span>
                    <i className="fas fa-clock mr-1 text-yellow-400" />
                    {data.overdue.filter((o) => o.daysOverdue < 3).length}{" "}
                    recent (1-2 days)
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsExportPage;
