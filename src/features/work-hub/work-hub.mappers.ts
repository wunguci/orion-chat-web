import type {
  User,
  Workspace,
  WorkspaceMember,
  Board,
  BoardColumn,
  Task,
  Label,
  SubTask,
  Comment,
  Attachment,
  ActivityEntry,
  WorkspaceType,
  WorkspaceRole,
  TaskStatus,
  TaskPriority,
  WorkspaceStats,
  Goal,
  GoalStatus,
  KeyResult,
  Sprint,
  SprintStatus,
  Epic,
  EpicStatus,
  Milestone,
  MilestoneStatus,
  AutomationRule,
  FileItem,
  FileAccessLevel,
} from "../../types/work-hub.types";

import type {
  UserResponse,
  WorkspaceResponse,
  WorkspaceMemberResponse,
  TaskBoardResponse,
  BoardColumnResponse,
  TaskResponse,
  LabelResponse,
  SubTaskResponse,
  CommentResponse,
  AttachmentResponse,
  ActivityLogResponse,
  GoalResponse,
  KeyResultResponse,
  SprintResponse,
  EpicResponse,
  MilestoneResponse,
  AutomationRuleResponse,
  DocumentResponse,
  DocumentVersionResponse,
  InlineCommentResponse,
  WorkspaceFileResponse,
} from "./work-hub.api.types";

const STATUS_TO_FE: Record<string, TaskStatus> = {
  TODO: "todo",
  IN_PROGRESS: "inprogress",
  REVIEW: "review",
  DONE: "done",
};

const STATUS_TO_BE: Record<string, string> = {
  todo: "TODO",
  inprogress: "IN_PROGRESS",
  review: "REVIEW",
  done: "DONE",
};

const PRIORITY_TO_FE: Record<string, TaskPriority> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "critical",
};

const PRIORITY_TO_BE: Record<string, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "URGENT",
};

const ROLE_TO_FE: Record<string, WorkspaceRole> = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
};

const ROLE_TO_BE: Record<string, string> = {
  owner: "OWNER",
  admin: "ADMIN",
  member: "MEMBER",
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/+$/,
  "",
);

const mapBackendAssetUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
};

export function statusToBE(s: TaskStatus): string {
  return STATUS_TO_BE[s] ?? "TODO";
}

export function priorityToBE(p: TaskPriority): string {
  return PRIORITY_TO_BE[p] ?? "LOW";
}

export function roleToBE(r: WorkspaceRole): string {
  return ROLE_TO_BE[r] ?? "MEMBER";
}

export function typeToBE(t: WorkspaceType): string {
  return t.toUpperCase();
}

export function mapUser(u: UserResponse): User {
  return {
    id: u.userId,
    name: u.fullName,
    email: u.email ?? "",
    phone: u.phoneNumber,
    avatar: u.avatarUrl ?? "/avatar-user.png",
    status: u.isOnline ? "online" : "offline",
  };
}

export function mapWorkspaceMember(
  m: WorkspaceMemberResponse,
): WorkspaceMember {
  return {
    user: mapUser(m.user),
    role: (ROLE_TO_FE[m.role] ?? "member") as WorkspaceRole,
    joinedAt: m.joinedAt,
  };
}

export function mapBoardColumn(c: BoardColumnResponse): BoardColumn {
  return {
    id: c.columnId,
    name: c.name,
    status: (STATUS_TO_FE[c.status] ?? "todo") as TaskStatus,
    color: c.color,
    order: c.order,
  };
}

export function mapBoard(b: TaskBoardResponse, workspaceId?: string): Board {
  return {
    id: b.boardId,
    workspaceId: workspaceId ?? "",
    name: b.boardName,
    description: b.description ?? undefined,
    color: b.backgroundColor,
    icon: b.icon,
    columns: (b.columns ?? [])
      .map(mapBoardColumn)
      .sort((a, b) => a.order - b.order),
    createdAt: b.createdAt,
  };
}

export function mapLabel(l: LabelResponse): Label {
  return {
    id: l.labelId,
    text: l.text,
    color: l.color,
    type: l.type.toLowerCase() as Label["type"],
  };
}

export function mapSubTask(st: SubTaskResponse): SubTask {
  return {
    id: st.subTaskId,
    parentId: "",
    title: st.title,
    description: st.description ?? undefined,
    status: (STATUS_TO_FE[st.status] ?? "todo") as TaskStatus,
    assignee: st.assignee ? mapUser(st.assignee) : undefined,
    deadline: st.deadline ?? undefined,
    children: (st.children ?? []).map(mapSubTask),
    order: st.order,
  };
}

export function mapComment(c: CommentResponse): Comment {
  return {
    id: c.commentId,
    text: c.content,
    author: mapUser(c.author),
    createdAt: c.createdAt,
    editedAt: c.updatedAt !== c.createdAt ? c.updatedAt : undefined,
  };
}

export function mapAttachment(a: AttachmentResponse): Attachment {
  return {
    id: a.attachmentId,
    name: a.fileName,
    url: a.fileUrl,
    type: a.fileType as "image" | "document" | "video" | "audio" | "other",
    size: a.fileSize,
    uploadedBy: mapUser(a.uploadedBy),
    uploadedAt: a.uploadedAt,
  };
}

export function mapActivityEntry(al: ActivityLogResponse): ActivityEntry {
  return {
    id: al.activityId,
    type: al.action as ActivityEntry["type"],
    user: mapUser(al.user),
    description: al.description,
    timestamp: al.timestamp,
    metadata: al.metadata ?? undefined,
  };
}

