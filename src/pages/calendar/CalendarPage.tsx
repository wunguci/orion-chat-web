import type React from "react";
import { useState, useEffect } from "react";
import CalendarSidebar from "../../components/calendar/CalendarSidebar";
import CalendarHeader from "../../components/calendar/CalendarHeader";
import { type CalendarEvent } from "../../types/calendar";
import { DayView } from "../../components/calendar/views/DayView";
import { WeekView } from "../../components/calendar/views/WeekView";
import { MonthView } from "../../components/calendar/views/MonthView";
import { YearView } from "../../components/calendar/views/YearView";
import { EventEditor } from "../../components/calendar/EventEditor";

type ViewMode = "Day" | "Week" | "Month" | "Year";

const CalendarPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem("calendar_events");
    return saved ? JSON.parse(saved) : [];
  });

  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    initialDate?: Date;
    existingEvent?: CalendarEvent;
  }>({ isOpen: false });

  useEffect(() => {
    localStorage.setItem("calendar_events", JSON.stringify(events));
  }, [events]);

  const navigate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "Day")
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
    else if (viewMode === "Week")
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
    else if (viewMode === "Month")
      newDate.setMonth(
        currentDate.getMonth() + (direction === "next" ? 1 : -1),
      );
    else if (viewMode === "Year")
      newDate.setFullYear(
        currentDate.getFullYear() + (direction === "next" ? 1 : -1),
      );
    setCurrentDate(newDate);
  };

  const handleSaveEvent = (eventData: Partial<CalendarEvent>) => {
    if (eventData.id) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventData.id ? { ...e, ...(eventData as CalendarEvent) } : e,
        ),
      );
    } else {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventData.title || "Untitled Event",
        start: eventData.start || new Date().toISOString(),
        end: eventData.end || new Date().toISOString(),
        color: eventData.color || "#008080",
        category: eventData.category || "personal",
        recurrence: eventData.recurrence || "none",
        notificationMinutes: eventData.notificationMinutes ?? 30,
        participants: eventData.participants || [],
        ...eventData,
      } as CalendarEvent;
      setEvents((prev) => [...prev, newEvent]);
    }
    setEditorState({ isOpen: false });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleDuplicateEvent = (event: CalendarEvent) => {
    const duplicated: CalendarEvent = {
      ...event,
      id: Date.now().toString(),
      title: `${event.title} (Copy)`,
    };
    setEvents((prev) => [...prev, duplicated]);
  };

  const handleResizeEvent = (id: string, newEnd: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, end: newEnd } : e)),
    );
  };

  const handleMoveEvent = (id: string, newStart: string, newEnd: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, start: newStart, end: newEnd } : e,
      ),
    );
  };

  const formatHeaderDate = () => {
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
    if (viewMode === "Year") return currentDate.getFullYear().toString();
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  return (
    <div className="flex h-screen bg-white transition-colors">
      <CalendarSidebar
        onDateSelect={setCurrentDate}
        selectedDate={currentDate}
        events={events}
        onCreateClick={() =>
          setEditorState({ isOpen: true, initialDate: currentDate })
        }
      />

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/30">
        {/* Calendar Header  */}
        <CalendarHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          setCurrentDate={setCurrentDate}
          navigate={navigate}
          formatHeaderDate={formatHeaderDate}
        />

        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {viewMode === "Week" && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onCellClick={(date) =>
                setEditorState({ isOpen: true, initialDate: date })
              }
              onEditEvent={(event) =>
                setEditorState({ isOpen: true, existingEvent: event })
              }
              onDeleteEvent={handleDeleteEvent}
              onDuplicateEvent={handleDuplicateEvent}
              onResizeEvent={handleResizeEvent}
              onMoveEvent={handleMoveEvent}
            />
          )}
          {viewMode === "Month" && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onEditEvent={(e) =>
                setEditorState({ isOpen: true, existingEvent: e })
              }
            />
          )}
          {viewMode === "Day" && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEditEvent={(e) =>
                setEditorState({ isOpen: true, existingEvent: e })
              }
            />
          )}
          {viewMode === "Year" && <YearView currentDate={currentDate} />}
        </div>
      </div>

      {editorState.isOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <EventEditor
            initialDate={editorState.initialDate}
            existingEvent={editorState.existingEvent}
            onClose={() => setEditorState({ isOpen: false })}
            onSave={handleSaveEvent}
          />
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
