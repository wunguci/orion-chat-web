import type React from "react";
import NoteHeader from "./NoteHeader";
import type { Note } from "../../types/note";
import { MdEditNote, MdPushPin } from "react-icons/md";
import EditorTitleNote from "./EditorTitleNote";
import CategoryNoteSelector from "./CategoryNoteSelector";
import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface NoteEditorProps {
  note: Note | undefined;
  categories: string[];
  addCategory: (cat: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
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

  useEffect(() => {
    if (note && editorRef.current && !quillInstance.current) {
      // Khởi tạo Quill editor
      quillInstance.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Type something amazing...",
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

      // Xử lý các thay đổi nội dung
      quillInstance.current.on("text-change", () => {
        const html = quillInstance.current?.root.innerHTML || "";
        // Chỉ cập nhật nếu nội dung thực sự khác biệt để tránh vòng lặp
        if (note && html !== note.content) {
          updateNote(note.id, { content: html });
        }
      });
    }

    // Cập nhật nội dung trình chỉnh sửa khi có thay đổi ghi chú
    if (note && quillInstance.current) {
        if (quillInstance.current.root.innerHTML !== note.content) {
            quillInstance.current.root.innerHTML = note.content || '';
        }
    }

    return () => {
        if (!note) quillInstance.current = null;
    }
  }, [note, updateNote]);

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-300">
        <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shadow-sm mb-4 border border-slate-100">
          <MdEditNote className="text-6xl opacity-20 text-teal-500" />
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
    updateNote(note.id, { title });
  };

  const togglePin = () => {
    updateNote(note.id, { isPinned: !note.isPinned });
  };

  const handleAddCategory = (newCat: string) => {
    addCategory(newCat);
    updateNote(note.id, { category: newCat });
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
            onSelect={(cat) => updateNote(note.id, { category: cat })}
            onAdd={handleAddCategory}
          />

          <div className="h-6 w-px bg-slate-200"></div>

          <button
            onClick={togglePin}
            className={`flex items-center gap-2 text-[14px] font-semibold transition-all group cursor-pointer ${
              note.isPinned
                ? "text-teal-500"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <MdPushPin
              className={`text-[18px] transition-transform ${note.isPinned ? "rotate-45" : "group-hover:-rotate-12"}`}
            />
            <span>{note.isPinned ? "Pinned to top" : "Pin note"}</span>
          </button>
        </div>

        {/* Rich text editor container  */}
        <div className="flex flex-col relative min-h-125">
          <div ref={editorRef}></div>
        </div>
      </div>
    </main>
  );
};

export default NoteEditor;
