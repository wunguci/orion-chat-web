import type React from "react";
import { useEffect, useRef, useState } from "react";
import { MdMoreHoriz, MdDelete } from "react-icons/md";
import { IoMdShare } from "react-icons/io";

interface AIChatHeaderProps {
  title: string;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
}

const AIChatHeader: React.FC<AIChatHeaderProps> = ({
  title,
  onRename,
  onDelete,
}) => {
  const [editValue, setEditValue] = useState(title);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleBlur = () => {
    if (editValue.trim() && editValue !== title) {
      onRename(editValue.trim());
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 md:px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 z-20 shrink-0 relative">
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <div className="size-2 bg-emerald-500 rounded-full animate-pulse shrink-0"></div>

        <div className="flex-1 max-w-md group relative">
          <input
            className="w-full bg-transparent border-none p-0 text-slate-800 font-bold focus:ring-0 truncate hover:bg-slate-50 rounded px-2 -ml-2 transition-all outline-none"
            value={editValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.target as HTMLInputElement).blur()
            }
            placeholder="Untitled Conversation"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0 relative">
        <button className="flex items-center gap-2 px-4 py-1.5 text-[14px] font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-all active:scale-95 cursor-pointer">
          <IoMdShare className="text-[18px]" />
          Share
        </button>
        <div className="h-6 w-px bg-slate-200 mx-1 md:mx-2"></div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500 cursor-pointer"
          >
            <MdMoreHoriz className="w-7 h-7" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-fade-in origin-top-right">
              <button
                onClick={() => {
                  onDelete();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-semibold cursor-pointer"
              >
                <MdDelete className="text-[16px]" />
                Delete Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AIChatHeader;
