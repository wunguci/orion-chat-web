import type React from "react";
import type { Note } from "../../types/note";
import { MdPushPin, MdAccessTime } from "react-icons/md";

interface NoteCardProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, isActive, onClick }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${hours}:${minutes} • ${day} ${month} ${year}`;
  };

  const categoryColor = note.category?.color || "#94a3b8";

  return (
    <div
      onClick={onClick}
      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 group relative ${
        isActive
          ? "bg-white border-slate-200 shadow-sm ring-1 ring-green-primary/10"
          : "bg-transparent hover:bg-slate-50 border-transparent"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3
          className={`font-bold text-[15px] truncate flex-1 mr-2 ${
            isActive ? "text-slate-900" : "text-slate-700"
          }`}
        >
          {note.title || "Untitled Note"}
        </h3>
        {note.isPinned && (
          <MdPushPin className="text-green-primary text-[18px]" />
        )}
      </div>

      <div className="mb-2">
        <span
          className="px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-tight"
          style={{
            backgroundColor: categoryColor + "20",
            color: categoryColor,
          }}
        >
          {note.category?.name || "Uncategorized"}
        </span>
      </div>

      <p className="text-[13px] text-slate-500 line-clamp-1 mb-2">
        {note.content || "No content..."}
      </p>

      <div className="flex items-center text-[12px] text-slate-400 font-medium">
        <MdAccessTime className="text-[16px] mr-1" />
        {formatDate(note.updatedAt)}
      </div>
    </div>
  );
};

export default NoteCard;
