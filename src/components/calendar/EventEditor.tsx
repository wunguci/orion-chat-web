import React, { useState, useRef, useEffect } from "react";
import type { CalendarEvent, Participant } from "../../types/calendar";
import { IoClose } from "react-icons/io5";
import {
  MdOutlineCalendarToday,
  MdOutlineLocationOn,
  MdOutlineNotificationsActive,
  MdOutlinePersonAddAlt,
  MdOutlineTaskAlt,
  MdExpandMore,
  MdCheckCircleOutline,
  MdArrowForward,
  MdDone,
} from "react-icons/md";

interface EventEditorProps {
  initialDate?: Date;
  existingEvent?: CalendarEvent;
  onClose: () => void;
  onSave: (data: Partial<CalendarEvent>) => void;
}

const COLORS = [
  { name: "Teal", value: "#008080" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Emerald", value: "#10b981" },
  { name: "Slate", value: "#475569" },
];

const SUGGESTED_PARTICIPANTS: Participant[] = [
  {
    id: "p1",
    name: "Alex Rivera",
    avatar: "https://picsum.photos/seed/p1/100",
  },
  { id: "p2", name: "Sarah Chen", avatar: "https://picsum.photos/seed/p2/100" },
  {
    id: "p3",
    name: "James Wilson",
    avatar: "https://picsum.photos/seed/p3/100",
  },
];

const NOTIFICATION_OPTIONS = [
  { label: "None", value: 0 },
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "2 hours before", value: 120 },
  { label: "1 day before", value: 1440 },
];

