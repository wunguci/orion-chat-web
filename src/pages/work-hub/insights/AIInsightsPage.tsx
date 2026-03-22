import { MOCK_INSIGHTS } from "../../../data/work-hub-mock";
import InsightsDashboard from "../../../components/work-hub/insights/InsightsDashboard";

const AIInsightsPage = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto overflow-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          {/* <i className="fas fa-brain mr-2 text-[var(--wh-green-primary)]"></i> */}
          AI Insights
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered analysis of your project progress, risks, and
          recommendations.
        </p>
      </div>
      <InsightsDashboard data={MOCK_INSIGHTS} />
    </div>
  );
};

export default AIInsightsPage;
