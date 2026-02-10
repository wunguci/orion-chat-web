import type React from "react";
import NotesList from "../../components/note/NotesList";
import NoteEditor from "../../components/note/NoteEditor";
import { useMemo, useState } from "react";
import type { Note } from "../../types/note";

const INITIAL_CATEGORIES: string[] = [
  "Finance",
  "Sport",
  "Personal",
  "Work",
  "General",
];

const INITIAL_NOTES: Note[] = [
  {
    id: "1",
    title: "Debts Tracking",
    content: "Huynh Thanh Zang: 300tr\nHo Quang Nhon: 2 tỉ 1",
    category: "Finance",
    timestamp: "23:15 • 18 Jan 2026",
    isPinned: true,
    folder: "Personal notes",
  },
  {
    id: "2",
    title: "Badminton Session",
    content: "Saturday afternoon with the team. Bring extra rackets.",
    category: "Sport",
    timestamp: "21:04 • 17 Jan 2026",
    isPinned: false,
    folder: "Sport notes",
  },
  {
    id: "3",
    title: "Grocery List",
    content: "Milk, Eggs, Bread, Avocados, Chicken breast.",
    category: "Personal",
    timestamp: "10:30 • 15 Jan 2026",
    isPinned: false,
    folder: "Household",
  },
  {
    id: "4",
    title: "Project Roadmap 2026",
    content:
      "Q1: MVP Launch\nQ2: Scaling Infrastructure\nQ3: International expansion",
    category: "Work",
    timestamp: "09:12 • 12 Jan 2026",
    isPinned: false,
    folder: "Career",
  },
];

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeNote = useMemo(
    () => notes.find(n => n.id === activeNoteId),
    [notes, activeNoteId],
  );

  return (
    //   <div className="flex h-screen bg-white dark:bg-slate-900 transition-colors">
    <div className="flex h-screen bg-white transition-colors">
      <NotesList
        notes={notes}
        activeNoteId={activeNoteId || ''}
        setActiveNoteId={setActiveNoteId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onCreateNote={() => {}}
      />

      <NoteEditor
        note={activeNote}
        categories={categories}
        addCategory={() => {}}
        updateNote={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
};

export default NotesPage;
