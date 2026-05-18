import { api } from "../../services/api";
import type {
  WorkspaceResponse,
  WorkspaceMemberResponse,
  TaskBoardResponse,
  BoardColumnResponse,
  TaskResponse,
  LabelResponse,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  AddMemberRequest,
  InviteMemberByMethodRequest,
  InviteCandidateResponse,
  WorkspaceInviteLinkResponse,
  JoinByLinkRequest,
  UpdateMemberRoleRequest,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateColumnRequest,
  UpdateColumnRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  CreateLabelRequest,
  UpdateLabelRequest,
  SubTaskResponse,
  CreateSubTaskRequest,
  UpdateSubTaskRequest,
  CommentResponse,
  CreateCommentRequest,
  AttachmentResponse,
  CreateAttachmentRequest,
  ActivityLogResponse,
  CreateActivityLogRequest,
  GoalResponse,
  CreateGoalRequest,
  UpdateGoalRequest,
  KeyResultResponse,
  CreateKeyResultRequest,
  UpdateKeyResultRequest,
  SprintResponse,
  CreateSprintRequest,
  UpdateSprintRequest,
  EpicResponse,
  CreateEpicRequest,
  UpdateEpicRequest,
  MilestoneResponse,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  AutomationRuleResponse,
  CreateAutomationRequest,
  UpdateAutomationRequest,
  DocumentResponse,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  CreateDocumentVersionRequest,
  CreateInlineCommentRequest,
  WorkspaceFileResponse,
  CreateWorkspaceFileRequest,
  UpdateWorkspaceFileRequest,
  WorkloadMemberResponse,
  ReportDataResponse,
  WorkspaceDashboardStatsResponse,
} from "./work-hub.api.types";
import type { InsightsSummary } from "../../types/work-hub.types";

