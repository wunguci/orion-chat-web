import type React from "react";
import { useState } from "react";
import CalendarSidebar from "../../components/calendar/CalendarSidebar";
import { type CalendarEvent } from "../../types/calendar";

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

  return (
    <div className="flex h-screen bg-white transition-colors">
      <CalendarSidebar 
        onDateSelect={setCurrentDate}
        selectedDate={currentDate}
        events={events}
        onCreateClick={() => setEditorState({ isOpen: true, initialDate: currentDate })}
      />
    </div>
  );
};

export default CalendarPage;
