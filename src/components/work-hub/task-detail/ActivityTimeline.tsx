import type { ActivityEntry } from "../../../types/work-hub.types";

interface ActivityTimelineProps {
  activities: ActivityEntry[];
}

const typeConfig: Record<string, { icon: string; color: string }> = {
  created: { icon: "fa-plus-circle", color: "#0d9488" },
  updated: { icon: "fa-edit", color: "#3b82f6" },
  status_changed: { icon: "fa-exchange-alt", color: "#F59E0B" },
  assigned: { icon: "fa-user-plus", color: "#3b82f6" },
  transferred: { icon: "fa-share", color: "#8b5cf6" },
  commented: { icon: "fa-comment", color: "#6366f1" },
  attachment: { icon: "fa-paperclip", color: "#f97316" },
  completed: { icon: "fa-check-circle", color: "#10b981" },
};

const ActivityTimeline = ({ activities }: ActivityTimelineProps) => {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <i className="fas fa-history text-xl mb-2"></i>
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-wh-green-border-light" />

      <div className="space-y-4">
        {sorted.map((activity) => {
          const config = typeConfig[activity.type] || {
            icon: "fa-circle",
            color: "#94a3b8",
          };
          return (
            <div key={activity.id} className="flex gap-4 relative">
              {/* Dot */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                style={{
                  backgroundColor: `${config.color}18`,
                  color: config.color,
                }}
              >
                <i className={`fas ${config.icon} text-sm`}></i>
              </div>

              {/* Content */}
              <div className="flex-1 pt-2">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold text-gray-800">
                    {activity.user.name}
                  </span>{" "}
                  {activity.description}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {new Date(activity.timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;

