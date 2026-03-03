interface StatCardProps {
  icon: string;
  iconColor: string;
  value: number | string;
  label: string;
  trend?: number;
  trendDirection?: "up" | "down";
}

const StatCard = ({ icon, iconColor, value, label, trend, trendDirection }: StatCardProps) => {
  return (
    <div className="bg-white border border-[var(--wh-green-border-light)] rounded-xl p-5 transition-all hover:shadow-md hover:border-[var(--wh-green-primary)]">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}18`, color: iconColor }}
        >
          <i className={`fas ${icon} text-lg`}></i>
        </div>
        {trend !== undefined && trendDirection && (
          <div
            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              trendDirection === "up"
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            <i className={`fas fa-arrow-${trendDirection} mr-1`}></i>
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
};

export default StatCard;
