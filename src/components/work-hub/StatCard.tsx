interface StatCardProps {
  icon: string;
  iconColor: "primary" | "success" | "warning" | "danger";
  value: number;
  label: string;
  change: number;
  changeDirection: "up" | "down";
  onClick?: () => void;
}

const StatCard = ({
  icon,
  iconColor,
  value,
  label,
  change,
  changeDirection,
  onClick,
}: StatCardProps) => {
  const getIconColorClass = () => {
    const colors = {
      primary: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
      success: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
      warning: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
      danger: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
    };
    return colors[iconColor];
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-6 pr-6 pt-2 pb-2 transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-lg hover:-translate-y-1" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${getIconColorClass()}`}
        >
          <i className={`fas ${icon} text-xl`}></i>
        </div>
        <div
          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
            changeDirection === "up"
              ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
              : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
          }`}
        >
          <i className={`fas fa-arrow-${changeDirection} mr-1`}></i>
          {change}%
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
        {value}
      </div>
      <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
    </div>
  );
};

export default StatCard;
