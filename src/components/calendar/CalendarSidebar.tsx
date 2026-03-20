import type React from "react";
import type { CalendarEvent } from "../../types/calendar";
import { FaPlus } from "react-icons/fa6";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { MdExpandLess } from "react-icons/md";

interface CalendarSidebarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  events: CalendarEvent[];
  onCreateClick?: () => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  onDateSelect,
  selectedDate,
  events,
  onCreateClick,
}) => {
  const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const startOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1,
  );
  const startDay = startOfMonth.getDay();
  const today = new Date();

  const dates = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(startOfMonth);
    d.setDate(i - startDay + 1);
    return d;
  });

  const hasEventOnDate = (date: Date) => {
    return events.some((event) => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  return (
    <aside className="w-80 flex flex-col border-r border-slate-200 py-6 bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="px-6 border-b border-slate-200 pb-4 mb-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Calendar
          </h1>
          <button
            onClick={onCreateClick}
            className="w-10 h-10 flex items-center justify-evenly bg-green-primary text-white rounded-lg hover:bg-green-hover transition-all active:scale-90 shadow-lg shadow-green-primary/20 cursor-pointer"
          >
            <FaPlus className="w-4 h-4" />
            
          </button>
        </div>
      </div>

      <div className="mb-10 px-6">
        <div className="flex items-center justify-between mb-6">
          <span className="font-black text-sm text-slate-900 tracking-tight">
            {selectedDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() =>
                onDateSelect(
                  new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)),
                )
              }
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer"
            >
              <FaChevronLeft className="text-sm" />
            </button>
            <button
              onClick={() =>
                onDateSelect(
                  new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)),
                )
              }
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors cursor-pointer"
            >
              <FaChevronRight className="text-sm" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-black text-slate-300 mb-2 tracking-widest">
          {days.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {dates.map((d, i) => {
            const isCurrentMonth = d.getMonth() === selectedDate.getMonth();
            const isSelected = d.toDateString() === selectedDate.toDateString();
            const isToday = d.toDateString() === today.toDateString();
            const hasEvent = hasEventOnDate(d);

            return (
              <div
                key={i}
                onClick={() => onDateSelect(new Date(d))}
                className={`group/date relative p-1.5 text-xs rounded-xl cursor-pointer transition-all font-bold flex flex-col items-center justify-center
                  ${
                    isSelected
                      ? "bg-green-primary text-white shadow-lg shadow-green-primary/30 scale-110 z-10"
                      : isToday
                        ? "text-green-primary border border-green-primary/20"
                        : isCurrentMonth
                          ? "text-slate-600 hover:bg-slate-100"
                          : "text-slate-200 hover:text-slate-400"
                  }
                `}
              >
                {d.getDate()}
                {hasEvent && (
                  <div
                    className={`absolute bottom-1 size-1 rounded-full transition-colors ${isSelected ? "bg-amber-300" : "bg-amber-400"}`}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-8 px-6">
        <div>
          <div className="flex items-center justify-between group cursor-pointer mb-5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Calendars
            </span>
            <MdExpandLess className="text-xl text-slate-400" />
          </div>
          <div className="space-y-4">
            <CalendarToggle label="My Tasks" color="bg-orange-500" />
            <CalendarToggle label="Project A" color="bg-emerald-500" />
            <CalendarToggle label="Personal" color="bg-teal-500" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CalendarSidebar;

const CalendarToggle: React.FC<{ label: string; color: string }> = ({
  label,
  color,
}) => (
  <label className="flex items-center justify-between cursor-pointer group hover:bg-slate-50 p-2 -mx-2 rounded-xl transition-all">
    <div className="flex items-center gap-3">
      <div
        className={`size-2 rounded-full ${color} shadow-sm shadow-slate-200`}
      ></div>
      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
        {label}
      </span>
    </div>
    <div className="relative flex items-center">
      <input
        type="checkbox"
        defaultChecked
        className="rounded border-slate-300 text-green-primary focus:ring-0 focus:ring-offset-0 size-4 transition-all"
      />
    </div>
  </label>
);