export const EventEditor: React.FC<EventEditorProps> = ({
  initialDate,
  existingEvent,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(existingEvent?.title || "");
  const [selectedColor, setSelectedColor] = useState(
    COLORS.find((c) => c.value === existingEvent?.color) || COLORS[0],
  );
  const [description, setDescription] = useState(
    existingEvent?.description || "",
  );
  const [location, setLocation] = useState(existingEvent?.location || "");
  const [startDate, setStartDate] = useState(
    existingEvent ? new Date(existingEvent.start) : initialDate || new Date(),
  );
  const [endDate, setEndDate] = useState(
    existingEvent
      ? new Date(existingEvent.end)
      : (() => {
          const d = new Date(initialDate || new Date());
          d.setHours(d.getHours() + 1);
          return d;
        })(),
  );
  const [notification, setNotification] = useState(
    existingEvent?.notificationMinutes ?? 30,
  );
  const [selectedParticipants, setSelectedParticipants] = useState<
    Participant[]
  >(existingEvent?.participants || []);

  // State for Custom Notification Dropdown
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTimeInput = (date: Date) => date.toTimeString().slice(0, 5);
  const formatDateDisplay = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

  const handleTimeChange = (type: "start" | "end", timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (type === "start") {
      const newStart = new Date(startDate);
      newStart.setHours(hours, minutes);
      setStartDate(newStart);
      if (endDate <= newStart) {
        const newEnd = new Date(newStart);
        newEnd.setHours(newEnd.getHours() + 1);
        setEndDate(newEnd);
      }
    } else {
      const newEnd = new Date(endDate);
      newEnd.setHours(hours, minutes);
      setEndDate(newEnd);
    }
  };

  const toggleParticipant = (p: Participant) => {
    setSelectedParticipants((prev) =>
      prev.find((item) => item.id === p.id)
        ? prev.filter((item) => item.id !== p.id)
        : [...prev, p],
    );
  };

  const handleSave = () => {
    onSave({
      id: existingEvent?.id,
      title: title || "Untitled Event",
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      color: selectedColor.value,
      description,
      location,
      notificationMinutes: notification,
      participants: selectedParticipants,
      category: existingEvent?.category || "work",
      recurrence: existingEvent?.recurrence || "none",
    });
  };

  const currentNotifLabel =
    NOTIFICATION_OPTIONS.find((o) => o.value === notification)?.label || "None";

  return (
    <div className="w-120 bg-white rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.12)] border border-slate-100 overflow-visible animate-scale-up ">
      {/* Header Section */}
      <div className="px-8 pt-5 pb-4 flex items-center justify-between">
        <h2 className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em]">
          {existingEvent ? "Edit Schedule" : "New Appointment"}
        </h2>
        <button
          onClick={onClose}
          className="size-10 flex items-center justify-center hover:bg-slate-50 rounded-2xl text-slate-500 hover:text-slate-900 transition-all active:scale-90 cursor-pointer"
        >
          <IoClose className="text-2xl" />
        </button>
      </div>

      <div className="px-10 pb-10 space-y-4">
        {/* Title Input */}
        <div className="space-y-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full py-3 pl-6 bg-slate-100 border-none outline-none appearance-none shadow-none ring-0
          focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 rounded-sm text-2xl transition-all placeholder:text-slate-500 font-semibold"
            placeholder="Event Title..."
          />
          <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest pl-0.5">
            <MdOutlineCalendarToday className="text-[16px] text-green-primary" />
            {formatDateDisplay(startDate)}
          </div>
        </div>

        {/* Form Fields Group */}
        <div className="space-y-6">
          {/* Time & Duration */}
          <div className="flex items-center gap-5">
            <div className="size-10 rounded-[14px] bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <MdOutlineCalendarToday className="text-[20px]" />
            </div>
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="time"
                  value={formatTimeInput(startDate)}
                  onChange={(e) => handleTimeChange("start", e.target.value)}
                  className="w-full bg-slate-100 border border-transparent rounded-2xl py-3 px-4 text-xs font-black text-slate-500 focus:bg-white border-none outline-none appearance-none shadow-none ring-0 focus:outline-none focus:ring-0 transition-all cursor-pointer"
                />
              </div>
              <MdArrowForward className="text-slate-500 text-[18px]" />
              <div className="relative flex-1">
                <input
                  type="time"
                  value={formatTimeInput(endDate)}
                  onChange={(e) => handleTimeChange("end", e.target.value)}
                  className="w-full bg-slate-100 border border-transparent rounded-2xl py-3 px-4 text-xs font-black text-slate-500 focus:bg-white border-none outline-none appearance-none shadow-none ring-0 focus:outline-none focus:ring-0 transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Location / Link */}
          <div className="flex items-center gap-5">
            <div className="size-10 rounded-[14px] bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <MdOutlineLocationOn className="text-[20px]" />
            </div>
            <div className="flex-1 relative">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-100 border border-transparent rounded-2xl py-3 px-5 text-xs font-bold text-slate-500 focus:bg-white border-none outline-none appearance-none shadow-none ring-0 focus:outline-none focus:ring-0 transition-all placeholder:text-slate-500"
                placeholder="Add address or meeting link"
              />
            </div>
          </div>

          {/* Premium Alert/Notification Dropdown */}
          <div className="flex items-center gap-5">
            <div className="size-10 rounded-[14px] bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <MdOutlineNotificationsActive className="text-[20px]" />
            </div>
            <div className="flex-1 relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`w-full flex items-center justify-between bg-slate-100 border border-transparent rounded-2xl py-3 px-5 text-xs font-black text-slate-500 hover:bg-slate-100 transition-all cursor-pointer ${isNotifOpen ? "ring-4 ring-teal-500/5 border-teal-500/20 bg-white" : ""}`}
              >
                <span>{currentNotifLabel}</span>
                <MdExpandMore
                  className={`text-2xl text-slate-400 transition-transform duration-300 ${isNotifOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isNotifOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] py-2 z-100 animate-fade-in-up">
                  {NOTIFICATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setNotification(opt.value);
                        setIsNotifOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-5 py-3 text-left text-xs transition-all  cursor-pointer hover:bg-slate-50 ${notification === opt.value ? "text-green-primary font-black" : "text-slate-500 font-bold"}`}
                    >
                      {opt.label}
                      {notification === opt.value && (
                        <MdCheckCircleOutline className="text-green-primary text-sm" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Participants Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Participants
            </span>
            <div className="h-px flex-1 mx-4 bg-slate-100"></div>
          </div>
          <div className="flex gap-3">
            {SUGGESTED_PARTICIPANTS.map((p) => {
              const isSelected = selectedParticipants.find(
                (item) => item.id === p.id,
              );
              return (
                <button
                  key={p.id}
                  onClick={() => toggleParticipant(p)}
                  className={`size-12 rounded-2xl overflow-hidden border-2 transition-all active:scale-90 cursor-pointer ${isSelected ? "border-green-primary ring-4 ring-green-primary/10 shadow-lg" : "border-transparent opacity-30 grayscale hover:opacity-100 hover:grayscale-0"}`}
                  title={p.name}
                >
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="size-full object-cover"
                  />
                </button>
              );
            })}
            <button className="size-12 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center  cursor-pointer text-slate-500 hover:text-green-primary hover:border-green-primary/40 hover:bg-green-primary/5 transition-all active:scale-95">
              <MdOutlinePersonAddAlt className="text-[20px]" />
            </button>
          </div>
        </div>

        {/* Color Palette */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Theme
            </span>
            <div className="h-px flex-1 mx-4 bg-slate-100"></div>
          </div>
          <div className="flex gap-3 px-1">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setSelectedColor(c)}
                className={`size-7 rounded-full transition-all flex items-center justify-center border-4 border-white shadow-sm cursor-pointer ${selectedColor.value === c.value ? "ring-2 ring-green-primary scale-125 shadow-xl" : "opacity-40 hover:opacity-100 hover:scale-110"}`}
                style={{ backgroundColor: c.value }}
              >
                {selectedColor.value === c.value && (
                  <MdDone className=" text-white text-[12px] font-black" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 px-6 rounded-3xl text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 cursor-pointer border border-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-[1.8] py-4 px-6 bg-green-primary text-white font-black text-[11px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-slate-200 hover:bg-green-secondary hover:shadow-slate-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MdOutlineTaskAlt className="text-[18px]" />
            {existingEvent ? "Save Changes" : "Confirm Event"}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};
