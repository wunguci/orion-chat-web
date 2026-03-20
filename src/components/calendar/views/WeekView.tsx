import React, { useState } from "react";
import type { CalendarEvent } from "../../../types/calendar";
import { MdOutlineModeEdit } from "react-icons/md";
import { RiDeleteBinLine } from "react-icons/ri";
import { FaForumbee } from "react-icons/fa";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onCellClick: (d: Date) => void;
  onEditEvent: (e: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onDuplicateEvent: (e: CalendarEvent) => void;
  onResizeEvent: (id: string, newEnd: string) => void;
  onMoveEvent: (id: string, newStart: string, newEnd: string) => void;
  onEventDragEnd: (id: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onCellClick,
  onEditEvent,
  onDeleteEvent,
  onResizeEvent,
  onMoveEvent,
  onEventDragEnd,
}) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() - currentDate.getDay() + i);
    return d;
  });
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const now = new Date();

  const [activeAction, setActiveAction] = useState<{
    type: "resize" | "move";
    id: string;
    initialStart: Date;
    initialEnd: Date;
    offsetHours?: number;
  } | null>(null);

  const handleMouseMove = (e: React.MouseEvent, day: Date) => {
    if (!activeAction) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const hourFraction = Math.max(0, Math.min(23.99, relativeY / 80));
    const newDate = new Date(day);
    newDate.setHours(
      Math.floor(hourFraction),
      Math.floor((hourFraction % 1) * 60),
      0,
      0,
    );

    if (activeAction.type === "resize") {
      if (newDate > activeAction.initialStart)
        onResizeEvent(activeAction.id, newDate.toISOString());
    } else {
      const durationMs =
        activeAction.initialEnd.getTime() - activeAction.initialStart.getTime();
      const moveOffsetMs = (activeAction.offsetHours || 0) * 60 * 60 * 1000;
      const newStart = new Date(newDate.getTime() - moveOffsetMs);
      newStart.setMinutes(Math.round(newStart.getMinutes() / 15) * 15);
      newStart.setSeconds(0, 0);
      onMoveEvent(
        activeAction.id,
        newStart.toISOString(),
        new Date(newStart.getTime() + durationMs).toISOString(),
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex border-b border-slate-100 pl-20 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)] z-10">
        {days.map((day) => {
          const isToday = day.toDateString() === now.toDateString();
          return (
            <div
              key={day.toISOString()}
              className="flex-1 py-6 flex flex-col items-center border-r border-slate-50 last:border-r-0 "
            >
              <span
                className={`text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? "text-green-primary" : "text-slate-400"}`}
              >
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span
                className={`text-2xl font-black mt-2 size-12 flex items-center justify-center rounded-2xl transition-all ${isToday ? "bg-green-primary text-white shadow-xl shadow-green-primary/30" : "text-slate-700"}`}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar relative select-none bg-slate-50/20 hide-scrollbar">
        <div className="flex min-h-full">
          <div className="w-20 border-r border-slate-100 shrink-0 bg-white">
            {hours.map((h) => (
              <div
                key={h}
                className="h-20 flex items-start justify-center pt-2 text-[10px] font-black text-slate-500"
              >
                {h === 0
                  ? "12 AM"
                  : h < 12
                    ? `${h} AM`
                    : h === 12
                      ? "12 PM"
                      : `${h - 12} PM`}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className="flex-1 border-r border-slate-100 last:border-r-0 relative group/col"
              onMouseMove={(e) => handleMouseMove(e, day)}
              onMouseUp={() => {
                if (activeAction) {
                  onEventDragEnd(activeAction.id);
                }
                setActiveAction(null);
              }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="h-20 border-b border-slate-50/50 hover:bg-green-primary/5 transition-colors cursor-pointer"
                  onClick={() => {
                    const d = new Date(day);
                    d.setHours(h, 0, 0, 0);
                    onCellClick(d);
                  }}
                ></div>
              ))}

              {events
                .filter(
                  (e) =>
                    new Date(e.start).toDateString() === day.toDateString(),
                )
                .map((event) => {
                  const startDate = new Date(event.start);
                  const endDate = new Date(event.end);
                  const startHour =
                    startDate.getHours() + startDate.getMinutes() / 60;
                  const duration =
                    (endDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60);
                  const top = startHour * 80;
                  const height = Math.max(duration * 80, 40);

                  return (
                    <div
                      key={event.id}
                      onMouseDown={(e) => {
                        if (
                          (e.target as HTMLElement).closest(
                            ".event-actions, .resize-handle",
                          )
                        )
                          return;
                        e.stopPropagation();
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        setActiveAction({
                          type: "move",
                          id: event.id,
                          initialStart: startDate,
                          initialEnd: endDate,
                          offsetHours: (e.clientY - rect.top) / 80,
                        });
                      }}
                      className={`absolute left-1 right-1 rounded-3xl p-4 text-white shadow-lg z-10 transition-all border-4 border-white cursor-move group/event ${activeAction?.id === event.id ? "opacity-40 shadow-2xl scale-[1.02] z-50" : "hover:scale-[1.01] hover:shadow-2xl"}`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: event.color,
                      }}
                    >
                      <div className="flex flex-col h-full pointer-events-none">
                        <div className="flex justify-between items-start mb-2 pointer-events-auto">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-xs truncate leading-tight">
                              {event.title}
                            </h4>
                            <span className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                              {startDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="event-actions flex gap-1 opacity-0 group-hover/event:opacity-100 transition-all bg-black/10 p-1 rounded-xl backdrop-blur-md">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditEvent(event);
                              }}
                              className="size-6 flex items-center justify-center hover:bg-white/20 rounded-lg material-symbols-outlined text-sm cursor-pointer"
                            >
                              <MdOutlineModeEdit />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEvent(event.id);
                              }}
                              className="size-6 flex items-center justify-center hover:bg-rose-500/50 rounded-lg material-symbols-outlined text-sm cursor-pointer"
                            >
                              <RiDeleteBinLine />
                            </button>
                          </div>
                        </div>

                        {event.participants &&
                          event.participants.length > 0 && (
                            <div className="mt-auto flex -space-x-2">
                              {event.participants.map((p) => (
                                <img
                                  key={p.id}
                                  src={p.avatar}
                                  alt={p.name}
                                  className="size-6 rounded-full border-2 border-white object-cover shadow-sm"
                                  title={p.name}
                                />
                              ))}
                              {event.participants.length > 3 && (
                                <div className="size-6 rounded-full bg-black/20 backdrop-blur-md border-2 border-white flex items-center justify-center text-[8px] font-bold">
                                  +{event.participants.length - 3}
                                </div>
                              )}
                              <div className="size-6 rounded-full bg-white/20 backdrop-blur-md border-2 border-white flex items-center justify-center ml-auto">
                                <FaForumbee className="text-[12px]" />
                              </div>
                            </div>
                          )}

                        <div
                          className="resize-handle absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-10 cursor-ns-resize hover:bg-white/40 rounded-full transition-colors pointer-events-auto"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setActiveAction({
                              type: "resize",
                              id: event.id,
                              initialStart: startDate,
                              initialEnd: endDate,
                            });
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
