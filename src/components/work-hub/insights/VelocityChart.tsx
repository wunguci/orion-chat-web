import type { VelocityPoint } from "../../../types/work-hub.types";

interface VelocityChartProps {
  data: VelocityPoint[];
}

const VelocityChart = ({ data }: VelocityChartProps) => {
  if (data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const width = 500;
  const height = 250;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxY = Math.max(...data.flatMap((d) => [d.planned, d.completed]));
  const barGroupWidth = chartW / data.length;
  const barWidth = barGroupWidth * 0.3;
  const gap = 4;

  const scaleY = (v: number) => (v / maxY) * chartH;

  return (
    <div className="bg-white border border-[var(--wh-green-border-light)] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">
        <i className="fas fa-tachometer-alt mr-2 text-[var(--wh-green-primary)]"></i>
        Velocity Chart
      </h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={padding.left}
            y1={padding.top + chartH * (1 - pct)}
            x2={width - padding.right}
            y2={padding.top + chartH * (1 - pct)}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {data.map((d, i) => {
          const x = padding.left + i * barGroupWidth + barGroupWidth / 2;
          return (
            <g key={i}>
              {/* Planned bar */}
              <rect
                x={x - barWidth - gap / 2}
                y={padding.top + chartH - scaleY(d.planned)}
                width={barWidth}
                height={scaleY(d.planned)}
                rx="3"
                fill="#D6F2F2"
              />
              {/* Completed bar */}
              <rect
                x={x + gap / 2}
                y={padding.top + chartH - scaleY(d.completed)}
                width={barWidth}
                height={scaleY(d.completed)}
                rx="3"
                fill="#0d9488"
              />
              {/* Label */}
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                className="text-[10px] fill-gray-400"
              >
                {d.sprint}
              </text>
              {/* Value labels */}
              <text
                x={x - barWidth / 2 - gap / 2}
                y={padding.top + chartH - scaleY(d.planned) - 5}
                textAnchor="middle"
                className="text-[9px] fill-gray-400"
              >
                {d.planned}
              </text>
              <text
                x={x + barWidth / 2 + gap / 2}
                y={padding.top + chartH - scaleY(d.completed) - 5}
                textAnchor="middle"
                className="text-[9px] fill-[var(--wh-green-primary)]"
              >
                {d.completed}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[var(--wh-green-bg-heavy)]" />
          <span className="text-xs text-gray-500">Planned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[var(--wh-green-primary)]" />
          <span className="text-xs text-gray-500">Completed</span>
        </div>
      </div>
    </div>
  );
};

export default VelocityChart;
