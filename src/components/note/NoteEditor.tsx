import type React from "react";
import NoteHeader from "./NoteHeader";
import type { Note, NoteCategory } from "../../types/note";
import { MdEditNote, MdPushPin } from "react-icons/md";
import EditorTitleNote from "./EditorTitleNote";
import CategoryNoteSelector from "./CategoryNoteSelector";
import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface NoteEditorProps {
  note: Note | undefined;
  categories: NoteCategory[];
  addCategory: (name: string) => void;
  updateNote: (noteId: string, updates: Partial<Note>) => void;
  onDelete: (noteId: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  categories,
  addCategory,
  updateNote,
  onDelete,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<Quill | null>(null);
  const noteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (note && editorRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Start writing your note...",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["blockquote", "code-block"],
            ["link", "image"],
            ["clean"],
          ],
        },
      });

      quillInstance.current.on("text-change", () => {
        const html = quillInstance.current?.root.innerHTML || "";
        if (noteIdRef.current && html !== note.content) {
          updateNote(noteIdRef.current, { content: html });
        }
      });
    }

    if (note && quillInstance.current) {
      noteIdRef.current = note.noteId;
      if (quillInstance.current.root.innerHTML !== note.content) {
        quillInstance.current.root.innerHTML = note.content || "";
      }
    }

    return () => {
      if (!note) {
        quillInstance.current = null;
        noteIdRef.current = null;
      }
    };
  }, [note, updateNote]);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-300">
        <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shadow-sm mb-4 border border-slate-100">
          <MdEditNote className="text-6xl opacity-20 text-green-primary" />
        </div>
        <h2 className="text-xl font-bold text-slate-80 mb-2">
          No note selected
        </h2>
        <p className="text-[14px] font-medium text-slate-400 italic">
          Select a note from the sidebar to start editing
        </p>
      </div>
    );
  }

  const handleTitleChange = (title: string) => {
    updateNote(note.noteId, { title });
  };

  const togglePin = () => {
    updateNote(note.noteId, { isPinned: !note.isPinned });
  };

  const handleSelectCategory = (categoryId: string) => {
    const cat = categories.find((c) => c.categoryId === categoryId);
    if (cat) {
      updateNote(note.noteId, { categoryId, category: cat });
    }
  };

  const handleAddCategory = (name: string) => {
    addCategory(name);
  };

  return (
    <main className="flex-1 flex flex-col bg-white overflow-hidden">
      <NoteHeader note={note} onDelete={onDelete} />

      <div className="px-10 py-8 space-y-8 overflow-y-auto hide-scrollbar flex-1 max-w-5xl mx-auto w-full">
        <EditorTitleNote value={note.title} onChange={handleTitleChange} />

        <div className="flex items-center gap-8">
          <CategoryNoteSelector
            activeCategory={note.category}
            categories={categories}
            onSelect={handleSelectCategory}
            onAdd={handleAddCategory}
          />

          <div className="h-6 w-px bg-slate-200"></div>

          <button
            onClick={togglePin}
            className={`flex items-center gap-2 text-[14px] font-semibold transition-all group cursor-pointer ${
              note.isPinned
                ? "text-green-primary"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <MdPushPin
              className={`text-[18px] transition-transform ${note.isPinned ? "rotate-45" : "group-hover:-rotate-12"}`}
            />
            <span>{note.isPinned ? "Pinned to top" : "Pin note"}</span>
          </button>
        </div>

        <div className="flex flex-col relative min-h-125">
          <div ref={editorRef}></div>
        </div>
      </div>
    </main>
  );
};

export default NoteEditor;
