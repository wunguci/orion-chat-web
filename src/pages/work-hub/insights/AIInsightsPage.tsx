import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import InsightsDashboard from "../../../components/work-hub/insights/InsightsDashboard";
import AIGridResult from "../../../components/ai/AIGridResult";
import { orionAiService } from "../../../services/orionAiService";
import type { AiGridResponse } from "../../../types/orion-ai";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import { mapUser } from "../../../features/work-hub/work-hub.mappers";
import type { InsightsSummary } from "../../../types/work-hub.types";

const AIInsightsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [sprintSummary, setSprintSummary] = useState<AiGridResponse | null>(
    null,
  );
  const [deadlineInsights, setDeadlineInsights] =
    useState<AiGridResponse | null>(null);
  const [workspaceAnswer, setWorkspaceAnswer] = useState<AiGridResponse | null>(
    null,
  );
  const [knowledgeAnswer, setKnowledgeAnswer] = useState<AiGridResponse | null>(
    null,
  );
  const [aiQuestion, setAiQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<InsightsSummary | null>(null);
  const [asking, setAsking] = useState<"workspace" | "knowledge" | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      orionAiService.sprintSummary({ workspaceId }),
      orionAiService.deadlineInsights({ workspaceId }),
      workHubApi.getDashboardStats(workspaceId),
      workHubApi.getReports(workspaceId),
      workHubApi.getWorkload(workspaceId),
    ])
      .then(([summary, deadlines, stats, reports, workload]) => {
        if (cancelled) return;
        setSprintSummary(summary);
        setDeadlineInsights(deadlines);
        setInsights(buildInsights(stats, reports, workload));
      })
      .catch(() => {
        if (!cancelled) {
          setSprintSummary(null);
          setDeadlineInsights(null);
          setInsights(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const handleAskWorkspace = async () => {
    if (!workspaceId || !aiQuestion.trim()) return;
    try {
      setAsking("workspace");
      const result = await orionAiService.askWorkspace({
        workspaceId,
        question: aiQuestion.trim(),
      });
      setWorkspaceAnswer(result);
    } finally {
      setAsking(null);
    }
  };

  const handleKnowledgeSearch = async () => {
    if (!workspaceId || !aiQuestion.trim()) return;
    try {
      setAsking("knowledge");
      const result = await orionAiService.knowledgeSearch({
        workspaceId,
        query: aiQuestion.trim(),
        topK: 5,
      });
      setKnowledgeAnswer(result);
    } finally {
      setAsking(null);
    }
  };

  return (
    <div className="p-6 mx-auto overflow-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          {/* <i className="fas fa-brain mr-2 text-wh-green-primary"></i> */}
          AI Insights
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered analysis of your project progress, risks, and
          recommendations.
        </p>
      </div>
      <div className="mb-6 rounded-lg border border-wh-green-border-light bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={aiQuestion}
            onChange={(event) => setAiQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleAskWorkspace();
              }
            }}
            placeholder="Hỏi AI workspace: Task nào priority cao nhất tuần này?"
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-wh-green-primary"
          />
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => void handleAskWorkspace()}
              disabled={!aiQuestion.trim() || asking !== null}
              className="rounded-lg bg-wh-green-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {asking === "workspace" ? "Đang hỏi..." : "Ask Workspace AI"}
            </button>
            <button
              type="button"
              onClick={() => void handleKnowledgeSearch()}
              disabled={!aiQuestion.trim() || asking !== null}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {asking === "knowledge" ? "Đang tìm..." : "Knowledge Search"}
            </button>
          </div>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {loading && (
          <div className="rounded-lg border border-wh-green-border-light bg-white p-4 text-sm text-gray-500 xl:col-span-2">
            AI is generating WorkHub insights...
          </div>
        )}
        {workspaceAnswer && <AIGridResult result={workspaceAnswer} compact />}
        {knowledgeAnswer && <AIGridResult result={knowledgeAnswer} compact />}
        {sprintSummary && <AIGridResult result={sprintSummary} compact />}
        {deadlineInsights && <AIGridResult result={deadlineInsights} compact />}
      </div>
      {insights ? (
        <InsightsDashboard data={insights} />
      ) : (
        <div className="rounded-lg border border-wh-green-border-light bg-white p-6 text-sm text-gray-500">
          No WorkHub data available for insights yet.
        </div>
      )}
    </div>
  );
};

