import type React from "react";
import NotesList from "../../components/note/NotesList";
import NoteEditor from "../../components/note/NoteEditor";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { ToastUndo } from "../../components/common/ToastUndo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Note, NoteCategory } from "../../types/note";
import { noteService } from "../../services/noteService";
import { getUser } from "../../utils/token";

const NotesPage: React.FC = () => {
  const user = getUser();
  const userId = user?.id || "";

  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [deletedNote, setDeletedNote] = useState<Note | null>(null);

  // bộ hẹn giờ khử nhiễu cho tự động lưu nội dung
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load notes và categories từ server
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [notesRes, catsData] = await Promise.all([
          noteService.getAll(),
          noteService.getCategories(),
        ]);
        setNotes(notesRes.notes);
        setCategories(catsData);

        // set active note là note đầu tiên
        if (notesRes.notes.length > 0) {
          setActiveNoteId(notesRes.notes[0].noteId);
        }
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  const activeNote = useMemo(
    () => notes.find((n) => n.noteId === activeNoteId),
    [notes, activeNoteId],
  );

  // Search & sort notes (client-side filter)
  const filteredNotes = useMemo(() => {
    return notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));
  }, [notes, searchQuery]);

  // Update note - debounce cho nội dung, cho tiêu đề/danh mục/ghim tức thì
  const updateNote = useCallback(
    (noteId: string, updates: Partial<Note>) => {
      // Cập nhật local state ngay lập tức
      setNotes((prev) =>
        prev.map((n) => (n.noteId === noteId ? { ...n, ...updates } : n)),
      );

      // Debounce API call
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          const apiUpdates: Record<string, unknown> = {};
          if (updates.title !== undefined) apiUpdates.title = updates.title;
          if (updates.content !== undefined) apiUpdates.content = updates.content;
          if (updates.categoryId !== undefined) apiUpdates.categoryId = updates.categoryId;
          if (updates.isPinned !== undefined) apiUpdates.isPinned = updates.isPinned;

          if (Object.keys(apiUpdates).length > 0) {
            const updated = await noteService.update(noteId, apiUpdates);
            setNotes((prev) =>
              prev.map((n) => (n.noteId === noteId ? updated : n)),
            );
          }
        } catch (error) {
          console.error("Failed to update note:", error);
        }
      }, 500);
    },
    [],
  );

  // Create note
  const createNote = useCallback(async () => {
    if (!categories.length) return;

    try {
      const newNote = await noteService.create({
        title: "New Note",
        content: "",
        categoryId: categories[0].categoryId,
      });
      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.noteId);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  }, [categories]);

  // Delete note - show confirmation dialog
  const deleteNote = useCallback(
    (noteId: string) => {
      setNoteToDelete(noteId);
      setDeleteDialogOpen(true);
    },
    [],
  );

  // Confirm delete
  const confirmDelete = useCallback(async () => {
    if (!noteToDelete) return;

    try {
      // Find the note to delete for undo
      const noteToRestore = notes.find((n) => n.noteId === noteToDelete);
      
      await noteService.delete(noteToDelete);
      setNotes((prev) => {
        const filtered = prev.filter((n) => n.noteId !== noteToDelete);
        if (activeNoteId === noteToDelete) {
          setActiveNoteId(filtered.length > 0 ? filtered[0].noteId : null);
        }
        return filtered;
      });
      
      // Show undo toast
      if (noteToRestore) {
        setDeletedNote(noteToRestore);
        setShowUndoToast(true);
        
        // Clear previous undo timer
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        // Auto-hide toast after 4 seconds
        undoTimerRef.current = setTimeout(() => {
          setShowUndoToast(false);
        }, 4000);
      }
      
      setNoteToDelete(null);
    } catch (error) {
      console.error("Failed to delete note:", error);
      setNoteToDelete(null);
    }
  }, [noteToDelete, activeNoteId, notes]);

  // Undo delete
  const handleUndoDelete = useCallback(async () => {
    if (!deletedNote) return;

    try {
      const restored = await noteService.create({
        title: deletedNote.title,
        content: deletedNote.content,
        categoryId: deletedNote.categoryId,
      });
      
      // Restore pin state if needed
      if (deletedNote.isPinned) {
        await noteService.togglePin(restored.noteId);
        restored.isPinned = true;
      }
      
      setNotes((prev) => [restored, ...prev]);
      setDeletedNote(null);
      setShowUndoToast(false);
      
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    } catch (error) {
      console.error("Failed to restore note:", error);
    }
  }, [deletedNote]);

  // Add category
  const addCategory = useCallback(
    async (name: string) => {
      if (!name || categories.some((c) => c.name === name)) return;

      try {
        const newCat = await noteService.createCategory({ name });
        setCategories((prev) => [...prev, newCat]);
      } catch (error) {
        console.error("Failed to create category:", error);
      }
    },
    [categories],
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-slate-400 text-sm">Loading notes...</p>
      </div>
    );
  }

  return (
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

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setNoteToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? You can undo within 4 seconds."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ToastUndo
        isVisible={showUndoToast}
        message="Note deleted"
        onUndo={handleUndoDelete}
        duration={4000}
      />
    </div>
  );
};

export default NotesPage;
