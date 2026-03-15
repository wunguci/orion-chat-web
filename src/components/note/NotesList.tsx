import type React from "react";
import type { Note } from "../../types/note";
import SearchBoxNote from "./SearchBoxNote";
import NoteCard from "./NoteCard";
import { FaPlus } from "react-icons/fa6";
import { MdInventory2 } from "react-icons/md";

interface NotesListProps {
  notes: Note[];
  activeNoteId: string;
  setActiveNoteId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onCreateNote: () => void;
}

const NotesList: React.FC<NotesListProps> = ({
  notes,
  activeNoteId,
  setActiveNoteId,
  searchQuery,
  setSearchQuery,
  onCreateNote,
}) => {
  return (
    <section className="w-80 flex flex-col border-r border-slate-200 bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Notes
          </h1>
          <button
            onClick={onCreateNote}
            className="w-8 h-8 flex items-center justify-center bg-green-primary text-white rounded-lg hover:bg-green-secondary transition-all active:scale-90 shadow-lg shadow-green-500/20 cursor-pointer"
          >
            <FaPlus className="w-4 h-4" />
          </button>
        </div>
        <SearchBoxNote value={searchQuery} onChange={setSearchQuery} />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 hide-scrollbar">
        {notes.length > 0 ? (
          notes.map((note) => (
            <NoteCard
              key={note.noteId}
              note={note}
              isActive={note.noteId === activeNoteId}
              onClick={() => setActiveNoteId(note.noteId)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <MdInventory2 className="text-4xl mb-2 opacity-20" />
            <p className="text-xs font-medium italic">No notes found</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default NotesList;
