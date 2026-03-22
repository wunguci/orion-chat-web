import React from "react";
import type { CalendarEvent } from "../../../types/calendar";

interface YearViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
}

export const YearView: React.FC<YearViewProps> = ({
  currentDate,
  events,
  onDateSelect,
}) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8  grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-12 bg-slate-50/20 hide-scrollbar">
      {months.map((month, mIdx) => {
        const firstDay = new Date(currentDate.getFullYear(), mIdx, 1).getDay();
        const daysCount = new Date(
          currentDate.getFullYear(),
          mIdx + 1,
          0,
        ).getDate();
        return (
          <div
            key={month}
            className="bg-white p-5 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-all"
          >
            <h3 className="text-xl font-black text-slate-700 mb-8 tracking-tighter">
              {month}
            </h3>
            <div className="grid grid-cols-7 gap-y-4 text-center text-[10px] font-black text-slate-300">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i}>{d}</div>
              ))}
              {Array(firstDay)
                .fill(null)
                .map((_, i) => (
                  <div key={i}></div>
                ))}
              {Array.from({ length: daysCount }, (_, i) => {
                const dayDate = new Date(
                  currentDate.getFullYear(),
                  mIdx,
                  i + 1,
                );
                const eventCount = events.filter(
                  (event) =>
                    new Date(event.start).toDateString() ===
                    dayDate.toDateString(),
                ).length;
                const isToday =
                  mIdx === new Date().getMonth() &&
                  i + 1 === new Date().getDate() &&
                  currentDate.getFullYear() === new Date().getFullYear();
                return (
                  <div
                    key={i}
                    onClick={() => onDateSelect(dayDate)}
                    className={`relative p-1 rounded-xl text-[12px] font-black transition-all cursor-pointer flex justify-center ${isToday ? "bg-green-primary hover:bg-green-hover text-white shadow-lg shadow-green-primary/30 scale-125" : "text-slate-600 hover:bg-slate-50"}`}
                  >
                    {i + 1}
                    {eventCount > 0 && (
                      <span className="absolute -bottom-1.5 text-[9px] font-bold text-green-primary">
                        {eventCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
