import type { DailyDigestItem } from "../../../types/work-hub.types";

interface DailyDigestPreviewProps {
  items: DailyDigestItem[];
}

const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  completed: { icon: "fa-check-circle", color: "text-green-600", bg: "bg-green-50" },
  created: { icon: "fa-plus-circle", color: "text-blue-600", bg: "bg-blue-50" },
  overdue: { icon: "fa-exclamation-circle", color: "text-red-600", bg: "bg-red-50" },
  assigned: { icon: "fa-user-plus", color: "text-purple-600", bg: "bg-purple-50" },
};

const DailyDigestPreview = ({ items }: DailyDigestPreviewProps) => {
  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-white border border-wh-green-border-light rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">
        <i className="fas fa-newspaper mr-2 text-wh-green-primary"></i>
        Daily Digest
      </h3>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => {
            const cfg = typeConfig[item.type] || typeConfig.created;
            return (
              <div key={item.id} className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}
                >
                  <i className={`fas ${cfg.icon} text-sm ${cfg.color}`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{item.message}</p>
                  <span className="text-[10px] text-gray-400">{formatTime(item.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400">
          <i className="fas fa-inbox text-xl mb-2"></i>
          <p className="text-sm">No activity today</p>
        </div>
      )}
    </div>
  );
};

export default DailyDigestPreview;

