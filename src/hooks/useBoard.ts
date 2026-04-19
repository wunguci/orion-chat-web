import { useState, useEffect, useCallback } from "react";
import type { Board, BoardColumn, TaskStatus } from "../types/work-hub.types";
import { workHubApi } from "../features/work-hub/work-hub.api";
import { mapBoard } from "../features/work-hub/work-hub.mappers";
import { dispatchWorkhubWorkspaceUpdated } from "../utils/workhubEvents";

export function useBoard(workspaceId: string) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const activeBoard = boards.find((b) => b.id === activeBoardId) || null;

  // Fetch boards khi workspaceId thay đổi
  const fetchBoards = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await workHubApi.getBoards(workspaceId);
      const mapped = data.map((b) => mapBoard(b, workspaceId));
      setBoards(mapped);
      if (mapped.length > 0 && !activeBoardId) {
        setActiveBoardId(mapped[0].id);
      }
    } catch {
      // Fallback: giữ boards rỗng
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const createBoard = async (
    board: Omit<Board, "id" | "createdAt" | "columns">,
  ) => {
    const data = await workHubApi.createBoard(workspaceId, {
      boardName: board.name,
      description: board.description,
      backgroundColor: board.color,
      icon: board.icon,
    });
    const mapped = mapBoard(data, workspaceId);
    setBoards((prev) => [...prev, mapped]);
    dispatchWorkhubWorkspaceUpdated(workspaceId);
    return mapped;
  };

  const updateBoard = async (boardId: string, updates: Partial<Board>) => {
    const req: Record<string, unknown> = {};
    if (updates.name !== undefined) req.boardName = updates.name;
    if (updates.description !== undefined)
      req.description = updates.description;
    if (updates.color !== undefined) req.backgroundColor = updates.color;
    if (updates.icon !== undefined) req.icon = updates.icon;

    await workHubApi.updateBoard(workspaceId, boardId, req);
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, ...updates } : b)),
    );
    dispatchWorkhubWorkspaceUpdated(workspaceId);
  };

  const deleteBoard = async (boardId: string) => {
    await workHubApi.deleteBoard(workspaceId, boardId);
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    if (activeBoardId === boardId && boards.length > 1) {
      setActiveBoardId(boards.find((b) => b.id !== boardId)?.id || "");
    }
    dispatchWorkhubWorkspaceUpdated(workspaceId);
  };

  // Column operations - giữ local state (column API riêng nếu cần)
  const addColumn = (
    boardId: string,
    column: Omit<BoardColumn, "id" | "order">,
  ) => {
    setBoards(
      boards.map((b) => {
        if (b.id !== boardId) return b;
        const newCol: BoardColumn = {
          ...column,
          id: `col-${Date.now()}`,
          order: b.columns.length,
        };
        return { ...b, columns: [...b.columns, newCol] };
      }),
    );
  };

  const updateColumn = (
    boardId: string,
    columnId: string,
    updates: Partial<BoardColumn>,
  ) => {
    setBoards(
      boards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              columns: b.columns.map((c) =>
                c.id === columnId ? { ...c, ...updates } : c,
              ),
            }
          : b,
      ),
    );
  };

  const removeColumn = (boardId: string, columnId: string) => {
    setBoards(
      boards.map((b) =>
        b.id === boardId
          ? { ...b, columns: b.columns.filter((c) => c.id !== columnId) }
          : b,
      ),
    );
  };

  const reorderColumns = (boardId: string, columns: BoardColumn[]) => {
    setBoards(boards.map((b) => (b.id === boardId ? { ...b, columns } : b)));
  };

  const getColumnByStatus = (status: TaskStatus): BoardColumn | undefined => {
    return activeBoard?.columns.find((c) => c.status === status);
  };

  return {
    boards,
    activeBoard,
    activeBoardId,
    loading,
    setActiveBoardId,
    fetchBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    addColumn,
    updateColumn,
    removeColumn,
    reorderColumns,
    getColumnByStatus,
  };
}
