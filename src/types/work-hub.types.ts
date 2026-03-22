// ---- Enums / Unions ----
export type WorkspaceType = "business" | "education" | "community" | "personal";
export type WorkspaceRole = "owner" | "admin" | "member";
export type TaskStatus = "todo" | "inprogress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type ViewMode = "board" | "list" | "calendar";
export type SortDirection = "asc" | "desc";

// ---- Core Entities ----
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  status: "online" | "offline" | "away";
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  type: WorkspaceType;
  avatar?: string;
  color: string;
  isPublic: boolean;
  createdAt: string;
  owner: User;
  members: WorkspaceMember[];
  boards: Board[];
  stats: WorkspaceStats;
}

export interface WorkspaceStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalMembers: number;
}

export interface WorkspaceMember {
  user: User;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  columns: BoardColumn[];
  createdAt: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  status: TaskStatus;
  color: string;
  order: number;
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: User[];
  labels: Label[];
  startDate?: string;
  deadline?: string;
  subtasks: SubTask[];
  attachments: Attachment[];
  comments: Comment[];
  viewCount: number;
  viewedBy: ViewRecord[];
  activityHistory: ActivityEntry[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface SubTask {
  id: string;
  parentId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee?: User;
  deadline?: string;
  children: SubTask[];
  order: number;
}

export interface Label {
  id: string;
  text: string;
  color: string;
  type: "feature" | "bug" | "design" | "urgent" | "improvement";
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: User;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  text: string;
  author: User;
  createdAt: string;
  editedAt?: string;
}

export interface ViewRecord {
  userId: string;
  userName: string;
  viewedAt: string;
}

export interface ActivityEntry {
  id: string;
  type:
    | "created"
    | "updated"
    | "status_changed"
    | "assigned"
    | "transferred"
    | "commented"
    | "attachment"
    | "completed";
  user: User;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ---- Transfer ----
export interface TaskTransfer {
  taskId: string;
  fromUser: User;
  toUser: User;
  reason: string;
  timestamp: string;
}

// ---- AI Insights ----
export interface InsightsSummary {
  progressPercentage: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  unclaimedTasks: number;
  burndownData: BurndownPoint[];
  velocityData: VelocityPoint[];
  riskAlerts: RiskAlert[];
  memberPerformance: MemberPerformance[];
  aiSuggestions: AISuggestion[];
  dailyDigest: DailyDigestItem[];
}

export interface BurndownPoint {
  date: string;
  ideal: number;
  actual: number;
}

export interface VelocityPoint {
  sprint: string;
  completed: number;
  planned: number;
}

export interface RiskAlert {
  id: string;
  type: "deadline" | "stale" | "overloaded" | "low_completion";
  severity: "warning" | "critical";
  message: string;
  taskId?: string;
  userId?: string;
}

export interface MemberPerformance {
  user: User;
  tasksCompleted: number;
  tasksInProgress: number;
  avgCompletionDays: number;
  onTimeRate: number;
}

export interface AISuggestion {
  id: string;
  type: "reassign" | "deadline" | "priority" | "split";
  title: string;
  description: string;
  actionLabel: string;
}

export interface DailyDigestItem {
  id: string;
  type: "completed" | "created" | "overdue" | "assigned";
  message: string;
  timestamp: string;
}

// ---- View / UI types ----
export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface GroupByConfig {
  field: "status" | "assignee" | "priority" | "label" | "none";
}

// ---- Task form ----
export interface TaskFormData {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[];
  labelIds: string[];
  startDate: string;
  deadline: string;
}

// ---- Goal & OKR ----
export type GoalStatus = "on_track" | "at_risk" | "behind" | "completed";

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  progress: number;
  startDate: string;
  endDate: string;
  owner: User;
  keyResults: KeyResult[];
  createdAt: string;
}

export interface KeyResult {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  linkedTaskCount: number;
}

// ---- Sprint ----
export type SprintStatus = "planning" | "active" | "completed" | "cancelled";

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
}

// ---- Epic & Roadmap ----
export type EpicStatus = "planned" | "in_progress" | "completed" | "blocked";
export type MilestoneStatus = "reached" | "upcoming" | "missed";

export interface Epic {
  id: string;
  title: string;
  description: string;
  status: EpicStatus;
  color: string;
  progress: number;
  startDate: string;
  endDate: string;
  owner: User;
  boardName?: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  status: MilestoneStatus;
}

// ---- Automation ----
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  trigger: Record<string, unknown>;
  conditions: Record<string, unknown> | null;
  action: Record<string, unknown>;
  triggerCount: number;
  lastTriggered: string | null;
  createdBy: User;
  createdAt: string;
}

// ---- Document Collaboration ----
export type DocumentViewMode = "edit" | "preview" | "presentation";

export interface Document {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  lastEditedBy: User;
  collaborators: User[];
  versions: DocumentVersion[];
  comments: InlineComment[];
  isFavorite: boolean;
  viewCount: number;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  name?: string;
  content: string;
  editedBy: User;
  createdAt: string;
}

export interface InlineComment {
  id: string;
  documentId: string;
  selectedText: string;
  text: string;
  author: User;
  createdAt: string;
  isResolved: boolean;
  replies: InlineCommentReply[];
}

export interface InlineCommentReply {
  id: string;
  text: string;
  author: User;
  createdAt: string;
}

// ---- File Storage ----
export type FileItemType = "file" | "folder";
export type FileAccessLevel = "workspace" | "admin_only" | "specific_users";

export interface FileItem {
  id: string;
  workspaceId: string;
  name: string;
  type: FileItemType;
  mimeType?: string;
  size?: number;
  url?: string;
  parentId: string | null;
  children?: FileItem[];
  uploadedBy?: User;
  uploadedAt: string;
  accessLevel: FileAccessLevel;
}

export interface StorageStats {
  usedBytes: number;
  limitBytes: number;
}

// ---- Channel Chat ----
export type ChannelType = "public" | "private";

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  type: ChannelType;
  createdBy: User;
  createdAt: string;
  members: User[];
  pinnedMessages: ChannelMessage[];
  unreadCount: number;
  lastMessage?: ChannelMessage;
  isDefault: boolean;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  text: string;
  author: User;
  createdAt: string;
  editedAt?: string;
  isPinned: boolean;
  attachments: Attachment[];
  reactions: MessageReaction[];
  threadReplies: ChannelMessage[];
  threadReplyCount: number;
  mentions: string[];
}

export interface MessageReaction {
  emoji: string;
  users: User[];
}

// ---- Direct Message ----
export interface DirectMessageThread {
  id: string;
  workspaceId: string;
  participants: User[];
  lastMessage?: DirectMessage;
  unreadCount: number;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  threadId: string;
  text: string;
  author: User;
  createdAt: string;
  attachments: Attachment[];
  isRead: boolean;
}
