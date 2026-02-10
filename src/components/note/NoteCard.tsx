import type React from "react";
import type { Note } from "../../types/note";
import { MdPushPin, MdAccessTime} from "react-icons/md";

interface NoteCardProps {
    note: Note;
    isActive: boolean;
    onClick: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, isActive, onClick }) => {
    const categoryStyles: Record<string, string> = {
      Finance:
        "bg-[#A7F3D0] text-[#065F46]",
      Sport:
        "bg-orange-100 text-orange-700",
      Personal:
        "bg-blue-100 text-blue-700",
      Work: "bg-purple-100 text-purple-700",
        Study: "bg-yellow-100 text-yellow-700",
      General:
        "bg-slate-100 text-slate-600",
    };
    
    return (
      <div
        onClick={onClick}
        className={`p-4 border rounded-xl cursor-pointer transistion-all duration-200 group relative ${
          isActive
            ? "bg-white border-slate-200 shadow-sm ring-1 ring-teal-500/10"
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
          {note.isPinned && <MdPushPin className="text-primary text-[18px]" />}
        </div>

        <div className="mb-2">
          <span
            className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-tight ${categoryStyles[note.category] || categoryStyles.General}`}
          >
            {note.category}
          </span>
        </div>

        <p className="text-[13px] text-slate-500 line-clamp-1 mb-2">
          {note.content || "No content..."}
        </p>

        <div className="flex items-center text-[12px] text-slate-400 font-medium">
            <MdAccessTime className="text-[16px] mr-1"/>
            {note.timestamp}
        </div>
      </div>
    );
}

export default NoteCard;