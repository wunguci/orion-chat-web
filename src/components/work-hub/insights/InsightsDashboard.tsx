import type { InsightsSummary } from "../../../types/work-hub.types";
import BurndownChart from "./BurndownChart";
import VelocityChart from "./VelocityChart";
import RiskAlertsList from "./RiskAlertsList";
import MemberPerformanceTable from "./MemberPerformanceTable";
import AISuggestionsPanel from "./AISuggestionsPanel";
import DailyDigestPreview from "./DailyDigestPreview";

interface InsightsDashboardProps {
  data: InsightsSummary;
}

const InsightsDashboard = ({ data }: InsightsDashboardProps) => {
  const completionRate = data.totalTasks > 0
    ? Math.round((data.completedTasks / data.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-wh-green-border-light rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-wh-green-primary">{data.progressPercentage}%</div>
          <div className="text-xs text-gray-500 mt-1">Overall Progress</div>
        </div>
        <div className="bg-white border border-wh-green-border-light rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{data.totalTasks}</div>
          <div className="text-xs text-gray-500 mt-1">Total Tasks</div>
        </div>
        <div className="bg-white border border-wh-green-border-light rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{data.completedTasks}</div>
          <div className="text-xs text-gray-500 mt-1">Completed</div>
        </div>
        <div className="bg-white border border-wh-green-border-light rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{data.overdueTasks}</div>
          <div className="text-xs text-gray-500 mt-1">Overdue</div>
        </div>
        <div className="bg-white border border-wh-green-border-light rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-500">{completionRate}%</div>
          <div className="text-xs text-gray-500 mt-1">Completion Rate</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BurndownChart data={data.burndownData} />
        <VelocityChart data={data.velocityData} />
      </div>

      {/* Risk Alerts */}
      <RiskAlertsList alerts={data.riskAlerts} />

      {/* Performance + Suggestions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MemberPerformanceTable data={data.memberPerformance} />
        <AISuggestionsPanel suggestions={data.aiSuggestions} />
      </div>

      {/* Daily Digest */}
      <DailyDigestPreview items={data.dailyDigest} />
    </div>
  );
};

export default InsightsDashboard;