function buildInsights(
  stats: Awaited<ReturnType<typeof workHubApi.getDashboardStats>>,
  reports: Awaited<ReturnType<typeof workHubApi.getReports>>,
  workload: Awaited<ReturnType<typeof workHubApi.getWorkload>>,
): InsightsSummary {
  const total = stats.summary.totalTasks;
  const completed = stats.summary.completedTasks;
  const remaining = Math.max(0, total - completed);
  const trend = stats.trendLast7Days;
  let completedSoFar = 0;

  const burndownData = trend.map((item, index) => {
    completedSoFar += item.completed;
    const ideal =
      trend.length <= 1
        ? remaining
        : Math.max(0, Math.round(total - (total / (trend.length - 1)) * index));
    return {
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      ideal,
      actual: Math.max(0, total - completedSoFar),
    };
  });

  const riskAlerts = [
    ...reports.overdue.slice(0, 5).map((task) => ({
      id: `overdue-${task.taskId}`,
      type: "deadline" as const,
      severity: task.daysOverdue >= 3 ? ("critical" as const) : ("warning" as const),
      message: `${task.title} is ${task.daysOverdue} day(s) overdue.`,
      taskId: task.taskId,
    })),
    ...workload
      .filter((member) => member.totalTasks >= 8 || member.overdueTasks > 0)
      .slice(0, 5)
      .map((member) => ({
        id: `workload-${member.user.userId}`,
        type: "overloaded" as const,
        severity:
          member.totalTasks >= 10 || member.overdueTasks >= 3
            ? ("critical" as const)
            : ("warning" as const),
        message: `${member.user.fullName} has ${member.totalTasks} assigned task(s), including ${member.overdueTasks} overdue.`,
        userId: member.user.userId,
      })),
  ];

  return {
    progressPercentage: stats.summary.completionRate,
    totalTasks: total,
    completedTasks: completed,
    overdueTasks: stats.summary.overdueTasks,
    unclaimedTasks: Math.max(
      0,
      total - workload.reduce((sum, member) => sum + member.totalTasks, 0),
    ),
    burndownData,
    velocityData: stats.boardStats.map((board) => ({
      sprint: board.boardName,
      planned: board.totalTasks,
      completed: board.completedTasks,
    })),
    riskAlerts,
    memberPerformance: reports.members.map((member) => ({
      user: mapUser(member.user),
      tasksCompleted: member.completedTasks,
      tasksInProgress:
        workload.find((item) => item.user.userId === member.user.userId)
          ?.inProgressTasks ?? 0,
      avgCompletionDays: member.avgCompletionDays,
      onTimeRate:
        member.totalTasks > 0
          ? Math.round((member.completedTasks / member.totalTasks) * 100)
          : 0,
    })),
    aiSuggestions: [
      ...(stats.summary.overdueTasks > 0
        ? [
            {
              id: "suggest-overdue",
              type: "deadline" as const,
              title: "Review overdue tasks",
              description:
                "Move overdue work into a short recovery plan or reassign blockers to available members.",
              actionLabel: "Open reports",
            },
          ]
        : []),
      ...(riskAlerts.some((alert) => alert.type === "overloaded")
        ? [
            {
              id: "suggest-balance",
              type: "reassign" as const,
              title: "Balance workload",
              description:
                "Some members are carrying more active tasks than the rest of the workspace.",
              actionLabel: "Open workload",
            },
          ]
        : []),
    ],
    dailyDigest: stats.recentActivities.map((activity) => ({
      id: activity.activityId,
      type:
        activity.action.includes("done") || activity.action.includes("DONE")
          ? ("completed" as const)
          : ("created" as const),
      message: activity.description,
      timestamp: activity.timestamp,
    })),
  };
}

export default AIInsightsPage;

