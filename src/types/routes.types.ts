/**
 * Route paths constants - Giúp tránh typo và dễ refactor
 */
export const ROUTES = {
  HOME: "/",
  AUTH: {
    ROOT: "/auth",
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
  },
  CHAT: {
    ROOT: "/chat",
    GROUP: "/chat/group",
    CONTACTS: "/chat/contacts",
    CONVERSATION: (id: string) => `/chat/conversation/${id}`,
  },
  WORK_HUB: {
    ROOT: "/work-hub",
    CREATE: "/work-hub/create",
    WORKSPACE: (id: string) => `/work-hub/${id}`,
    BOARD: (workspaceId: string, boardId: string) =>
      `/work-hub/${workspaceId}/boards/${boardId}`,
    MEMBERS: (id: string) => `/work-hub/${id}/members`,
    SETTINGS: (id: string) => `/work-hub/${id}/settings`,
    INSIGHTS: (id: string) => `/work-hub/${id}/insights`,
    DOCUMENTS: (id: string) => `/work-hub/${id}/documents`,
    DOCUMENT_EDITOR: (workspaceId: string, docId: string) =>
      `/work-hub/${workspaceId}/documents/${docId}`,
    FILES: (id: string) => `/work-hub/${id}/files`,
    CHANNELS: (id: string) => `/work-hub/${id}/channels`,
    CHANNEL_CHAT: (workspaceId: string, channelId: string) =>
      `/work-hub/${workspaceId}/channels/${channelId}`,
    DIRECT_MESSAGES: (id: string) => `/work-hub/${id}/messages`,
    DM_THREAD: (workspaceId: string, threadId: string) =>
      `/work-hub/${workspaceId}/messages/${threadId}`,
    GOALS: (id: string) => `/work-hub/${id}/goals`,
    SPRINTS: (id: string) => `/work-hub/${id}/sprints`,
    ROADMAP: (id: string) => `/work-hub/${id}/roadmap`,
    WORKLOAD: (id: string) => `/work-hub/${id}/workload`,
    AUTOMATIONS: (id: string) => `/work-hub/${id}/automations`,
    REPORTS: (id: string) => `/work-hub/${id}/reports`,
    LABELS: (id: string) => `/work-hub/${id}/labels`,
    ACTIVITY_FEED: (id: string) => `/work-hub/${id}/activity`,
  },
  NOTE: "/notes",
  FRIENDS: "/friends",
  AICHAT: "/aichat",
  CALENDAR: "/calendar",
  SETTINGS: "/settings",
  PROFILE: "/profile",
  NOT_FOUND: "*",
};

/**
 * Route metadata - Dùng cho breadcrumb, title, permissions
 */
export type RouteMetadata = {
  title?: string;
  requireAuth?: boolean;
  roles: string[];
};
