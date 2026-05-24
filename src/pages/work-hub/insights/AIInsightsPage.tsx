import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MOCK_INSIGHTS } from "../../../data/work-hub-mock";
import InsightsDashboard from "../../../components/work-hub/insights/InsightsDashboard";
import AIGridResult from "../../../components/ai/AIGridResult";
import { orionAiService } from "../../../services/orionAiService";
import type { AiGridResponse } from "../../../types/orion-ai";

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
  const [asking, setAsking] = useState<"workspace" | "knowledge" | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      orionAiService.sprintSummary({ workspaceId }),
      orionAiService.deadlineInsights({ workspaceId }),
    ])
      .then(([summary, deadlines]) => {
        if (cancelled) return;
        setSprintSummary(summary);
        setDeadlineInsights(deadlines);
      })
      .catch(() => {
        if (!cancelled) {
          setSprintSummary(null);
          setDeadlineInsights(null);
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
      <InsightsDashboard data={MOCK_INSIGHTS} />
    </div>
  );
};

export default AIInsightsPage;

