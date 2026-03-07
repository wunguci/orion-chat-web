import React from "react";
import type { CalendarEvent } from "../../../types/calendar";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEditEvent: (e: CalendarEvent) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onEditEvent,
}) => {
  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const startDay = startOfMonth.getDay();
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(startOfMonth);
    d.setDate(i - startDay + 1);
    return d;
  });

  return (
    <div className="flex-1 grid grid-cols-7 grid-rows-6 border-l border-t border-slate-100 p-4 gap-2 bg-slate-50/30">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <div
          key={d}
          className="py-2 text-[10px] font-black text-slate-700 uppercase tracking-widest text-center"
        >
          {d}
        </div>
      ))}
      {days.map((day, i) => {
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const dayEvents = events.filter(
          (e) => new Date(e.start).toDateString() === day.toDateString(),
        );
        const isToday = day.toDateString() === new Date().toDateString();

        return (
          <div
            key={i}
            className={`bg-white rounded-3xl p-3 min-h-0 flex flex-col gap-1 shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer ${!isCurrentMonth ? "opacity-30" : ""} ${isToday ? "ring-2 ring-green-primary ring-offset-2" : ""}`}
          >
            <span
              className={`text-xs font-black mb-1 ${isToday ? "text-green-primary" : "text-slate-700"}`}
            >
              {day.getDate()}
            </span>
            <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1">
              {dayEvents.map((e) => (
                <div
                  key={e.id}
                  onClick={() => onEditEvent(e)}
                  className="text-[9px] px-2 py-1.5 rounded-xl truncate text-white font-black cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-sm"
                  style={{ backgroundColor: e.color }}
                >
                  {e.title}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
