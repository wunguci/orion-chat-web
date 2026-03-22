interface ProgressBarProps {
  value: number; // 0-100
  size?: "sm" | "md";
  showLabel?: boolean;
  segments?: Array<{ value: number; color: string; label?: string }>;
}

const ProgressBar = ({ value, size = "sm", showLabel = false, segments }: ProgressBarProps) => {
  const heightClass = size === "sm" ? "h-1.5" : "h-2.5";

  if (segments && segments.length > 0) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    return (
      <div className="w-full">
        <div className={`w-full bg-gray-100 rounded-full overflow-hidden flex ${heightClass}`}>
          {segments.map((seg, i) => {
            const pct = total > 0 ? (seg.value / total) * 100 : 0;
            return (
              <div
                key={i}
                className={`${heightClass} transition-all duration-300`}
                style={{ width: `${pct}%`, backgroundColor: seg.color }}
                title={seg.label ? `${seg.label}: ${seg.value}` : undefined}
              />
            );
          })}
        </div>
        {showLabel && (
          <div className="flex justify-between mt-1">
            {segments.map((seg, i) => (
              <span key={i} className="text-[10px] text-gray-500" style={{ color: seg.color }}>
                {seg.label}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${heightClass} bg-wh-green-primary rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 mt-1">{Math.round(value)}%</span>
      )}
    </div>
  );
};

export default ProgressBar;

