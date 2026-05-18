// --- User ---
export interface UserResponse {
  userId: string;
  fullName: string;
  email: string | null;
  phoneNumber: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

// --- Workspace ---
export interface WorkspaceResponse {
  workspaceId: string;
  workspaceName: string;
  description: string | null;
  type: string; // 'BUSINESS' | 'EDUCATION' | 'COMMUNITY' | 'PERSONAL'
  avatarUrl: string | null;
  color: string;
  isPublic: boolean;
  memberLimit: number;
  createdAt: string;
  updatedAt: string;
  owner: UserResponse;
  members: WorkspaceMemberResponse[];
  boards: TaskBoardResponse[];
}

// --- WorkspaceMember ---
export interface WorkspaceMemberResponse {
  id: string;
  role: string; // 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'
  joinedAt: string;
  user: UserResponse;
}

// --- TaskBoard ---
export interface TaskBoardResponse {
  boardId: string;
  boardName: string;
  description: string | null;
  backgroundColor: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  columns?: BoardColumnResponse[];
}

// --- BoardColumn ---
export interface BoardColumnResponse {
  columnId: string;
  name: string;
  status: string; // 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  color: string;
  order: number;
  taskLimit: number | null;
}

// --- Task ---
export interface TaskResponse {
  taskId: string;
  title: string;
  description: string | null;
  priority: string; // 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: string; // 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  order: number;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  board: { boardId: string };
  column: BoardColumnResponse | null;
  createdBy: UserResponse;
  assignees: TaskAssigneeResponse[];
  labels: LabelResponse[];
  subtasks?: SubTaskResponse[];
  comments?: CommentResponse[];
  attachments?: AttachmentResponse[];
  activityLogs?: ActivityLogResponse[];
}

// --- TaskAssignee ---
export interface TaskAssigneeResponse {
  id: string;
  assignedAt: string;
  user: UserResponse;
}

// --- Label ---
export interface LabelResponse {
  labelId: string;
  text: string;
  color: string;
  type: string; // 'FEATURE' | 'BUG' | 'DESIGN' | 'URGENT' | 'IMPROVEMENT'
}

// --- Workspace ---
export interface CreateWorkspaceRequest {
  workspaceName: string;
  description?: string;
  type: string;
  avatarUrl?: string;
  color?: string;
  isPublic?: boolean;
  memberLimit?: number;
  ownerId: string;
}

export interface UpdateWorkspaceRequest {
  workspaceName?: string;
  description?: string;
  type?: string;
  avatarUrl?: string;
  color?: string;
  isPublic?: boolean;
  memberLimit?: number;
}

// --- Member ---
export interface AddMemberRequest {
  userId: string;
  role: string;
}

export interface InviteMemberByMethodRequest {
  method: "userId" | "phone" | "name";
  value: string;
  role?: string;
}

export interface InviteCandidateResponse extends UserResponse {}

export interface WorkspaceInviteLinkResponse {
  workspaceId: string;
  workspaceName: string;
  role: string;
  token: string;
  inviteUrl: string;
  qrData: string;
  expiresAt: string;
}

export interface JoinByLinkRequest {
  token: string;
}

export interface UpdateMemberRoleRequest {
  role: string;
}

// --- Board ---
export interface CreateBoardRequest {
  boardName: string;
  description?: string;
  backgroundColor?: string;
  icon?: string;
}

export interface UpdateBoardRequest {
  boardName?: string;
  description?: string;
  backgroundColor?: string;
  icon?: string;
}

// --- Task ---
export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  columnId?: string;
  createdById?: string;
  assigneeIds?: string[];
  labelIds?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  startDate?: string;
  dueDate?: string;
  columnId?: string;
  assigneeIds?: string[];
  labelIds?: string[];
}

export interface MoveTaskRequest {
  columnId: string;
  status: string;
  order?: number;
}

// --- Label ---
export interface CreateLabelRequest {
  text: string;
  color: string;
  type: string;
  workspaceId: string;
}

export interface UpdateLabelRequest {
  text?: string;
  color?: string;
  type?: string;
}

// --- Column ---
export interface CreateColumnRequest {
  name: string;
  status: string;
  color?: string;
  taskLimit?: number;
}

export interface UpdateColumnRequest {
  name?: string;
  color?: string;
  taskLimit?: number;
}

