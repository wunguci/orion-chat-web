import type React from "react";
import type { Note } from "../../types/note";
import { MdDescription, MdMoreHoriz, MdDelete } from "react-icons/md";
import { IoMdShare } from "react-icons/io";

interface NoteHeaderProps {
    note: Note;
    onDelete: (id: string) => void;
}

const NoteHeader: React.FC<NoteHeaderProps> = ({note, onDelete}) => {
    return (
        <header className="px-8 py-4 border-b border-slate-200 flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-3">
                <MdDescription className="text-slate-400 text-[20px]"/>
                <nav className="flex items-center text-[14px] font-medium">
                    <span className="text-slate-400">{note.folder || 'Notes'}</span>
                    <span className="mx-2 text-slate-300">/</span>
                    <span className="text-slate-800 font-semibold">{note.title}</span>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-1.5 text-[14px] font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-all active:scale-95 cursor-pointer">
                    <IoMdShare className="text-[18px]"/>
                    Share
                </button>

                <div className="relative group">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500 cursor-pointer">
                        <MdMoreHoriz className="w-7 h-7"/>
                    </button>

                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                        <button 
                            onClick={() => onDelete(note.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 cursor-pointer">
                            <MdDelete className="text-[16px]"/>
                            Delete Note
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default NoteHeader;