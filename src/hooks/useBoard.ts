import { useState } from "react";
import type { Board, BoardColumn, TaskStatus } from "../types/work-hub.types";
import { MOCK_BOARDS } from "../data/work-hub-mock";

export function useBoard(workspaceId: string) {
  const [boards, setBoards] = useState<Board[]>(
    MOCK_BOARDS.filter((b) => b.workspaceId === workspaceId)
  );
  const [activeBoardId, setActiveBoardId] = useState<string>(boards[0]?.id || "");

  const activeBoard = boards.find((b) => b.id === activeBoardId) || null;

  const createBoard = (board: Omit<Board, "id" | "createdAt">) => {
    const newBoard: Board = {
      ...board,
      id: `b-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setBoards([...boards, newBoard]);
    return newBoard;
  };

  const updateBoard = (boardId: string, updates: Partial<Board>) => {
    setBoards(boards.map((b) => (b.id === boardId ? { ...b, ...updates } : b)));
  };

  const deleteBoard = (boardId: string) => {
    setBoards(boards.filter((b) => b.id !== boardId));
    if (activeBoardId === boardId && boards.length > 1) {
      setActiveBoardId(boards.find((b) => b.id !== boardId)?.id || "");
    }
  };

  const addColumn = (boardId: string, column: Omit<BoardColumn, "id" | "order">) => {
    setBoards(
      boards.map((b) => {
        if (b.id !== boardId) return b;
        const newCol: BoardColumn = {
          ...column,
          id: `col-${Date.now()}`,
          order: b.columns.length,
        };
        return { ...b, columns: [...b.columns, newCol] };
      })
    );
  };

  const updateColumn = (boardId: string, columnId: string, updates: Partial<BoardColumn>) => {
    setBoards(
      boards.map((b) =>
        b.id === boardId
          ? {
              ...b,
              columns: b.columns.map((c) =>
                c.id === columnId ? { ...c, ...updates } : c
              ),
            }
          : b
      )
    );
  };

  const removeColumn = (boardId: string, columnId: string) => {
    setBoards(
      boards.map((b) =>
        b.id === boardId
          ? { ...b, columns: b.columns.filter((c) => c.id !== columnId) }
          : b
      )
    );
  };

  const reorderColumns = (boardId: string, columns: BoardColumn[]) => {
    setBoards(
      boards.map((b) => (b.id === boardId ? { ...b, columns } : b))
    );
  };

  const getColumnByStatus = (status: TaskStatus): BoardColumn | undefined => {
    return activeBoard?.columns.find((c) => c.status === status);
  };

  return {
    boards,
    activeBoard,
    activeBoardId,
    setActiveBoardId,
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
