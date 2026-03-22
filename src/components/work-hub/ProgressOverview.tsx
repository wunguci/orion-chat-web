interface ProgressOverviewProps {
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  completedCount: number;
  overdueCount: number;
}

const ProgressOverview = ({
  totalTasks,
  todoCount,
  inProgressCount,
  completedCount,
  overdueCount,
}: ProgressOverviewProps) => {
  const pct = (count: number) => (totalTasks > 0 ? (count / totalTasks) * 100 : 0);

  const segments = [
    { label: "To Do", count: todoCount, color: "#94a3b8" },
    { label: "In Progress", count: inProgressCount, color: "#f59e0b" },
    { label: "Completed", count: completedCount, color: "#10b981" },
    { label: "Overdue", count: overdueCount, color: "#ef4444" },
  ];

  return (
    <div className="bg-white border border-wh-green-border-light rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-gray-900">Task Progress</h3>
        <div className="flex items-center gap-4 text-xs">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
              <span className="text-gray-500">{s.label}:</span>
              <span className="font-bold text-gray-800">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
        {segments.map(
          (s) =>
            s.count > 0 && (
              <div
                key={s.label}
                className="h-full transition-all duration-500 hover:opacity-80"
                style={{ width: `${pct(s.count)}%`, backgroundColor: s.color }}
                title={`${s.label}: ${s.count}`}
              />
            )
        )}
      </div>

      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>0%</span>
        <span className="font-medium text-wh-green-text-primary">
          {Math.round(pct(completedCount))}% completed
        </span>
        <span>100%</span>
      </div>
    </div>
  );
};

export default ProgressOverview;

