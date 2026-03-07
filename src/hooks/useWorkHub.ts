import { useState } from "react";
import type { Workspace, WorkspaceMember, WorkspaceRole, Board } from "../types/work-hub.types";
import { MOCK_WORKSPACES } from "../data/work-hub-mock";

export function useWorkHub() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(MOCK_WORKSPACES);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(MOCK_WORKSPACES[0]?.id || "");

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || null;

  const createWorkspace = (workspace: Omit<Workspace, "id" | "createdAt" | "stats">) => {
    const newWorkspace: Workspace = {
      ...workspace,
      id: `ws-${Date.now()}`,
      createdAt: new Date().toISOString(),
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        totalMembers: workspace.members.length,
      },
    };
    setWorkspaces([...workspaces, newWorkspace]);
    return newWorkspace;
  };

  const updateWorkspace = (id: string, updates: Partial<Workspace>) => {
    setWorkspaces(workspaces.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const deleteWorkspace = (id: string) => {
    setWorkspaces(workspaces.filter((w) => w.id !== id));
    if (activeWorkspaceId === id && workspaces.length > 1) {
      setActiveWorkspaceId(workspaces.find((w) => w.id !== id)?.id || "");
    }
  };

  const inviteMember = (workspaceId: string, member: WorkspaceMember) => {
    setWorkspaces(
      workspaces.map((w) =>
        w.id === workspaceId ? { ...w, members: [...w.members, member] } : w
      )
    );
  };

  const removeMember = (workspaceId: string, userId: string) => {
    setWorkspaces(
      workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, members: w.members.filter((m) => m.user.id !== userId) }
          : w
      )
    );
  };

  const updateMemberRole = (workspaceId: string, userId: string, role: WorkspaceRole) => {
    setWorkspaces(
      workspaces.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              members: w.members.map((m) =>
                m.user.id === userId ? { ...m, role } : m
              ),
            }
          : w
      )
    );
  };

  const addBoard = (workspaceId: string, board: Board) => {
    setWorkspaces(
      workspaces.map((w) =>
        w.id === workspaceId ? { ...w, boards: [...w.boards, board] } : w
      )
    );
  };

  const updateBoard = (workspaceId: string, boardId: string, updates: Partial<Board>) => {
    setWorkspaces(
      workspaces.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              boards: w.boards.map((b) =>
                b.id === boardId ? { ...b, ...updates } : b
              ),
            }
          : w
      )
    );
  };

  const deleteBoard = (workspaceId: string, boardId: string) => {
    setWorkspaces(
      workspaces.map((w) =>
        w.id === workspaceId
          ? { ...w, boards: w.boards.filter((b) => b.id !== boardId) }
          : w
      )
    );
  };

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    inviteMember,
    removeMember,
    updateMemberRole,
    addBoard,
    updateBoard,
    deleteBoard,
  };
}
