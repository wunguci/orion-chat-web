import { useState, useEffect, useCallback } from "react";
import type {
  Task,
  SubTask,
  TaskStatus,
  Comment,
  Attachment,
  ActivityEntry,
  User,
  TaskTransfer,
} from "../types/work-hub.types";
import { workHubApi } from "../features/work-hub/work-hub.api";
import {
  mapTask,
  statusToBE,
  priorityToBE,
} from "../features/work-hub/work-hub.mappers";

function calculateSubtaskProgress(subtasks: SubTask[]): number {
  if (subtasks.length === 0) return 100;

  let total = 0;
  let done = 0;

  const count = (items: SubTask[]) => {
    for (const st of items) {
      if (st.children.length === 0) {
        total++;
        if (st.status === "done") done++;
      } else {
        count(st.children);
      }
    }
  };

  count(subtasks);
  return total > 0 ? Math.round((done / total) * 100) : 100;
}

function countSubtasks(subtasks: SubTask[]): { done: number; total: number } {
  let total = 0;
  let done = 0;

  const count = (items: SubTask[]) => {
    for (const st of items) {
      total++;
      if (st.status === "done") done++;
      if (st.children.length > 0) count(st.children);
    }
  };

  count(subtasks);
  return { done, total };
}

export function useTask(boardId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  // Fetch tasks khi boardId thay đổi
  const fetchTasks = useCallback(async () => {
    if (!boardId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await workHubApi.getTasksByBoard(boardId);
      setTasks(data.map(mapTask));
    } catch {
      // Fallback: giữ tasks rỗng
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getTasksByColumn = (columnId: string) =>
    tasks
      .filter((t) => t.columnId === columnId)
      .sort((a, b) => a.order - b.order);

  const createTask = async (
    task: Omit<
      Task,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "viewCount"
      | "viewedBy"
      | "activityHistory"
      | "order"
    >,
  ) => {
    const data = await workHubApi.createTask(boardId, {
      title: task.title,
      description: task.description,
      priority: priorityToBE(task.priority),
      status: statusToBE(task.status),
      startDate: task.startDate,
      dueDate: task.deadline,
      columnId: task.columnId || undefined,
      createdById: task.createdBy.id,
      assigneeIds: task.assignees.map((a) => a.id),
      labelIds: task.labels.map((l) => l.id),
    });
    const mapped = mapTask(data);
    setTasks((prev) => [...prev, mapped]);
    return mapped;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    // Gửi API update
    const req: Record<string, unknown> = {};
    if (updates.title !== undefined) req.title = updates.title;
    if (updates.description !== undefined)
      req.description = updates.description;
    if (updates.priority !== undefined)
      req.priority = priorityToBE(updates.priority);
    if (updates.status !== undefined) req.status = statusToBE(updates.status);
    if (updates.startDate !== undefined) req.startDate = updates.startDate;
    if (updates.deadline !== undefined) req.dueDate = updates.deadline;
    if (updates.assignees !== undefined)
      req.assigneeIds = updates.assignees.map((a) => a.id);
    if (updates.labels !== undefined)
      req.labelIds = updates.labels.map((l) => l.id);

    try {
      const data = await workHubApi.updateTask(taskId, req);
      const mapped = mapTask(data);
      // Giữ lại subtasks, comments, attachments từ local state
      const existing = tasks.find((t) => t.id === taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...mapped,
                subtasks: existing?.subtasks ?? [],
                comments: existing?.comments ?? [],
                attachments: existing?.attachments ?? [],
                activityHistory: existing?.activityHistory ?? [],
                viewCount: existing?.viewCount ?? 0,
                viewedBy: existing?.viewedBy ?? [],
              }
            : t,
        ),
      );
    } catch {
      // Fallback: update local state
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, ...updates, updatedAt: new Date().toISOString() }
            : t,
        ),
      );
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await workHubApi.deleteTask(taskId);
    } catch {
      // Xóa local ngay cả khi API lỗi
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskId === taskId) setSelectedTaskId(null);
  };

  const moveTask = async (
    taskId: string,
    toColumnId: string,
    toStatus: TaskStatus,
  ) => {
    // Update local state trước (optimistic update cho UX mượt)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              columnId: toColumnId,
              status: toStatus,
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );

    try {
      await workHubApi.moveTask(taskId, {
        columnId: toColumnId,
        status: statusToBE(toStatus),
      });
    } catch {
      // Nếu API lỗi, giữ nguyên state local (đã move rồi)
    }
  };

  const changeStatus = (
    taskId: string,
    status: TaskStatus,
    columnId: string,
  ) => {
    moveTask(taskId, columnId, status);
  };

  // --- Subtask, Comment, Attachment: giữ local state ---

  const addSubtask = (
    taskId: string,
    parentSubtaskId: string | null,
    subtask: Omit<SubTask, "id" | "order" | "children">,
  ) => {
    setTasks(
      tasks.map((t) => {
        if (t.id !== taskId) return t;

        const newSubtask: SubTask = {
          ...subtask,
          id: `st-${Date.now()}`,
          children: [],
          order: 0,
        };

        if (!parentSubtaskId) {
          newSubtask.order = t.subtasks.length;
          return { ...t, subtasks: [...t.subtasks, newSubtask] };
        }

        const addToParent = (items: SubTask[]): SubTask[] =>
          items.map((st) => {
            if (st.id === parentSubtaskId) {
              newSubtask.order = st.children.length;
              return { ...st, children: [...st.children, newSubtask] };
            }
            return { ...st, children: addToParent(st.children) };
          });

        return { ...t, subtasks: addToParent(t.subtasks) };
      }),
    );
  };

  const updateSubtask = (
    taskId: string,
    subtaskId: string,
    updates: Partial<SubTask>,
  ) => {
    setTasks(
      tasks.map((t) => {
        if (t.id !== taskId) return t;

        const updateInTree = (items: SubTask[]): SubTask[] =>
          items.map((st) =>
            st.id === subtaskId
              ? { ...st, ...updates }
              : { ...st, children: updateInTree(st.children) },
          );

        return { ...t, subtasks: updateInTree(t.subtasks) };
      }),
    );
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id !== taskId) return t;

        const removeFromTree = (items: SubTask[]): SubTask[] =>
          items
            .filter((st) => st.id !== subtaskId)
            .map((st) => ({ ...st, children: removeFromTree(st.children) }));

        return { ...t, subtasks: removeFromTree(t.subtasks) };
      }),
    );
  };

  const addComment = (taskId: string, comment: Omit<Comment, "id">) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [...t.comments, { ...comment, id: `c-${Date.now()}` }],
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
  };

  const addAttachment = (
    taskId: string,
    attachment: Omit<Attachment, "id">,
  ) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              attachments: [
                ...t.attachments,
                { ...attachment, id: `a-${Date.now()}` },
              ],
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
  };

  const transferTask = (transfer: TaskTransfer) => {
    setTasks(
      tasks.map((t) => {
        if (t.id !== transfer.taskId) return t;

        const newActivity: ActivityEntry = {
          id: `ah-${Date.now()}`,
          type: "transferred",
          user: transfer.fromUser,
          description: `transferred this task to ${transfer.toUser.name}. Reason: "${transfer.reason}"`,
          timestamp: transfer.timestamp,
        };

        const newAssignees = t.assignees
          .filter((a) => a.id !== transfer.fromUser.id)
          .concat(transfer.toUser);

        return {
          ...t,
          assignees: newAssignees,
          activityHistory: [...t.activityHistory, newActivity],
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  const markComplete = (
    taskId: string,
    _user: User,
  ): { hasIncompleteSubtasks: boolean; incompleteCount: number } => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { hasIncompleteSubtasks: false, incompleteCount: 0 };

    const { done, total } = countSubtasks(task.subtasks);
    const incompleteCount = total - done;

    return { hasIncompleteSubtasks: incompleteCount > 0, incompleteCount };
  };

  const confirmComplete = (taskId: string, columnId: string, user: User) => {
    setTasks(
      tasks.map((t) => {
        if (t.id !== taskId) return t;
        const newActivity: ActivityEntry = {
          id: `ah-${Date.now()}`,
          type: "completed",
          user,
          description: "marked this task as completed",
          timestamp: new Date().toISOString(),
        };
        return {
          ...t,
          status: "done" as TaskStatus,
          columnId,
          activityHistory: [...t.activityHistory, newActivity],
          updatedAt: new Date().toISOString(),
        };
      }),
    );

    // Gửi API move task sang Done
    workHubApi
      .moveTask(taskId, {
        columnId,
        status: "DONE",
      })
      .catch(() => {
        /* silent */
      });
  };

  const getSubtaskProgress = (taskId: string): number => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return 100;
    return calculateSubtaskProgress(task.subtasks);
  };

  const getSubtaskCount = (taskId: string): { done: number; total: number } => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { done: 0, total: 0 };
    return countSubtasks(task.subtasks);
  };

  return {
    tasks,
    selectedTask,
    selectedTaskId,
    loading,
    setSelectedTaskId,
    fetchTasks,
    getTasksByColumn,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    changeStatus,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    addComment,
    addAttachment,
    transferTask,
    markComplete,
    confirmComplete,
    getSubtaskProgress,
    getSubtaskCount,
  };
}
