import type React from "react";
import { useState, useEffect, useRef } from "react";
import CalendarSidebar from "../../components/calendar/CalendarSidebar";
import CalendarHeader from "../../components/calendar/CalendarHeader";
import {
  type CalendarEvent,
  type ParticipantOption,
} from "../../types/calendar";
import { DayView } from "../../components/calendar/views/DayView";
import { WeekView } from "../../components/calendar/views/WeekView";
import { MonthView } from "../../components/calendar/views/MonthView";
import { YearView } from "../../components/calendar/views/YearView";
import { EventEditor } from "../../components/calendar/EventEditor";
import {
  calendarService,
  type CalendarViewQuery,
} from "../../services/calendarService";

type ViewMode = "Day" | "Week" | "Month" | "Year";

const CalendarPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [participantOptions, setParticipantOptions] = useState<
    ParticipantOption[]
  >([]);
  const [pendingInvites, setPendingInvites] = useState<CalendarEvent[]>([]);

  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    initialDate?: Date;
    existingEvent?: CalendarEvent;
  }>({ isOpen: false });

  const eventsRef = useRef<CalendarEvent[]>([]);
  const pendingDragUpdateRef = useRef<
    Record<string, { start?: string; end?: string }>
  >({});

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    const loadParticipantOptions = async () => {
      try {
        const options = await calendarService.getParticipantOptions();
        setParticipantOptions(options);
      } catch (error) {
        console.error("Failed to load participant options", error);
      }
    };

    void loadParticipantOptions();
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const view = viewMode.toLowerCase() as CalendarViewQuery;
        const rows = await calendarService.getEvents({
          view,
          date: currentDate.toISOString(),
          q: searchQuery,
        });
        setEvents(rows);
      } catch (error) {
        console.error("Failed to load calendar events", error);
      }
    };

    void loadEvents();
  }, [viewMode, currentDate, searchQuery]);

  useEffect(() => {
    const loadInvites = async () => {
      try {
        const invites = await calendarService.getPendingInvites();
        setPendingInvites(invites);
      } catch (error) {
        console.error("Failed to load calendar invites", error);
      }
    };

    void loadInvites();
  }, []);

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

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    try {
      if (eventData.id) {
        const updated = await calendarService.updateEvent(
          eventData.id,
          eventData,
        );
        setEvents((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e)),
        );
      } else {
        const created = await calendarService.createEvent(eventData);
        setEvents((prev) => [...prev, created]);
      }
      const invites = await calendarService.getPendingInvites();
      setPendingInvites(invites);
      setEditorState({ isOpen: false });
    } catch (error) {
      console.error("Failed to save event", error);
    }
  };

  const handleInviteResponse = async (
    eventId: string,
    status: "accepted" | "declined",
  ) => {
    try {
      await calendarService.respondToInvite(eventId, status);
      const invites = await calendarService.getPendingInvites();
      setPendingInvites(invites);
      const view = viewMode.toLowerCase() as CalendarViewQuery;
      const rows = await calendarService.getEvents({
        view,
        date: currentDate.toISOString(),
        q: searchQuery,
      });
      setEvents(rows);
    } catch (error) {
      console.error("Failed to respond to invite", error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await calendarService.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete event", error);
    }
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
    pendingDragUpdateRef.current[id] = {
      ...(pendingDragUpdateRef.current[id] || {}),
      end: newEnd,
    };

    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, end: newEnd } : e)),
    );
  };

  const handleMoveEvent = (id: string, newStart: string, newEnd: string) => {
    pendingDragUpdateRef.current[id] = {
      start: newStart,
      end: newEnd,
    };

    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, start: newStart, end: newEnd } : e,
      ),
    );
  };

  const handlePersistDraggedEvent = async (id: string) => {
    const target = eventsRef.current.find((event) => event.id === id);
    if (!target) return;

    const dragPatch = pendingDragUpdateRef.current[id];
    if (!dragPatch) return;

    const payload: Partial<CalendarEvent> = {
      ...target,
      start: dragPatch.start ?? target.start,
      end: dragPatch.end ?? target.end,
    };

    try {
      const updated = await calendarService.updateEvent(id, payload);
      delete pendingDragUpdateRef.current[id];
      setEvents((prev) =>
        prev.map((event) => (event.id === id ? updated : event)),
      );
    } catch (error) {
      console.error("Failed to persist dragged event", error);
    }
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
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {pendingInvites.length > 0 && (
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  Pending event invites
                </h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500">
                  {pendingInvites.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {invite.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(invite.start).toLocaleString()} -{" "}
                        {new Date(invite.end).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          void handleInviteResponse(invite.id, "declined")
                        }
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() =>
                          void handleInviteResponse(invite.id, "accepted")
                        }
                        className="rounded-lg bg-green-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-secondary cursor-pointer"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              onEventDragEnd={handlePersistDraggedEvent}
            />
          )}
          {viewMode === "Month" && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onCellClick={(date) =>
                setEditorState({ isOpen: true, initialDate: date })
              }
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
          {viewMode === "Year" && (
            <YearView
              currentDate={currentDate}
              events={events}
              onDateSelect={(date) => {
                setCurrentDate(date);
                setViewMode("Month");
              }}
            />
          )}
        </div>
      </div>

      {editorState.isOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <EventEditor
            initialDate={editorState.initialDate}
            existingEvent={editorState.existingEvent}
            availableParticipants={participantOptions}
            onClose={() => setEditorState({ isOpen: false })}
            onSave={handleSaveEvent}
          />
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
