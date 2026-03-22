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
  createdById: string;
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
}

export interface CreateActivityLogRequest {
  action: string;
  description: string;
  userId: string;
  metadata?: Record<string, unknown>;
}
