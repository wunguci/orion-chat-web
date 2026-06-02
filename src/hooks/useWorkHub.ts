import { useState, useEffect, useCallback } from "react";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  Board,
} from "../types/work-hub.types";
import { workHubApi } from "../features/work-hub/work-hub.api";
import {
  mapWorkspace,
  mapBoard,
  roleToBE,
  typeToBE,
} from "../features/work-hub/work-hub.mappers";
import type { CreateWorkspaceRequest } from "../features/work-hub/work-hub.api.types";
import { dispatchWorkhubWorkspaceUpdated } from "../utils/workhubEvents";

export function useWorkHub(userId?: string) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || null;

  // Fetch workspaces khi mount hoặc userId thay đổi
  const fetchWorkspaces = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await workHubApi.getWorkspaces(userId);
      const mapped = data.map(mapWorkspace);
      setWorkspaces(mapped);
      if (mapped.length > 0 && !activeWorkspaceId) {
        setActiveWorkspaceId(mapped[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch workspaces",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Fetch chi tiết 1 workspace (dùng khi vào trang workspace)
  const fetchWorkspace = async (id: string): Promise<Workspace | null> => {
    try {
      const data = await workHubApi.getWorkspace(id);
      const mapped = mapWorkspace(data);
      setWorkspaces((prev) => {
        const exists = prev.find((w) => w.id === id);
        if (exists) return prev.map((w) => (w.id === id ? mapped : w));
        return [...prev, mapped];
      });
      return mapped;
    } catch {
      return null;
    }
  };

  const createWorkspace = async (input: {
    name: string;
    description?: string;
    type: string;
    color?: string;
    isPublic?: boolean;
    memberLimit?: number;
  }) => {
    if (!userId) throw new Error("User not logged in");
    const req: CreateWorkspaceRequest = {
      workspaceName: input.name,
      description: input.description,
      type: typeToBE(input.type as Workspace["type"]),
      color: input.color,
      isPublic: input.isPublic,
      memberLimit: input.memberLimit,
      ownerId: userId,
    };
    const data = await workHubApi.createWorkspace(req);
    const mapped = mapWorkspace(data);
    setWorkspaces((prev) => [...prev, mapped]);
    setActiveWorkspaceId(mapped.id);
    return mapped;
  };

  const updateWorkspace = async (id: string, updates: Partial<Workspace>) => {
    const req: Record<string, unknown> = {};
    if (updates.name !== undefined) req.workspaceName = updates.name;
    if (updates.description !== undefined)
      req.description = updates.description;
    if (updates.type !== undefined) req.type = typeToBE(updates.type);
    if (updates.color !== undefined) req.color = updates.color;
    if (updates.isPublic !== undefined) req.isPublic = updates.isPublic;

    const data = await workHubApi.updateWorkspace(id, req);
    const mapped = mapWorkspace(data);
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? mapped : w)));
  };

  const deleteWorkspace = async (id: string) => {
    await workHubApi.deleteWorkspace(id);
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (activeWorkspaceId === id && workspaces.length > 1) {
      setActiveWorkspaceId(workspaces.find((w) => w.id !== id)?.id || "");
    }
  };

  const inviteMember = async (workspaceId: string, member: WorkspaceMember) => {
    await workHubApi.addMember(workspaceId, {
      userId: member.user.id,
      role: roleToBE(member.role),
    });
    await fetchWorkspace(workspaceId);
  };

  const removeMember = async (workspaceId: string, memberUserId: string) => {
    await workHubApi.removeMember(workspaceId, memberUserId);
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              members: w.members.filter((m) => m.user.id !== memberUserId),
            }
          : w,
      ),
    );
  };

  const updateMemberRole = async (
    workspaceId: string,
    memberUserId: string,
    role: WorkspaceRole,
  ) => {
    await workHubApi.updateMemberRole(workspaceId, memberUserId, {
      role: roleToBE(role),
    });
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              members: w.members.map((m) =>
                m.user.id === memberUserId ? { ...m, role } : m,
              ),
            }
          : w,
      ),
    );
  };

  const addBoard = async (
    workspaceId: string,
    board: Omit<Board, "id" | "createdAt" | "columns">,
  ) => {
    const data = await workHubApi.createBoard(workspaceId, {
      boardName: board.name,
      description: board.description,
      backgroundColor: board.color,
      icon: board.icon,
    });
    const mapped = mapBoard(data, workspaceId);
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === workspaceId ? { ...w, boards: [...w.boards, mapped] } : w,
      ),
    );
    dispatchWorkhubWorkspaceUpdated(workspaceId);
    return mapped;
  };

  const updateBoard = async (
    workspaceId: string,
    boardId: string,
    updates: Partial<Board>,
  ) => {
    const req: Record<string, unknown> = {};
    if (updates.name !== undefined) req.boardName = updates.name;
    if (updates.description !== undefined)
      req.description = updates.description;
    if (updates.color !== undefined) req.backgroundColor = updates.color;
    if (updates.icon !== undefined) req.icon = updates.icon;

    await workHubApi.updateBoard(workspaceId, boardId, req);
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              boards: w.boards.map((b) =>
                b.id === boardId ? { ...b, ...updates } : b,
              ),
            }
          : w,
      ),
    );
    dispatchWorkhubWorkspaceUpdated(workspaceId);
  };

  const deleteBoard = async (workspaceId: string, boardId: string) => {
    await workHubApi.deleteBoard(workspaceId, boardId);
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === workspaceId
          ? { ...w, boards: w.boards.filter((b) => b.id !== boardId) }
          : w,
      ),
    );
    dispatchWorkhubWorkspaceUpdated(workspaceId);
  };

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId,
    setActiveWorkspaceId,
    loading,
    error,
    fetchWorkspaces,
    fetchWorkspace,
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
