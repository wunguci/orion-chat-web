import type { BurndownPoint } from "../../../types/work-hub.types";

interface BurndownChartProps {
  data: BurndownPoint[];
}

const BurndownChart = ({ data }: BurndownChartProps) => {
  if (data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const width = 500;
  const height = 250;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxY = Math.max(1, ...data.map((d) => Math.max(d.ideal, d.actual)));
  const scaleX = (i: number) => padding.left + (i / (data.length - 1)) * chartW;
  const scaleY = (v: number) => padding.top + chartH - (v / maxY) * chartH;

  const idealPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d.ideal)}`)
    .join(" ");
  const actualPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d.actual)}`)
    .join(" ");

  return (
    <div className="bg-white border border-wh-green-border-light rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">
        <i className="fas fa-chart-line mr-2 text-wh-green-primary"></i>
        Burndown Chart
      </h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={padding.left}
            y1={padding.top + chartH * pct}
            x2={width - padding.right}
            y2={padding.top + chartH * pct}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray={pct === 1 ? "0" : "4,4"}
          />
        ))}

        {/* Ideal line (dashed) */}
        <path
          d={idealPath}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeDasharray="6,4"
        />

        {/* Actual line (solid green) */}
        <path d={actualPath} fill="none" stroke="#0d9488" strokeWidth="2.5" />

        {/* Data points - actual */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={scaleX(i)}
            cy={scaleY(d.actual)}
            r="4"
            fill="#0d9488"
            stroke="white"
            strokeWidth="2"
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={scaleX(i)}
            y={height - 8}
            textAnchor="middle"
            className="text-[10px] fill-gray-400"
          >
            {d.date}
          </text>
        ))}

        {/* Y-axis labels */}
        {[0, maxY / 2, maxY].map((v, i) => (
          <text
            key={i}
            x={padding.left - 8}
            y={scaleY(v) + 4}
            textAnchor="end"
            className="text-[10px] fill-gray-400"
          >
            {Math.round(v)}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-0.5 bg-gray-400"
            style={{ borderTop: "2px dashed #94a3b8" }}
          />
          <span className="text-xs text-gray-500">Ideal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-wh-green-primary" />
          <span className="text-xs text-gray-500">Actual</span>
        </div>
      </div>
    </div>
  );
};

export default BurndownChart;

