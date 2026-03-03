import type { MemberPerformance } from "../../../types/work-hub.types";

interface MemberPerformanceTableProps {
  data: MemberPerformance[];
}

const MemberPerformanceTable = ({ data }: MemberPerformanceTableProps) => {
  return (
    <div className="bg-white border border-[var(--wh-green-border-light)] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">
        <i className="fas fa-users mr-2 text-[var(--wh-green-primary)]"></i>
        Team Performance
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--wh-green-border-light)]">
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Done</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Active</th>
              <th className="text-center py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">Avg Days</th>
              <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase">On-Time</th>
            </tr>
          </thead>
          <tbody>
            {data.map((member) => {
              const rateColor =
                member.onTimeRate >= 90
                  ? "text-green-600 bg-green-50"
                  : member.onTimeRate >= 70
                  ? "text-amber-600 bg-amber-50"
                  : "text-red-600 bg-red-50";

              const barColor =
                member.onTimeRate >= 90
                  ? "#10b981"
                  : member.onTimeRate >= 70
                  ? "#F59E0B"
                  : "#ef4444";

              return (
                <tr key={member.user.id} className="border-b border-[var(--wh-green-border-light)] last:border-0">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <img src={member.user.avatar} alt={member.user.name} className="w-7 h-7 rounded-full" />
                      <span className="font-medium text-gray-800">{member.user.name}</span>
                    </div>
                  </td>
                  <td className="text-center py-2.5 px-3 font-semibold text-gray-700">{member.tasksCompleted}</td>
                  <td className="text-center py-2.5 px-3 text-gray-500">{member.tasksInProgress}</td>
                  <td className="text-center py-2.5 px-3 text-gray-500">{member.avgCompletionDays.toFixed(1)}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${member.onTimeRate}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${rateColor}`}>
                        {member.onTimeRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberPerformanceTable;