export function mapTask(t: TaskResponse): Task {
  return {
    id: t.taskId,
    boardId: t.board?.boardId ?? "",
    columnId: t.column?.columnId ?? "",
    title: t.title,
    description: t.description ?? "",
    status: (STATUS_TO_FE[t.status] ?? "todo") as TaskStatus,
    priority: (PRIORITY_TO_FE[t.priority] ?? "low") as TaskPriority,
    assignees: (t.assignees ?? []).map((a) => mapUser(a.user)),
    labels: (t.labels ?? []).map(mapLabel),
    startDate: t.startDate ?? undefined,
    deadline: t.dueDate ?? undefined,
    subtasks: (t.subtasks ?? []).map(mapSubTask),
    attachments: (t.attachments ?? []).map(mapAttachment),
    comments: (t.comments ?? []).map(mapComment),
    viewCount: 0,
    viewedBy: [],
    activityHistory: (t.activityLogs ?? []).map(mapActivityEntry),
    createdBy: mapUser(t.createdBy),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    order: t.order,
  };
}

export function mapWorkspace(ws: WorkspaceResponse): Workspace {
  const members = (ws.members ?? []).map(mapWorkspaceMember);
  const boards = (ws.boards ?? []).map((b) => mapBoard(b, ws.workspaceId));

  const stats: WorkspaceStats = {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    totalMembers: members.length,
  };

  return {
    id: ws.workspaceId,
    name: ws.workspaceName,
    description: ws.description ?? "",
    type: ws.type.toLowerCase() as WorkspaceType,
    avatar: ws.avatarUrl ?? undefined,
    color: ws.color,
    isPublic: ws.isPublic,
    createdAt: ws.createdAt,
    owner: mapUser(ws.owner),
    members,
    boards,
    stats,
  };
}

// ---- Goal & KeyResult mappers ----

export function mapKeyResult(kr: KeyResultResponse): KeyResult {
  return {
    id: kr.keyResultId,
    title: kr.title,
    target: kr.target,
    current: kr.current,
    unit: kr.unit,
    linkedTaskCount: kr.linkedTaskCount,
  };
}

export function mapGoal(g: GoalResponse): Goal {
  return {
    id: g.goalId,
    title: g.title,
    description: g.description ?? "",
    status: g.status as GoalStatus,
    progress: g.progress,
    startDate: g.startDate ?? "",
    endDate: g.endDate ?? "",
    owner: mapUser(g.owner),
    keyResults: (g.keyResults ?? []).map(mapKeyResult),
    createdAt: g.createdAt,
  };
}

// ---- Sprint mapper ----

export function mapSprint(s: SprintResponse): Sprint {
  return {
    id: s.sprintId,
    name: s.name,
    goal: s.goal ?? "",
    status: s.status as SprintStatus,
    startDate: s.startDate ?? "",
    endDate: s.endDate ?? "",
    createdAt: s.createdAt,
  };
}

// ---- Epic & Milestone mappers ----

export function mapEpic(e: EpicResponse): Epic {
  return {
    id: e.epicId,
    title: e.title,
    description: e.description ?? "",
    status: e.status as EpicStatus,
    color: e.color,
    progress: e.progress,
    startDate: e.startDate ?? "",
    endDate: e.endDate ?? "",
    owner: mapUser(e.owner),
    boardName: e.board?.boardName,
    createdAt: e.createdAt,
  };
}

export function mapMilestone(m: MilestoneResponse): Milestone {
  return {
    id: m.milestoneId,
    title: m.title,
    date: m.date,
    status: m.status as MilestoneStatus,
  };
}

// ---- Automation mapper ----

export function mapAutomationRule(r: AutomationRuleResponse): AutomationRule {
  return {
    id: r.ruleId,
    name: r.name,
    description: r.description ?? "",
    isEnabled: r.isEnabled,
    trigger: r.trigger,
    conditions: r.conditions,
    action: r.action,
    triggerCount: r.triggerCount,
    lastTriggered: r.lastTriggered,
    createdBy: mapUser(r.createdBy),
    createdAt: r.createdAt,
  };
}

// ---- Document mapper ----

export function mapDocument(d: DocumentResponse) {
  return {
    id: d.documentId,
    workspaceId: "",
    title: d.title,
    content: d.content,
    createdBy: mapUser(d.createdBy),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    lastEditedBy: mapUser(d.lastEditedBy),
    collaborators: [] as User[],
    versions: (d.versions ?? []).map((v: DocumentVersionResponse) => ({
      id: v.versionId,
      documentId: d.documentId,
      name: v.name ?? undefined,
      content: v.content,
      editedBy: mapUser(v.editedBy),
      createdAt: v.createdAt,
    })),
    comments: (d.comments ?? []).map((c: InlineCommentResponse) => ({
      id: c.inlineCommentId,
      documentId: d.documentId,
      selectedText: c.selectedText,
      text: c.text,
      author: mapUser(c.author),
      createdAt: c.createdAt,
      isResolved: c.isResolved,
      replies: (c.replies ?? []).map((r: InlineCommentResponse) => ({
        id: r.inlineCommentId,
        text: r.text,
        author: mapUser(r.author),
        createdAt: r.createdAt,
      })),
    })),
    isFavorite: d.isFavorite,
    viewCount: d.viewCount,
  };
}

// ---- WorkspaceFile mapper ----

export function mapWorkspaceFile(f: WorkspaceFileResponse): FileItem {
  return {
    id: f.fileId,
    workspaceId: "",
    name: f.name,
    type: f.type as "file" | "folder",
    mimeType: f.mimeType ?? undefined,
    size: f.size ?? undefined,
    url: mapBackendAssetUrl(f.url),
    parentId: f.parent?.fileId ?? null,
    uploadedBy: f.uploadedBy ? mapUser(f.uploadedBy) : undefined,
    uploadedAt: f.uploadedAt,
    accessLevel: (f.accessLevel ?? "workspace") as FileAccessLevel,
  };
}
