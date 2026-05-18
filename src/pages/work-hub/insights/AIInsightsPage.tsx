import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import InsightsDashboard from "../../../components/work-hub/insights/InsightsDashboard";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import type { InsightsSummary } from "../../../types/work-hub.types";

const AIInsightsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [data, setData] = useState<InsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    setError(false);

    workHubApi
      .getInsights(workspaceId)
      .then((res) => setData(res))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [workspaceId]);

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
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <i className="fas fa-spinner fa-spin text-xl mr-2" />
          Loading insights...
        </div>
      ) : error || !data ? (
        <div className="bg-white rounded-xl border border-wh-green-border-light p-8 text-center text-slate-400">
          <i className="fas fa-chart-line text-3xl mb-3" />
          <p className="text-sm">Unable to load insights right now.</p>
          <button
            onClick={() => {
              if (workspaceId) {
                setLoading(true);
                setError(false);
                workHubApi
                  .getInsights(workspaceId)
                  .then((res) => setData(res))
                  .catch(() => setError(true))
                  .finally(() => setLoading(false));
              }
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-wh-green-primary text-white text-sm hover:bg-wh-green-primary-hover"
          >
            Retry
          </button>
        </div>
      ) : (
        <InsightsDashboard data={data} />
      )}
    </div>
  );
};

export default AIInsightsPage;

