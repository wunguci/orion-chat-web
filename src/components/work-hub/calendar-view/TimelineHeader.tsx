interface TimelineHeaderProps {
  startDate: Date;
  totalDays: number;
  dayWidth: number;
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TimelineHeader = ({ startDate, totalDays, dayWidth }: TimelineHeaderProps) => {
  const days: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  return (
    <div className="flex border-b border-[var(--wh-green-border-light)]" style={{ minWidth: `${totalDays * dayWidth}px` }}>
      {days.map((day, i) => {
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const isToday = new Date().toDateString() === day.toDateString();
        return (
          <div
            key={i}
            className={`flex flex-col items-center justify-center py-2 border-r border-[var(--wh-green-border-light)] ${
              isWeekend ? "bg-gray-50" : ""
            } ${isToday ? "bg-[var(--wh-green-bg-heavy)]" : ""}`}
            style={{ width: `${dayWidth}px`, minWidth: `${dayWidth}px` }}
          >
            <span className="text-[10px] text-gray-400">{dayNames[day.getDay()]}</span>
            <span className={`text-xs font-medium ${isToday ? "text-[var(--wh-green-primary)]" : "text-gray-600"}`}>
              {day.getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineHeader;