// --- SubTask ---
export interface SubTaskResponse {
  subTaskId: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  deadline: string | null;
  assignee: UserResponse | null;
  children: SubTaskResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubTaskRequest {
  title: string;
  description?: string;
  status?: string;
  parentSubTaskId?: string;
  assigneeId?: string;
  deadline?: string;
}

export interface UpdateSubTaskRequest {
  title?: string;
  description?: string;
  status?: string;
  assigneeId?: string;
  deadline?: string;
}

// --- Comment ---
export interface CommentResponse {
  commentId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: UserResponse;
}

export interface CreateCommentRequest {
  content: string;
  authorId: string;
}

// --- Attachment ---
export interface AttachmentResponse {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: UserResponse;
}

export interface CreateAttachmentRequest {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedById: string;
}

// --- Activity Log ---
export interface ActivityLogResponse {
  activityId: string;
  action: string;
  description: string;
  metadata: Record<string, unknown> | null;
  timestamp: string;
  user: UserResponse;
  task?: { taskId: string; title: string };
}

export interface CreateActivityLogRequest {
  action: string;
  description: string;
  userId: string;
  metadata?: Record<string, unknown>;
}

// --- Goal --- (ENTITY MỚI)
export interface GoalResponse {
  goalId: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  owner: UserResponse;
  keyResults: KeyResultResponse[];
}

export interface KeyResultResponse {
  keyResultId: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  linkedTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  status?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  ownerId: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  status?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
}

export interface CreateKeyResultRequest {
  title: string;
  target: number;
  current?: number;
  unit?: string;
}

export interface UpdateKeyResultRequest {
  title?: string;
  target?: number;
  current?: number;
  unit?: string;
}

// --- Sprint --- (ENTITY MỚI)
export interface SprintResponse {
  sprintId: string;
  name: string;
  goal: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSprintRequest {
  name: string;
  goal?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateSprintRequest {
  name?: string;
  goal?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

// --- Epic --- (ENTITY MỚI)
export interface EpicResponse {
  epicId: string;
  title: string;
  description: string | null;
  status: string;
  color: string;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  owner: UserResponse;
  board: { boardId: string; boardName: string } | null;
}

export interface CreateEpicRequest {
  title: string;
  description?: string;
  status?: string;
  color?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  ownerId: string;
  boardId?: string;
}

export interface UpdateEpicRequest {
  title?: string;
  description?: string;
  status?: string;
  color?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
}

// --- Milestone --- (ENTITY MỚI)
export interface MilestoneResponse {
  milestoneId: string;
  title: string;
  date: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestoneRequest {
  title: string;
  date: string;
  status?: string;
}

export interface UpdateMilestoneRequest {
  title?: string;
  date?: string;
  status?: string;
}

// --- Automation --- (ENTITY MỚI)
export interface AutomationRuleResponse {
  ruleId: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  trigger: Record<string, unknown>;
  conditions: Record<string, unknown> | null;
  action: Record<string, unknown>;
  triggerCount: number;
  lastTriggered: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: UserResponse;
}

export interface CreateAutomationRequest {
  name: string;
  description?: string;
  trigger: Record<string, unknown>;
  conditions?: Record<string, unknown>;
  action: Record<string, unknown>;
}

export interface UpdateAutomationRequest {
  name?: string;
  description?: string;
  isEnabled?: boolean;
  trigger?: Record<string, unknown>;
  conditions?: Record<string, unknown>;
  action?: Record<string, unknown>;
}

// --- Document --- (ENTITY MỚI)
export interface DocumentResponse {
  documentId: string;
  title: string;
  content: string;
  isFavorite: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: UserResponse;
  lastEditedBy: UserResponse;
  versions?: DocumentVersionResponse[];
  comments?: InlineCommentResponse[];
}

export interface DocumentVersionResponse {
  versionId: string;
  name: string | null;
  content: string;
  createdAt: string;
  editedBy: UserResponse;
}

export interface InlineCommentResponse {
  inlineCommentId: string;
  selectedText: string;
  text: string;
  isResolved: boolean;
  createdAt: string;
  author: UserResponse;
  parentComment: InlineCommentResponse | null;
  replies?: InlineCommentResponse[];
}

export interface CreateDocumentRequest {
  title: string;
  content?: string;
  createdById: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  isFavorite?: boolean;
  lastEditedById?: string;
}

export interface CreateDocumentVersionRequest {
  name?: string;
  content: string;
  editedById: string;
}

export interface CreateInlineCommentRequest {
  selectedText: string;
  text: string;
  authorId: string;
  parentCommentId?: string;
}

// --- WorkspaceFile --- (ENTITY MỚI)
export interface WorkspaceFileResponse {
  fileId: string;
  name: string;
  type: string;
  mimeType: string | null;
  size: number | null;
  url: string | null;
  s3Key?: string | null;
  currentVersion?: number;
  accessLevel: string;
  uploadedAt: string;
  createdAt: string;
  uploadedBy: UserResponse | null;
  parent: { fileId: string } | null;
}

export interface OnlyOfficeConfigResponse {
  documentServerUrl: string;
  config: {
    document: {
      fileType: "doc" | "docx" | "xlsx";
      key: string;
      title: string;
      url: string;
      permissions: {
        edit: boolean;
        download: boolean;
        print: boolean;
      };
    };
    documentType: "word" | "cell";
    editorConfig: {
      callbackUrl: string;
      lang: string;
      mode: "edit" | "view";
      user: {
        id: string;
        name: string;
      };
    };
    height: string;
    width: string;
  };
}

export interface CreateWorkspaceFileRequest {
  name: string;
  type?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  fileFormat?: "doc" | "docx" | "xlsx";
  accessLevel?: string;
  parentId?: string;
}

export interface UpdateWorkspaceFileRequest {
  name?: string;
  accessLevel?: string;
}

// --- Workload aggregate ---
export interface WorkloadMemberResponse {
  user: UserResponse;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  doneTasks: number;
  overdueTasks: number;
  lowPriority: number;
  mediumPriority: number;
  highPriority: number;
  urgentPriority: number;
}

// --- Reports aggregate ---
export interface ReportDataResponse {
  period: {
    totalTasks: number;
    completedTasks: number;
    newTasks: number;
    completionRate: number;
  };
  boards: {
    boardId: string;
    boardName: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
  }[];
  members: {
    user: UserResponse;
    totalTasks: number;
    completedTasks: number;
    avgCompletionDays: number;
  }[];
  overdue: {
    taskId: string;
    title: string;
    dueDate: string;
    assignees: UserResponse[];
    daysOverdue: number;
  }[];
}

export interface WorkspaceDashboardStatsResponse {
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    reviewTasks: number;
    todoTasks: number;
    overdueTasks: number;
    completionRate: number;
    totalBoards: number;
    totalMembers: number;
  };
  boardStats: Array<{
    boardId: string;
    boardName: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
  }>;
  recentActivities: Array<{
    activityId: string;
    action: string;
    description: string;
    timestamp: string;
    task?: { taskId?: string; title?: string };
    user: UserResponse;
  }>;
  trendLast7Days: Array<{
    date: string;
    completed: number;
  }>;
}