export const workHubApi = {
  /**
   * GET /workspaces?userId=xxx
   * Lấy tất cả workspace mà user tham gia
   */
  getWorkspaces: (userId: string) =>
    api.get<WorkspaceResponse[]>(`/workspaces?userId=${userId}`),

  /**
   * GET /workspaces/:id
   * Lấy chi tiết workspace (kèm members, boards, columns)
   */
  getWorkspace: (id: string) => api.get<WorkspaceResponse>(`/workspaces/${id}`),

  /**
   * POST /workspaces
   * Tạo workspace mới - tự động thêm owner vào members
   */
  createWorkspace: (data: CreateWorkspaceRequest) =>
    api.post<WorkspaceResponse>("/workspaces", data),

  /**
   * PATCH /workspaces/:id
   * Cập nhật workspace (partial update)
   */
  updateWorkspace: (id: string, data: UpdateWorkspaceRequest) =>
    api.patch<WorkspaceResponse>(`/workspaces/${id}`, data),

  /**
   * DELETE /workspaces/:id
   * Xóa workspace (cascade xóa members, boards)
   */
  deleteWorkspace: (id: string) => api.delete(`/workspaces/${id}`),

  /**
   * GET /workspaces/:id/dashboard-stats
   * Lấy thống kê dashboard từ database
   */
  getDashboardStats: (id: string) =>
    api.get<WorkspaceDashboardStatsResponse>(`/workspaces/${id}/dashboard-stats`),

  /**
   * GET /workspaces/:id/insights
   * Lấy AI insights tổng hợp cho workspace
   */
  getInsights: (id: string) =>
    api.get<InsightsSummary>(`/workspaces/${id}/insights`),

  /**
   * GET /workspaces/:workspaceId/members
   * Lấy danh sách thành viên workspace
   */
  getMembers: (workspaceId: string) =>
    api.get<WorkspaceMemberResponse[]>(`/workspaces/${workspaceId}/members`),

  /**
   * POST /workspaces/:workspaceId/members
   * Thêm thành viên vào workspace
   */
  addMember: (workspaceId: string, data: AddMemberRequest) =>
    api.post<WorkspaceMemberResponse>(
      `/workspaces/${workspaceId}/members`,
      data,
    ),

  /**
   * POST /workspaces/:workspaceId/members/invite
   * Mời thành viên theo userId/phone/name
   */
  inviteMemberByMethod: (
    workspaceId: string,
    data: InviteMemberByMethodRequest,
  ) =>
    api.post<WorkspaceMemberResponse>(
      `/workspaces/${workspaceId}/members/invite`,
      data,
    ),

  /**
   * GET /workspaces/:workspaceId/members/search?q=...
   * Tìm user theo tên/sđt để mời vào workspace
   */
  searchMemberCandidates: (workspaceId: string, query: string) =>
    api.get<InviteCandidateResponse[]>(
      `/workspaces/${workspaceId}/members/search?q=${encodeURIComponent(query)}`,
    ),

  /**
   * GET /workspaces/:workspaceId/members/invite-link
   * Tạo invite link + dữ liệu QR
   */
  getInviteLink: (workspaceId: string, role?: string) =>
    api.get<WorkspaceInviteLinkResponse>(
      `/workspaces/${workspaceId}/members/invite-link${
        role ? `?role=${encodeURIComponent(role)}` : ""
      }`,
    ),

  /**
   * POST /workspaces/:workspaceId/members/join-by-link
   * Tham gia workspace thông qua token từ invite link
   */
  joinByInviteLink: (workspaceId: string, data: JoinByLinkRequest) =>
    api.post<WorkspaceMemberResponse>(
      `/workspaces/${workspaceId}/members/join-by-link`,
      data,
    ),

  /**
   * PATCH /workspaces/:workspaceId/members/:userId
   * Đổi role thành viên
   */
  updateMemberRole: (
    workspaceId: string,
    userId: string,
    data: UpdateMemberRoleRequest,
  ) =>
    api.patch<WorkspaceMemberResponse>(
      `/workspaces/${workspaceId}/members/${userId}`,
      data,
    ),

  /**
   * DELETE /workspaces/:workspaceId/members/:userId
   * Xóa thành viên khỏi workspace
   */
  removeMember: (workspaceId: string, userId: string) =>
    api.delete(`/workspaces/${workspaceId}/members/${userId}`),

  /**
   * GET /workspaces/:workspaceId/boards
   * Lấy tất cả boards trong workspace
   */
  getBoards: (workspaceId: string) =>
    api.get<TaskBoardResponse[]>(`/workspaces/${workspaceId}/boards`),

  /**
   * GET /workspaces/:workspaceId/boards/:boardId
   * Chi tiết board (kèm columns, tasks)
   */
  getBoard: (workspaceId: string, boardId: string) =>
    api.get<TaskBoardResponse>(`/workspaces/${workspaceId}/boards/${boardId}`),

  /**
   * POST /workspaces/:workspaceId/boards
   * Tạo board mới - tự động tạo 4 columns mặc định (To Do, In Progress, Review, Done)
   */
  createBoard: (workspaceId: string, data: CreateBoardRequest) =>
    api.post<TaskBoardResponse>(`/workspaces/${workspaceId}/boards`, data),

  /**
   * PATCH /workspaces/:workspaceId/boards/:boardId
   * Cập nhật board
   */
  updateBoard: (
    workspaceId: string,
    boardId: string,
    data: UpdateBoardRequest,
  ) =>
    api.patch<TaskBoardResponse>(
      `/workspaces/${workspaceId}/boards/${boardId}`,
      data,
    ),

  /**
   * DELETE /workspaces/:workspaceId/boards/:boardId
   * Xóa board (cascade xóa columns, tasks)
   */
  deleteBoard: (workspaceId: string, boardId: string) =>
    api.delete(`/workspaces/${workspaceId}/boards/${boardId}`),

  /**
   * GET /boards/:boardId/tasks
   * Lấy tất cả tasks trong board (sắp xếp theo order)
   */
  getTasksByBoard: (boardId: string) =>
    api.get<TaskResponse[]>(`/boards/${boardId}/tasks`),

  /**
   * GET /tasks/:id
   * Chi tiết task (kèm column, assignees, labels, createdBy)
   */
  getTask: (taskId: string) => api.get<TaskResponse>(`/tasks/${taskId}`),

  /**
   * POST /boards/:boardId/tasks
   * Tạo task mới trong board
   */
  createTask: (boardId: string, data: CreateTaskRequest) =>
    api.post<TaskResponse>(`/boards/${boardId}/tasks`, data),

  /**
   * PATCH /tasks/:id
   * Cập nhật task (partial update)
   */
  updateTask: (taskId: string, data: UpdateTaskRequest) =>
    api.patch<TaskResponse>(`/tasks/${taskId}`, data),

  /**
   * PATCH /tasks/:id/move
   * Di chuyển task sang column khác (kéo thả Kanban)
   */
  moveTask: (taskId: string, data: MoveTaskRequest) =>
    api.patch<TaskResponse>(`/tasks/${taskId}/move`, data),

  /**
   * DELETE /tasks/:id
   * Xóa task
   */
  deleteTask: (taskId: string) => api.delete(`/tasks/${taskId}`),

  /**
   * GET /workspaces/:workspaceId/labels
   * Lấy tất cả labels trong workspace
   */
  getLabels: (workspaceId: string) =>
    api.get<LabelResponse[]>(`/workspaces/${workspaceId}/labels`),

  /**
   * POST /workspaces/:workspaceId/labels
   * Tạo label mới
   */
  createLabel: (workspaceId: string, data: CreateLabelRequest) =>
    api.post<LabelResponse>(`/workspaces/${workspaceId}/labels`, data),

  /**
   * PATCH /workspaces/:workspaceId/labels/:id
   * Cập nhật label
   */
  updateLabel: (workspaceId: string, id: string, data: UpdateLabelRequest) =>
    api.patch<LabelResponse>(`/workspaces/${workspaceId}/labels/${id}`, data),

  /**
   * DELETE /workspaces/:workspaceId/labels/:id
   * Xóa label
   */
  deleteLabel: (workspaceId: string, id: string) =>
    api.delete(`/workspaces/${workspaceId}/labels/${id}`),

  /**
   * POST /boards/:boardId/columns
   * Tạo column mới
   */
  createColumn: (boardId: string, data: CreateColumnRequest) =>
    api.post<BoardColumnResponse>(`/boards/${boardId}/columns`, data),

  /**
   * PATCH /boards/:boardId/columns/:columnId
   * Cập nhật column
   */
  updateColumn: (
    boardId: string,
    columnId: string,
    data: UpdateColumnRequest,
  ) =>
    api.patch<BoardColumnResponse>(
      `/boards/${boardId}/columns/${columnId}`,
      data,
    ),

  /**
   * DELETE /boards/:boardId/columns/:columnId
   * Xóa column
   */
  deleteColumn: (boardId: string, columnId: string) =>
    api.delete(`/boards/${boardId}/columns/${columnId}`),

  /**
   * PATCH /boards/:boardId/columns/reorder
   * Sắp xếp lại thứ tự columns
   */
  reorderColumns: (boardId: string, columnIds: string[]) =>
    api.patch(`/boards/${boardId}/columns/reorder`, { columnIds }),

  // ---- SubTask CRUD ----

  /**
   * GET /tasks/:taskId/subtasks
   * Lấy tất cả subtasks của task
   */
  getSubTasks: (taskId: string) =>
    api.get<SubTaskResponse[]>(`/tasks/${taskId}/subtasks`),

  /**
   * POST /tasks/:taskId/subtasks
   * Tạo subtask mới
   */
  createSubTask: (taskId: string, data: CreateSubTaskRequest) =>
    api.post<SubTaskResponse>(`/tasks/${taskId}/subtasks`, data),

  /**
   * PATCH /subtasks/:subTaskId
   * Cập nhật subtask
   */
  updateSubTask: (subTaskId: string, data: UpdateSubTaskRequest) =>
    api.patch<SubTaskResponse>(`/subtasks/${subTaskId}`, data),

  /**
   * DELETE /subtasks/:subTaskId
   * Xóa subtask
   */
  deleteSubTask: (subTaskId: string) => api.delete(`/subtasks/${subTaskId}`),

  // ---- Comment CRUD ----

  /**
   * GET /tasks/:taskId/comments
   * Lấy tất cả comments của task
   */
  getComments: (taskId: string) =>
    api.get<CommentResponse[]>(`/tasks/${taskId}/comments`),

  /**
   * POST /tasks/:taskId/comments
   * Tạo comment mới
   */
  createComment: (taskId: string, data: CreateCommentRequest) =>
    api.post<CommentResponse>(`/tasks/${taskId}/comments`, data),

  /**
   * PATCH /comments/:commentId
   * Cập nhật comment
   */
  updateComment: (commentId: string, data: { content: string }) =>
    api.patch<CommentResponse>(`/comments/${commentId}`, data),

  /**
   * DELETE /comments/:commentId
   * Xóa comment
   */
  deleteComment: (commentId: string) => api.delete(`/comments/${commentId}`),

  // ---- Attachment CRUD ----

  /**
   * GET /tasks/:taskId/attachments
   * Lấy tất cả attachments của task
   */
  getAttachments: (taskId: string) =>
    api.get<AttachmentResponse[]>(`/tasks/${taskId}/attachments`),

  /**
   * POST /tasks/:taskId/attachments
   * Tạo attachment mới
   */
  createAttachment: (taskId: string, data: CreateAttachmentRequest) =>
    api.post<AttachmentResponse>(`/tasks/${taskId}/attachments`, data),

  /**
   * DELETE /attachments/:attachmentId
   * Xóa attachment
   */
  deleteAttachment: (attachmentId: string) =>
    api.delete(`/attachments/${attachmentId}`),

  // ---- Activity Log ----

  /**
   * GET /tasks/:taskId/activities
   * Lấy tất cả activity logs của task
   */
  getActivities: (taskId: string) =>
    api.get<ActivityLogResponse[]>(`/tasks/${taskId}/activities`),

  /**
   * POST /tasks/:taskId/activities
   * Tạo activity log mới
   */
  createActivity: (taskId: string, data: CreateActivityLogRequest) =>
    api.post<ActivityLogResponse>(`/tasks/${taskId}/activities`, data),

  /** GET /workspaces/:workspaceId/activities - Activity feed workspace-level */
  getWorkspaceActivities: (workspaceId: string) =>
    api.get<ActivityLogResponse[]>(`/workspaces/${workspaceId}/activities`),

  // ---- Goal CRUD ----

  getGoals: (workspaceId: string) =>
    api.get<GoalResponse[]>(`/workspaces/${workspaceId}/goals`),

  createGoal: (workspaceId: string, data: CreateGoalRequest) =>
    api.post<GoalResponse>(`/workspaces/${workspaceId}/goals`, data),

  updateGoal: (id: string, data: UpdateGoalRequest) =>
    api.patch<GoalResponse>(`/goals/${id}`, data),

  deleteGoal: (id: string) => api.delete(`/goals/${id}`),

  createKeyResult: (goalId: string, data: CreateKeyResultRequest) =>
    api.post<KeyResultResponse>(`/goals/${goalId}/key-results`, data),

  updateKeyResult: (krId: string, data: UpdateKeyResultRequest) =>
    api.patch<KeyResultResponse>(`/key-results/${krId}`, data),

  deleteKeyResult: (krId: string) => api.delete(`/key-results/${krId}`),

  // ---- Sprint CRUD ----

  getSprints: (workspaceId: string) =>
    api.get<SprintResponse[]>(`/workspaces/${workspaceId}/sprints`),

  createSprint: (workspaceId: string, data: CreateSprintRequest) =>
    api.post<SprintResponse>(`/workspaces/${workspaceId}/sprints`, data),

  updateSprint: (id: string, data: UpdateSprintRequest) =>
    api.patch<SprintResponse>(`/sprints/${id}`, data),

  deleteSprint: (id: string) => api.delete(`/sprints/${id}`),

  getSprintTasks: (sprintId: string) =>
    api.get<TaskResponse[]>(`/sprints/${sprintId}/tasks`),

  // ---- Epic CRUD ----

  getEpics: (workspaceId: string) =>
    api.get<EpicResponse[]>(`/workspaces/${workspaceId}/epics`),

  createEpic: (workspaceId: string, data: CreateEpicRequest) =>
    api.post<EpicResponse>(`/workspaces/${workspaceId}/epics`, data),

  updateEpic: (id: string, data: UpdateEpicRequest) =>
    api.patch<EpicResponse>(`/epics/${id}`, data),

  deleteEpic: (id: string) => api.delete(`/epics/${id}`),

  // ---- Milestone CRUD ----

  getMilestones: (workspaceId: string) =>
    api.get<MilestoneResponse[]>(`/workspaces/${workspaceId}/milestones`),

  createMilestone: (workspaceId: string, data: CreateMilestoneRequest) =>
    api.post<MilestoneResponse>(`/workspaces/${workspaceId}/milestones`, data),

  updateMilestone: (id: string, data: UpdateMilestoneRequest) =>
    api.patch<MilestoneResponse>(`/milestones/${id}`, data),

  deleteMilestone: (id: string) => api.delete(`/milestones/${id}`),

  // ---- Automation CRUD ----

  getAutomations: (workspaceId: string) =>
    api.get<AutomationRuleResponse[]>(`/workspaces/${workspaceId}/automations`),

  createAutomation: (workspaceId: string, data: CreateAutomationRequest) =>
    api.post<AutomationRuleResponse>(
      `/workspaces/${workspaceId}/automations`,
      data,
    ),

  updateAutomation: (id: string, data: UpdateAutomationRequest) =>
    api.patch<AutomationRuleResponse>(`/automations/${id}`, data),

  toggleAutomation: (id: string) =>
    api.patch<AutomationRuleResponse>(`/automations/${id}/toggle`, {}),

  deleteAutomation: (id: string) => api.delete(`/automations/${id}`),

  // ---- Document CRUD ----

  getDocuments: (workspaceId: string) =>
    api.get<DocumentResponse[]>(`/workspaces/${workspaceId}/documents`),

  getDocument: (id: string) => api.get<DocumentResponse>(`/documents/${id}`),

  createDocument: (workspaceId: string, data: CreateDocumentRequest) =>
    api.post<DocumentResponse>(`/workspaces/${workspaceId}/documents`, data),

  updateDocument: (id: string, data: UpdateDocumentRequest) =>
    api.patch<DocumentResponse>(`/documents/${id}`, data),

  deleteDocument: (id: string) => api.delete(`/documents/${id}`),

  createDocumentVersion: (docId: string, data: CreateDocumentVersionRequest) =>
    api.post(`/documents/${docId}/versions`, data),

  createInlineComment: (docId: string, data: CreateInlineCommentRequest) =>
    api.post(`/documents/${docId}/comments`, data),

  resolveInlineComment: (commentId: string) =>
    api.patch(`/inline-comments/${commentId}/resolve`, {}),

  // ---- WorkspaceFile CRUD ----

  getWorkspaceFiles: (workspaceId: string, parentId?: string) =>
    api.get<WorkspaceFileResponse[]>(
      `/workspaces/${workspaceId}/files${parentId ? `?parentId=${parentId}` : ""}`,
    ),

  createWorkspaceFile: (
    workspaceId: string,
    data: CreateWorkspaceFileRequest,
  ) =>
    api.post<WorkspaceFileResponse>(`/workspaces/${workspaceId}/files`, data),

  createWorkspaceFolder: (
    workspaceId: string,
    data: CreateWorkspaceFileRequest,
  ) =>
    api.post<WorkspaceFileResponse>(`/workspaces/${workspaceId}/folders`, data),

  updateWorkspaceFile: (id: string, data: UpdateWorkspaceFileRequest) =>
    api.patch<WorkspaceFileResponse>(`/workspace-files/${id}`, data),

  deleteWorkspaceFile: (id: string) => api.delete(`/workspace-files/${id}`),

  // ---- Workload Aggregate ----

  getWorkload: (workspaceId: string) =>
    api.get<WorkloadMemberResponse[]>(`/workspaces/${workspaceId}/workload`),

  // ---- Reports Aggregate ----

  getReports: (workspaceId: string) =>
    api.get<ReportDataResponse>(`/workspaces/${workspaceId}/reports`),
};
