import { api } from "../../services/api";
import type {
  WorkspaceResponse,
  WorkspaceMemberResponse,
  TaskBoardResponse,
  TaskResponse,
  LabelResponse,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  AddMemberRequest,
  UpdateMemberRoleRequest,
  CreateBoardRequest,
  UpdateBoardRequest,
  CreateTaskRequest,
  UpdateTaskRequest,
  MoveTaskRequest,
  CreateLabelRequest,
  UpdateLabelRequest,
} from "./work-hub.api.types";

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
};
