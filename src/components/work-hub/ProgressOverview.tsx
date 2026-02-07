interface ProgressOverviewProps {
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  completedCount: number;
  overdueCount: number;
  weeklyTrend: {
    total: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

const ProgressOverview = ({
  totalTasks,
  todoCount,
  inProgressCount,
  completedCount,
  overdueCount,
  weeklyTrend,
}: ProgressOverviewProps) => {
  const calculatePercentage = (count: number) => {
    return totalTasks > 0 ? (count / totalTasks) * 100 : 0;
  };

  const stats = [
    {
      icon: "fa-clipboard-list",
      iconColor: "primary",
      value: totalTasks,
      label: "Total Tasks",
      trend: weeklyTrend.total,
    },
    {
      icon: "fa-clock",
      iconColor: "warning",
      value: inProgressCount,
      label: "In Progress",
      trend: weeklyTrend.inProgress,
    },
    {
      icon: "fa-check-circle",
      iconColor: "success",
      value: completedCount,
      label: "Completed",
      trend: weeklyTrend.completed,
    },
    {
      icon: "fa-exclamation-triangle",
      iconColor: "danger",
      value: overdueCount,
      label: "Overdue",
      trend: weeklyTrend.overdue,
    },
  ];

  const getIconBgClass = (color: string) => {
    const classes = {
      primary: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
      warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
      success: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
      danger: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
    };
    return classes[color as keyof typeof classes];
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Task Progress Overview
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]"></span>
            <span className="text-slate-600 dark:text-slate-400">To Do:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {todoCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-warning)]"></span>
            <span className="text-slate-600 dark:text-slate-400">
              In Progress:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {inProgressCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-success)]"></span>
            <span className="text-slate-600 dark:text-slate-400">
              Completed:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {completedCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-danger)]"></span>
            <span className="text-slate-600 dark:text-slate-400">Overdue:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {overdueCount}
            </span>
          </div>
        </div>
      </div>

      {/* Multi-Segment Progress Bar */}
      <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex mb-5">
        {todoCount > 0 && (
          <div
            className="h-full bg-[var(--color-primary)] transition-all duration-300 hover:opacity-80"
            style={{ width: `${calculatePercentage(todoCount)}%` }}
            title={`${todoCount} To Do`}
          />
        )}
        {inProgressCount > 0 && (
          <div
            className="h-full bg-[var(--color-warning)] transition-all duration-300 hover:opacity-80"
            style={{ width: `${calculatePercentage(inProgressCount)}%` }}
            title={`${inProgressCount} In Progress`}
          />
        )}
        {completedCount > 0 && (
          <div
            className="h-full bg-[var(--color-success)] transition-all duration-300 hover:opacity-80"
            style={{ width: `${calculatePercentage(completedCount)}%` }}
            title={`${completedCount} Completed`}
          />
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-[var(--color-primary)] transition-all"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${getIconBgClass(stat.iconColor)}`}
            >
              <i className={`fas ${stat.icon} text-lg`}></i>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {stat.value}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              {stat.label}
            </div>
            <div
              className={`flex items-center gap-1 text-xs ${
                stat.trend >= 0
                  ? "text-[var(--color-success)]"
                  : "text-[var(--color-danger)]"
              }`}
            >
              <i
                className={`fas fa-arrow-${stat.trend >= 0 ? "up" : "down"}`}
              ></i>
              <span>{Math.abs(stat.trend)} this week</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressOverview;
