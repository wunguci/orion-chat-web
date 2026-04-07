import type { RiskAlert } from "../../../types/work-hub.types";

interface RiskAlertsListProps {
  alerts: RiskAlert[];
}

const typeIcons: Record<string, string> = {
  deadline: "fa-clock",
  stale: "fa-hourglass-half",
  overloaded: "fa-user-clock",
  low_completion: "fa-chart-line",
};

const RiskAlertsList = ({ alerts }: RiskAlertsListProps) => {
  return (
    <div className="bg-white border border-wh-green-border-light rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">
          <i className="fas fa-exclamation-triangle mr-2 text-amber-500"></i>
          Risk Alerts
        </h3>
        <span className="bg-red-50 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
          {alerts.length}
        </span>
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                alert.severity === "critical"
                  ? "bg-red-50 border-red-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  alert.severity === "critical"
                    ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                <i className={`fas ${typeIcons[alert.type] || "fa-exclamation"} text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{alert.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                      alert.severity === "critical"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-[10px] text-gray-400 capitalize">{alert.type.replace("_", " ")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400">
          <i className="fas fa-shield-alt text-xl mb-2"></i>
          <p className="text-sm">No risk alerts</p>
        </div>
      )}
    </div>
  );
};

export default RiskAlertsList;

