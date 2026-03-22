import type React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";

type ViewMode = "Day" | "Week" | "Month" | "Year";

interface CalendarHeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  setCurrentDate: (date: Date) => void;
  navigate: (direction: "prev" | "next") => void;
  formatHeaderDate: () => string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  viewMode,
  setViewMode,
  setCurrentDate,
  navigate,
  formatHeaderDate,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <header className="px-8 py-2.5 border-b border-slate-200 flex items-center justify-between bg-white z-10">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-black text-slate-700 tracking-tighter">
          {formatHeaderDate()}
        </h1>
        <div className="flex items-center bg-slate-100 rounded-2xl gap-2 shadow-inner">
          <button
            onClick={() => navigate("prev")}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 hover:text-green-primary transition-all cursor-pointer"
          >
            <FaChevronLeft className="text-xl" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-white text-slate-700 hover:text-green-primary text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => navigate("next")}
            className="p-2 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 hover:text-green-primary transition-all cursor-pointer"
          >
            <FaChevronRight className="text-xl" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-2xl gap-1">
          {(["Day", "Week", "Month", "Year"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${viewMode === mode ? "bg-white text-green-primary shadow-sm" : "text-slate-400 hover:text-green-primary"}`}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="h-8 w-px bg-slate-200"></div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 w-72">
          <IoSearch className="text-xl text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, location..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
    </header>
  );
};

export default CalendarHeader;
