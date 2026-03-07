import { useState, useCallback } from "react";

export function useDragDrop() {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const handleDragStart = useCallback((itemId: string) => {
    setDraggedItemId(itemId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null);
    setDragOverColumnId(null);
  }, []);

  const handleDragEnter = useCallback((columnId: string) => {
    setDragOverColumnId(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumnId(null);
  }, []);

  const handleDrop = useCallback(
    (
      columnId: string,
      onMove: (itemId: string, toColumnId: string) => void
    ) => {
      if (draggedItemId) {
        onMove(draggedItemId, columnId);
      }
      setDraggedItemId(null);
      setDragOverColumnId(null);
    },
    [draggedItemId]
  );

  return {
    draggedItemId,
    dragOverColumnId,
    handleDragStart,
    handleDragEnd,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  };
}
