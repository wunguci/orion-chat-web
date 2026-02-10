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
    () => notes.find((n) => n.id === activeNoteId),
    [notes, activeNoteId],
  );

  // Add category
  const addCategory = (newCat: string) => {
    if (newCat && !categories.includes(newCat)) {
      setCategories((prev) => [...prev, newCat]);
    }
  };

  // Search note
  const filteredNotes = useMemo(() => {
    return notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));
  }, [notes, searchQuery]);

  // Update node
  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    );
  };

  // Create note
  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "New Note",
      content: "",
      category: "General",
      timestamp: `${new Date().getHours().toString().padStart(2, "0")}:${new Date().getMinutes().toString().padStart(2, "0")} • ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
      isPinned: false,
      folder: "Personal notes",
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  // Delete note
  const deleteNote = (id: string) => {
    const filtered = notes.filter((n) => n.id !== id);
    setNotes(filtered);
    if (activeNoteId === id) {
      // Khi xóa note đang active, có thể chọn note tiếp theo hoặc để trống
      setActiveNoteId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  return (
    //   <div className="flex h-screen bg-white dark:bg-slate-900 transition-colors">
    <div className="flex h-screen bg-white transition-colors">
      <NotesList
        notes={filteredNotes}
        activeNoteId={activeNoteId || ""}
        setActiveNoteId={setActiveNoteId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onCreateNote={createNote}
      />

      <NoteEditor
        note={activeNote}
        categories={categories}
        addCategory={addCategory}
        updateNote={updateNote}
        onDelete={deleteNote}
      />
    </div>
  );
};

export default NotesPage;
