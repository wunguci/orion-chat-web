import React from "react";
import type { CalendarEvent } from "../../../types/calendar";
import {
  MdOutlineCalendarToday,
  MdOutlineLocationOn,
} from "react-icons/md";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEditEvent: (e: CalendarEvent) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onEditEvent,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayEvents = events.filter(
    (e) => new Date(e.start).toDateString() === currentDate.toDateString(),
  );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-white p-4 hide-scrollbar">
      <div className="max-w-5xl mx-auto w-full space-y-12">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-sm font-black text-green-primary uppercase tracking-[0.3em]">
              {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
            </span>
            <h2 className="text-4xl font-black text-slate-700">
              {currentDate.toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
              })}
            </h2>
          </div>
          <button className="px-8 py-4 bg-slate-700 text-white font-black text-xs uppercase tracking-widest rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
            Schedule New
          </button>
        </header>

        <div className="space-y-4">
          {hours.map((h) => {
            const hourEvents = dayEvents.filter(
              (e) => new Date(e.start).getHours() === h,
            );
            return (
              <div key={h} className="group flex gap-8">
                <div className="w-20 pt-1 text-[11px] font-black text-slate-500 text-right uppercase tracking-tighter">
                  {h === 0
                    ? "12 AM"
                    : h < 12
                      ? `${h} AM`
                      : h === 12
                        ? "12 PM"
                        : `${h - 12} PM`}
                </div>
                <div className="flex-1 min-h-15 border-l-2 border-slate-50 group-hover:border-green-primary/20 transition-colors pl-8 pb-8 space-y-4">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEditEvent(event)}
                      className="py-4 px-8 rounded-[40px] text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden group/card"
                      style={{ backgroundColor: event.color }}
                    >
                      <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-3">
                          <h4 className="text-3xl font-black leading-tight">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-4 text-xs font-bold opacity-80">
                            <span className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-xl">
                              <MdOutlineCalendarToday className="text-sm" />
                              {new Date(event.start).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-xl">
                                <MdOutlineLocationOn className="text-sm" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        {event.participants && (
                          <div className="flex -space-x-3">
                            {event.participants.map((p) => (
                              <img
                                key={p.id}
                                src={p.avatar}
                                alt={p.name}
                                className="size-12 rounded-[20px] border-4 border-white/20 object-cover shadow-lg"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="absolute top-0 right-0 size-40 bg-white/10 blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
