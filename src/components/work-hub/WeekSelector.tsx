interface Week {
  id: number;
  label: string;
  dateRange: string;
  taskCount: number;
}

interface WeekSelectorProps {
  weeks: Week[];
  selectedWeekId: number;
  onWeekChange: (weekId: number) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  currentWeekRange: string;
}

const WeekSelector = ({
  weeks,
  selectedWeekId,
  onWeekChange,
  onPrevWeek,
  onNextWeek,
  currentWeekRange,
}: WeekSelectorProps) => {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Weekly Tasks
          </h3>
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm text-slate-600 dark:text-slate-400">
            {currentWeekRange}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevWeek}
            className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center">
            <i className="fas fa-calendar-day"></i>
          </button>
          <button
            onClick={onNextWeek}
            className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all flex items-center justify-center"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Week Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {weeks.map((week) => (
          <button
            key={week.id}
            onClick={() => onWeekChange(week.id)}
            className={`flex flex-col items-center min-w-[130px] px-5 py-3 rounded-lg border transition-all ${
              selectedWeekId === week.id
                ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-[var(--color-primary)]"
            }`}
          >
            <span
              className={`text-xs mb-1 ${
                selectedWeekId === week.id
                  ? "text-white/80"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {week.label}
            </span>
            <span className="text-base font-semibold">{week.dateRange}</span>
            <span
              className={`text-xs mt-1 ${
                selectedWeekId === week.id
                  ? "text-white/70"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {week.taskCount} tasks
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WeekSelector;
