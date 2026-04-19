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
  mapSubTask,
  mapComment,
  mapAttachment,
  statusToBE,
  priorityToBE,
} from "../features/work-hub/work-hub.mappers";
import { getUser } from "../utils/token";

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
    const authUser = getUser();
    const createdById =
      task.createdBy.id || authUser?.userId || authUser?.id || undefined;

    if (!createdById) {
      throw new Error("Cannot determine task creator");
    }

    const data = await workHubApi.createTask(boardId, {
      title: task.title,
      description: task.description,
      priority: priorityToBE(task.priority),
      status: statusToBE(task.status),
      startDate: task.startDate,
      dueDate: task.deadline,
      columnId: task.columnId || undefined,
      createdById,
      assigneeIds: task.assignees.map((a) => a.id),
      labelIds: task.labels.map((l) => l.id),
    });
    const mapped = mapTask(data);
    setTasks((prev) => [...prev, mapped]);
    return mapped;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
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
    } catch {}
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskId === taskId) setSelectedTaskId(null);
  };

  const moveTask = async (
    taskId: string,
    toColumnId: string,
    toStatus: TaskStatus,
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    const prevColumnId = task?.columnId;
    const prevStatus = task?.status;

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
      if (prevColumnId !== undefined && prevStatus !== undefined) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  columnId: prevColumnId,
                  status: prevStatus,
                }
              : t,
          ),
        );
      }
    }
  };

  const changeStatus = (
    taskId: string,
    status: TaskStatus,
    columnId: string,
  ) => {
    moveTask(taskId, columnId, status);
  };

  const addSubtask = async (
    taskId: string,
    parentSubtaskId: string | null,
    subtask: Omit<SubTask, "id" | "order" | "children">,
  ) => {
    try {
      await workHubApi.createSubTask(taskId, {
        title: subtask.title,
        description: subtask.description,
        status: statusToBE(subtask.status),
        parentSubTaskId: parentSubtaskId || undefined,
        assigneeId: subtask.assignee?.id,
        deadline: subtask.deadline,
      });
      const subtasks = await workHubApi.getSubTasks(taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, subtasks: subtasks.map(mapSubTask) } : t,
        ),
      );
    } catch (err) {
      console.error("Failed to add subtask:", err);
    }
  };

  const updateSubtask = async (
    taskId: string,
    subtaskId: string,
    updates: Partial<SubTask>,
  ) => {
    try {
      await workHubApi.updateSubTask(subtaskId, {
        title: updates.title,
        description: updates.description,
        status: updates.status ? statusToBE(updates.status) : undefined,
        assigneeId: updates.assignee?.id,
        deadline: updates.deadline,
      });
      const subtasks = await workHubApi.getSubTasks(taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, subtasks: subtasks.map(mapSubTask) } : t,
        ),
      );
    } catch (err) {
      console.error("Failed to update subtask:", err);
    }
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      await workHubApi.deleteSubTask(subtaskId);
      const subtasks = await workHubApi.getSubTasks(taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, subtasks: subtasks.map(mapSubTask) } : t,
        ),
      );
    } catch (err) {
      console.error("Failed to delete subtask:", err);
    }
  };

  const addComment = async (taskId: string, comment: Omit<Comment, "id">) => {
    try {
      await workHubApi.createComment(taskId, {
        content: comment.text,
        authorId: comment.author.id,
      });
      const comments = await workHubApi.getComments(taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, comments: comments.map(mapComment) } : t,
        ),
      );
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const addAttachment = async (
    taskId: string,
    attachment: Omit<Attachment, "id">,
  ) => {
    try {
      await workHubApi.createAttachment(taskId, {
        fileName: attachment.name,
        fileUrl: attachment.url,
        fileType: attachment.type,
        fileSize: attachment.size,
        uploadedById: attachment.uploadedBy.id,
      });
      const attachments = await workHubApi.getAttachments(taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, attachments: attachments.map(mapAttachment) }
            : t,
        ),
      );
    } catch (err) {
      console.error("Failed to add attachment:", err);
    }
  };

  const transferTask = async (transfer: TaskTransfer) => {
    const currentTask = tasks.find((task) => task.id === transfer.taskId);
    if (!currentTask) return;

    const newAssignees = currentTask.assignees
      .filter((assignee) => assignee.id !== transfer.fromUser.id)
      .concat(transfer.toUser);

    const newAssigneeIds = Array.from(
      new Set(
        newAssignees
          .map((assignee) => assignee.id)
          .filter((assigneeId): assigneeId is string => !!assigneeId),
      ),
    );

    const newActivity: ActivityEntry = {
      id: `ah-${Date.now()}`,
      type: "transferred",
      user: transfer.fromUser,
      description: `transferred this task to ${transfer.toUser.name}. Reason: "${transfer.reason}"`,
      timestamp: transfer.timestamp,
    };

    try {
      const updatedTask = await workHubApi.updateTask(transfer.taskId, {
        assigneeIds: newAssigneeIds,
      });
      const mapped = mapTask(updatedTask);

      setTasks((prev) =>
        prev.map((task) =>
          task.id === transfer.taskId
            ? {
                ...mapped,
                activityHistory: [...task.activityHistory, newActivity],
              }
            : task,
        ),
      );
    } catch {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== transfer.taskId) return task;
          return {
            ...task,
            assignees: newAssignees,
            activityHistory: [...task.activityHistory, newActivity],
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    }
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
