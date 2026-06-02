import type {
  User,
  Workspace,
  Board,
  BoardColumn,
  Task,
  SubTask,
  Label,
  InsightsSummary,
  Document,
  FileItem,
  StorageStats,
  Channel,
  ChannelMessage,
  DirectMessageThread,
  DirectMessage,
} from "../types/work-hub.types";

// ==================== USERS ====================
export const MOCK_USERS: User[] = [
  {
    id: "u1",
    name: "Phan Phuoc Hiep",
    email: "hiep@orion.com",
    phone: "0901234567",
    avatar: "/avatar-user.png",
    status: "online",
  },
  {
    id: "u2",
    name: "My Duyen",
    email: "duyen@orion.com",
    phone: "0912345678",
    avatar: "/avatar-user.png",
    status: "online",
  },
  {
    id: "u3",
    name: "Thanh Giang",
    email: "giang@orion.com",
    phone: "0923456789",
    avatar: "/avatar-user.png",
    status: "away",
  },
  {
    id: "u4",
    name: "Quang Nhan",
    email: "nhan@orion.com",
    phone: "0934567890",
    avatar: "/avatar-user.png",
    status: "offline",
  },
  {
    id: "u5",
    name: "Long Vu",
    email: "vu@orion.com",
    phone: "0945678901",
    avatar: "/avatar-user.png",
    status: "online",
  },
  {
    id: "u6",
    name: "Minh Tuan",
    email: "tuan@orion.com",
    avatar: "/avatar-user.png",
    status: "offline",
  },
];

// ==================== LABELS ====================
export const MOCK_LABELS: Label[] = [
  { id: "l1", text: "Feature", color: "#3b82f6", type: "feature" },
  { id: "l2", text: "Bug", color: "#ef4444", type: "bug" },
  { id: "l3", text: "Design", color: "#8b5cf6", type: "design" },
  { id: "l4", text: "Urgent", color: "#f97316", type: "urgent" },
  { id: "l5", text: "Improvement", color: "#10b981", type: "improvement" },
];

// ==================== BOARD COLUMNS ====================
const defaultColumns: BoardColumn[] = [
  { id: "col1", name: "To Do", status: "todo", color: "#94a3b8", order: 0 },
  {
    id: "col2",
    name: "In Progress",
    status: "inprogress",
    color: "#F59E0B",
    order: 1,
  },
  { id: "col3", name: "Review", status: "review", color: "#8b5cf6", order: 2 },
  { id: "col4", name: "Done", status: "done", color: "#10b981", order: 3 },
];

// ==================== BOARDS ====================
export const MOCK_BOARDS: Board[] = [
  {
    id: "b1",
    workspaceId: "ws1",
    name: "Sprint 1 - Core Features",
    description: "Main development board for sprint 1",
    color: "#0d9488",
    icon: "fa-rocket",
    columns: [...defaultColumns],
    createdAt: "2026-02-01",
  },
  {
    id: "b2",
    workspaceId: "ws1",
    name: "UI/UX Design",
    description: "Design tasks and mockups",
    color: "#8b5cf6",
    icon: "fa-palette",
    columns: [
      {
        id: "col-d1",
        name: "Backlog",
        status: "todo",
        color: "#94a3b8",
        order: 0,
      },
      {
        id: "col-d2",
        name: "In Design",
        status: "inprogress",
        color: "#F59E0B",
        order: 1,
      },
      {
        id: "col-d3",
        name: "Review",
        status: "review",
        color: "#8b5cf6",
        order: 2,
      },
      {
        id: "col-d4",
        name: "Approved",
        status: "done",
        color: "#10b981",
        order: 3,
      },
    ],
    createdAt: "2026-02-05",
  },
  {
    id: "b3",
    workspaceId: "ws1",
    name: "Bug Tracking",
    description: "Bug reports and fixes",
    color: "#ef4444",
    icon: "fa-bug",
    columns: [...defaultColumns],
    createdAt: "2026-02-10",
  },
];

// ==================== SUBTASKS ====================
const subtask1: SubTask[] = [
  {
    id: "st1",
    parentId: "t1",
    title: "Setup JWT token system",
    status: "done",
    assignee: MOCK_USERS[0],
    deadline: "2026-02-18",
    children: [],
    order: 0,
  },
  {
    id: "st2",
    parentId: "t1",
    title: "Create login API endpoint",
    status: "done",
    assignee: MOCK_USERS[0],
    deadline: "2026-02-19",
    children: [],
    order: 1,
  },
  {
    id: "st3",
    parentId: "t1",
    title: "Create register API endpoint",
    status: "inprogress",
    assignee: MOCK_USERS[4],
    deadline: "2026-02-20",
    children: [
      {
        id: "st3-1",
        parentId: "st3",
        title: "Email verification flow",
        status: "todo",
        assignee: MOCK_USERS[4],
        deadline: "2026-02-21",
        children: [],
        order: 0,
      },
    ],
    order: 2,
  },
  {
    id: "st4",
    parentId: "t1",
    title: "Frontend login form",
    status: "todo",
    assignee: MOCK_USERS[1],
    deadline: "2026-02-22",
    children: [],
    order: 3,
  },
];

// ==================== TASKS ====================
export const MOCK_TASKS: Task[] = [
  {
    id: "t1",
    boardId: "b1",
    columnId: "col2",
    title: "Implement user authentication",
    description:
      "Build login/register system with JWT tokens, password hashing, and session management.",
    status: "inprogress",
    priority: "high",
    assignees: [MOCK_USERS[0], MOCK_USERS[4]],
    labels: [MOCK_LABELS[0], MOCK_LABELS[3]],
    startDate: "2026-02-15",
    deadline: "2026-02-25",
    subtasks: subtask1,
    attachments: [
      {
        id: "a1",
        name: "auth-flow-diagram.png",
        url: "#",
        type: "image/png",
        size: 245000,
        uploadedBy: MOCK_USERS[0],
        uploadedAt: "2026-02-16",
      },
    ],
    comments: [
      {
        id: "c1",
        text: "Should we use OAuth2.0 or simple JWT?",
        author: MOCK_USERS[4],
        createdAt: "2026-02-16T10:30:00",
      },
      {
        id: "c2",
        text: "Let's go with JWT for simplicity. We can add OAuth later.",
        author: MOCK_USERS[0],
        createdAt: "2026-02-16T11:00:00",
      },
    ],
    viewCount: 24,
    viewedBy: [
      {
        userId: "u1",
        userName: "Phan Phuoc Hiep",
        viewedAt: "2026-02-20T09:00:00",
      },
      { userId: "u2", userName: "My Duyen", viewedAt: "2026-02-19T14:30:00" },
      { userId: "u5", userName: "Long Vu", viewedAt: "2026-02-20T08:15:00" },
    ],
    activityHistory: [
      {
        id: "ah1",
        type: "created",
        user: MOCK_USERS[0],
        description: "created this task",
        timestamp: "2026-02-15T09:00:00",
      },
      {
        id: "ah2",
        type: "assigned",
        user: MOCK_USERS[0],
        description: "assigned Long Vu to this task",
        timestamp: "2026-02-15T09:05:00",
      },
      {
        id: "ah3",
        type: "status_changed",
        user: MOCK_USERS[0],
        description: 'changed status from "To Do" to "In Progress"',
        timestamp: "2026-02-16T08:00:00",
      },
    ],
    createdBy: MOCK_USERS[0],
    createdAt: "2026-02-15",
    updatedAt: "2026-02-20",
    order: 0,
  },
  {
    id: "t2",
    boardId: "b1",
    columnId: "col1",
    title: "Design new landing page",
    description:
      "Create mockups for homepage redesign with new branding guidelines.",
    status: "todo",
    priority: "medium",
    assignees: [MOCK_USERS[2]],
    labels: [MOCK_LABELS[2]],
    startDate: "2026-02-22",
    deadline: "2026-03-05",
    subtasks: [
      {
        id: "st5",
        parentId: "t2",
        title: "Wireframe design",
        status: "todo",
        assignee: MOCK_USERS[2],
        children: [],
        order: 0,
      },
      {
        id: "st6",
        parentId: "t2",
        title: "High-fidelity mockup",
        status: "todo",
        assignee: MOCK_USERS[2],
        children: [],
        order: 1,
      },
    ],
    attachments: [],
    comments: [],
    viewCount: 8,
    viewedBy: [],
    activityHistory: [
      {
        id: "ah4",
        type: "created",
        user: MOCK_USERS[0],
        description: "created this task",
        timestamp: "2026-02-18T10:00:00",
      },
    ],
    createdBy: MOCK_USERS[0],
    createdAt: "2026-02-18",
    updatedAt: "2026-02-18",
    order: 0,
  },
  {
    id: "t3",
    boardId: "b1",
    columnId: "col1",
    title: "Fix login page responsive issue",
    description: "Login form breaks on mobile devices (< 375px width).",
    status: "todo",
    priority: "high",
    assignees: [MOCK_USERS[1]],
    labels: [MOCK_LABELS[1]],
    startDate: "2026-02-20",
    deadline: "2026-02-23",
    subtasks: [],
    attachments: [],
    comments: [],
    viewCount: 5,
    viewedBy: [],
    activityHistory: [],
    createdBy: MOCK_USERS[0],
    createdAt: "2026-02-20",
    updatedAt: "2026-02-20",
    order: 1,
  },
  {
    id: "t4",
    boardId: "b1",
    columnId: "col2",
    title: "Setup CI/CD pipeline",
    description:
      "Configure GitHub Actions for automated testing and deployment.",
    status: "inprogress",
    priority: "medium",
    assignees: [MOCK_USERS[4]],
    labels: [MOCK_LABELS[0]],
    startDate: "2026-02-17",
    deadline: "2026-02-28",
    subtasks: [
      {
        id: "st7",
        parentId: "t4",
        title: "Configure build pipeline",
        status: "done",
        assignee: MOCK_USERS[4],
        children: [],
        order: 0,
      },
      {
        id: "st8",
        parentId: "t4",
        title: "Add test automation",
        status: "inprogress",
        assignee: MOCK_USERS[4],
        children: [],
        order: 1,
      },
      {
        id: "st9",
        parentId: "t4",
        title: "Setup staging deployment",
        status: "todo",
        assignee: MOCK_USERS[4],
        children: [],
        order: 2,
      },
    ],
    attachments: [],
    comments: [
      {
        id: "c3",
        text: "Using GitHub Actions with Docker.",
        author: MOCK_USERS[4],
        createdAt: "2026-02-18T14:00:00",
      },
    ],
    viewCount: 12,
    viewedBy: [],
    activityHistory: [],
    createdBy: MOCK_USERS[4],
    createdAt: "2026-02-17",
    updatedAt: "2026-02-20",
    order: 1,
  },
  {
    id: "t5",
    boardId: "b1",
    columnId: "col3",
    title: "Update API documentation",
    description: "Document all REST endpoints with Swagger/OpenAPI spec.",
    status: "review",
    priority: "low",
    assignees: [MOCK_USERS[3]],
    labels: [MOCK_LABELS[0]],
    startDate: "2026-02-10",
    deadline: "2026-02-22",
    subtasks: [],
    attachments: [],
    comments: [],
    viewCount: 6,
    viewedBy: [],
    activityHistory: [],
    createdBy: MOCK_USERS[0],
    createdAt: "2026-02-10",
    updatedAt: "2026-02-21",
    order: 0,
  },
  {
    id: "t6",
    boardId: "b1",
    columnId: "col4",
    title: "Setup project structure",
    description:
      "Initialize project with Vite, React, TypeScript, Tailwind CSS.",
    status: "done",
    priority: "high",
    assignees: [MOCK_USERS[0]],
    labels: [MOCK_LABELS[0]],
    startDate: "2026-02-01",
    deadline: "2026-02-05",
    subtasks: [],
    attachments: [],
    comments: [],
    viewCount: 30,
    viewedBy: [],
    activityHistory: [],
    createdBy: MOCK_USERS[0],
    createdAt: "2026-02-01",
    updatedAt: "2026-02-04",
    order: 0,
  },
  {
    id: "t7",
    boardId: "b1",
    columnId: "col4",
    title: "Create project documentation",
    description:
      "Write comprehensive project setup guide and contributing guidelines.",
    status: "done",
    priority: "medium",
    assignees: [MOCK_USERS[3]],
    labels: [MOCK_LABELS[0]],
    startDate: "2026-02-03",
    deadline: "2026-02-08",
    subtasks: [],
    attachments: [],
    comments: [],
    viewCount: 15,
    viewedBy: [],
    activityHistory: [],
    createdBy: MOCK_USERS[3],
    createdAt: "2026-02-03",
    updatedAt: "2026-02-07",
    order: 1,
  },
  {
    id: "t8",
    boardId: "b1",
    columnId: "col1",
    title: "Optimize database queries",
    description: "Profile and optimize slow queries in the dashboard module.",
    status: "todo",
    priority: "critical",
    assignees: [MOCK_USERS[0], MOCK_USERS[4]],
    labels: [MOCK_LABELS[1], MOCK_LABELS[3]],
    startDate: "2026-02-25",
    deadline: "2026-02-27",
    subtasks: [],
    attachments: [],
    comments: [],
    viewCount: 3,
    viewedBy: [],
    activityHistory: [],
    createdBy: MOCK_USERS[0],
    createdAt: "2026-02-22",
    updatedAt: "2026-02-22",
    order: 2,
  },
  {
    id: "t9",
    boardId: "b1",
    columnId: "col1",
    title: "Implement real-time notifications",
    description: "Add WebSocket-based push notifications for task updates.",
    status: "todo",
    priority: "medium",
    assignees: [MOCK_USERS[0]],
    labels: [MOCK_LABELS[0]],
    startDate: "2026-03-01",
    deadline: "2026-03-10",
    subtasks: [],
    attachments: [],
    comments: [],
    viewCount: 2,
    viewedBy: [],
    activityHistory: [],
    createdBy: MOCK_USERS[0],
    createdAt: "2026-02-22",
    updatedAt: "2026-02-22",
    order: 3,
  },
  {
    id: "t10",
    boardId: "b1",
    columnId: "col4",
    title: "Setup Tailwind CSS theme",
    description:
      "Configure custom theme colors, fonts, and spacing for the project.",
    status: "done",
    priority: "low",
    assignees: [MOCK_USERS[1]],
    labels: [MOCK_LABELS[2]],
    startDate: "2026-02-02",
    deadline: "2026-02-06",
    subtasks: [],
    attachments: [],
    comments: [],
    viewCount: 18,
    viewedBy: [],
    activityHistory: [],
    createdBy: MOCK_USERS[1],
    createdAt: "2026-02-02",
    updatedAt: "2026-02-05",
    order: 2,
  },
];

// ==================== WORKSPACES ====================
export const MOCK_WORKSPACES: Workspace[] = [
  {
    id: "ws1",
    name: "Orion Project",
    description: "Main workspace for the Orion Chat application development.",
    type: "business",
    avatar: undefined,
    color: "#0d9488",
    isPublic: false,
    createdAt: "2026-01-15",
    owner: MOCK_USERS[0],
    members: [
      { user: MOCK_USERS[0], role: "owner", joinedAt: "2026-01-15" },
      { user: MOCK_USERS[1], role: "admin", joinedAt: "2026-01-16" },
      { user: MOCK_USERS[2], role: "member", joinedAt: "2026-01-17" },
      { user: MOCK_USERS[3], role: "member", joinedAt: "2026-01-18" },
      { user: MOCK_USERS[4], role: "admin", joinedAt: "2026-01-18" },
      { user: MOCK_USERS[5], role: "member", joinedAt: "2026-02-01" },
    ],
    boards: MOCK_BOARDS,
    stats: {
      totalTasks: 10,
      completedTasks: 3,
      inProgressTasks: 2,
      overdueTasks: 1,
      totalMembers: 6,
    },
  },
];

// ==================== AI INSIGHTS ====================
// ==================== DOCUMENTS ====================
export const MOCK_DOCUMENTS: Document[] = [
  {
    id: "doc1",
    workspaceId: "ws1",
    title: "Project Requirements - Orion Chat v2",
    content:
      "<h1>Orion Chat v2 Requirements</h1><p>This document outlines the key requirements for v2...</p>",
    createdBy: MOCK_USERS[0],
    createdAt: "2026-02-01T09:00:00",
    updatedAt: "2026-02-28T14:30:00",
    lastEditedBy: MOCK_USERS[1],
    collaborators: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[4]],
    versions: [
      {
        id: "v1",
        documentId: "doc1",
        name: "Initial Draft",
        content: "",
        editedBy: MOCK_USERS[0],
        createdAt: "2026-02-01T09:00:00",
      },
      {
        id: "v2",
        documentId: "doc1",
        name: "Reviewed v1.0",
        content: "",
        editedBy: MOCK_USERS[1],
        createdAt: "2026-02-15T11:00:00",
      },
      {
        id: "v3",
        documentId: "doc1",
        content: "",
        editedBy: MOCK_USERS[4],
        createdAt: "2026-02-28T14:30:00",
      },
    ],
    comments: [
      {
        id: "ic1",
        documentId: "doc1",
        selectedText: "key requirements",
        text: "We should prioritize the real-time features",
        author: MOCK_USERS[4],
        createdAt: "2026-02-10T10:00:00",
        isResolved: false,
        replies: [
          {
            id: "icr1",
            text: "Agreed, let's focus on WebSocket first",
            author: MOCK_USERS[0],
            createdAt: "2026-02-10T10:30:00",
          },
        ],
      },
    ],
    isFavorite: true,
    viewCount: 45,
  },
  {
    id: "doc2",
    workspaceId: "ws1",
    title: "API Design Guidelines",
    content:
      "<h1>API Design Guidelines</h1><p>REST API conventions for the team...</p>",
    createdBy: MOCK_USERS[4],
    createdAt: "2026-02-05T10:00:00",
    updatedAt: "2026-02-20T16:00:00",
    lastEditedBy: MOCK_USERS[4],
    collaborators: [MOCK_USERS[0], MOCK_USERS[4]],
    versions: [
      {
        id: "v4",
        documentId: "doc2",
        name: "First version",
        content: "",
        editedBy: MOCK_USERS[4],
        createdAt: "2026-02-05T10:00:00",
      },
    ],
    comments: [],
    isFavorite: false,
    viewCount: 22,
  },
  {
    id: "doc3",
    workspaceId: "ws1",
    title: "Sprint 1 Retrospective Notes",
    content: "<h1>Sprint 1 Retro</h1><p>What went well, what to improve...</p>",
    createdBy: MOCK_USERS[0],
    createdAt: "2026-02-15T15:00:00",
    updatedAt: "2026-02-15T17:00:00",
    lastEditedBy: MOCK_USERS[0],
    collaborators: [
      MOCK_USERS[0],
      MOCK_USERS[1],
      MOCK_USERS[2],
      MOCK_USERS[3],
      MOCK_USERS[4],
    ],
    versions: [
      {
        id: "v5",
        documentId: "doc3",
        content: "",
        editedBy: MOCK_USERS[0],
        createdAt: "2026-02-15T15:00:00",
      },
    ],
    comments: [],
    isFavorite: false,
    viewCount: 18,
  },
  {
    id: "doc4",
    workspaceId: "ws1",
    title: "UI Component Library Spec",
    content:
      "<h1>Component Library</h1><p>Reusable components for the Orion design system...</p>",
    createdBy: MOCK_USERS[1],
    createdAt: "2026-02-08T09:00:00",
    updatedAt: "2026-02-25T11:00:00",
    lastEditedBy: MOCK_USERS[2],
    collaborators: [MOCK_USERS[1], MOCK_USERS[2]],
    versions: [
      {
        id: "v6",
        documentId: "doc4",
        name: "Draft",
        content: "",
        editedBy: MOCK_USERS[1],
        createdAt: "2026-02-08T09:00:00",
      },
      {
        id: "v7",
        documentId: "doc4",
        content: "",
        editedBy: MOCK_USERS[2],
        createdAt: "2026-02-25T11:00:00",
      },
    ],
    comments: [
      {
        id: "ic2",
        documentId: "doc4",
        selectedText: "design system",
        text: "Should we use Radix primitives?",
        author: MOCK_USERS[2],
        createdAt: "2026-02-12T14:00:00",
        isResolved: true,
        replies: [
          {
            id: "icr2",
            text: "Yes, let's go with Radix + Tailwind",
            author: MOCK_USERS[1],
            createdAt: "2026-02-12T15:00:00",
          },
        ],
      },
    ],
    isFavorite: true,
    viewCount: 31,
  },
  {
    id: "doc5",
    workspaceId: "ws1",
    title: "Meeting Notes - Feb 20",
    content:
      "<h1>Meeting Notes</h1><p>Agenda and action items from weekly sync...</p>",
    createdBy: MOCK_USERS[3],
    createdAt: "2026-02-20T14:00:00",
    updatedAt: "2026-02-20T15:30:00",
    lastEditedBy: MOCK_USERS[3],
    collaborators: [MOCK_USERS[0], MOCK_USERS[3]],
    versions: [],
    comments: [],
    isFavorite: false,
    viewCount: 12,
  },
];

// ==================== FILE STORAGE ====================
export const MOCK_FILES: FileItem[] = [
  {
    id: "folder1",
    workspaceId: "ws1",
    name: "Design Assets",
    type: "folder",
    parentId: null,
    uploadedAt: "2026-02-01",
    accessLevel: "workspace",
    children: [
      {
        id: "f1",
        workspaceId: "ws1",
        name: "logo-final.png",
        type: "file",
        mimeType: "image/png",
        size: 524288,
        url: "#",
        parentId: "folder1",
        uploadedBy: MOCK_USERS[2],
        uploadedAt: "2026-02-05",
        accessLevel: "workspace",
      },
      {
        id: "f2",
        workspaceId: "ws1",
        name: "color-palette.pdf",
        type: "file",
        mimeType: "application/pdf",
        size: 1048576,
        url: "#",
        parentId: "folder1",
        uploadedBy: MOCK_USERS[2],
        uploadedAt: "2026-02-06",
        accessLevel: "workspace",
      },
      {
        id: "f3",
        workspaceId: "ws1",
        name: "wireframes-v2.fig",
        type: "file",
        mimeType: "application/octet-stream",
        size: 3145728,
        url: "#",
        parentId: "folder1",
        uploadedBy: MOCK_USERS[2],
        uploadedAt: "2026-02-10",
        accessLevel: "workspace",
      },
    ],
  },
  {
    id: "folder2",
    workspaceId: "ws1",
    name: "Documentation",
    type: "folder",
    parentId: null,
    uploadedAt: "2026-02-02",
    accessLevel: "workspace",
    children: [
      {
        id: "f4",
        workspaceId: "ws1",
        name: "api-spec.yaml",
        type: "file",
        mimeType: "text/yaml",
        size: 45056,
        url: "#",
        parentId: "folder2",
        uploadedBy: MOCK_USERS[4],
        uploadedAt: "2026-02-08",
        accessLevel: "workspace",
      },
      {
        id: "f5",
        workspaceId: "ws1",
        name: "deployment-guide.docx",
        type: "file",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 204800,
        url: "#",
        parentId: "folder2",
        uploadedBy: MOCK_USERS[0],
        uploadedAt: "2026-02-12",
        accessLevel: "admin_only",
      },
    ],
  },
  {
    id: "folder3",
    workspaceId: "ws1",
    name: "Meeting Recordings",
    type: "folder",
    parentId: null,
    uploadedAt: "2026-02-10",
    accessLevel: "workspace",
    children: [
      {
        id: "f6",
        workspaceId: "ws1",
        name: "sprint-planning-feb10.mp4",
        type: "file",
        mimeType: "video/mp4",
        size: 52428800,
        url: "#",
        parentId: "folder3",
        uploadedBy: MOCK_USERS[0],
        uploadedAt: "2026-02-10",
        accessLevel: "workspace",
      },
    ],
  },
  {
    id: "f7",
    workspaceId: "ws1",
    name: "project-timeline.xlsx",
    type: "file",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 102400,
    url: "#",
    parentId: null,
    uploadedBy: MOCK_USERS[0],
    uploadedAt: "2026-02-03",
    accessLevel: "workspace",
  },
  {
    id: "f8",
    workspaceId: "ws1",
    name: "branding-guidelines.pdf",
    type: "file",
    mimeType: "application/pdf",
    size: 2097152,
    url: "#",
    parentId: null,
    uploadedBy: MOCK_USERS[1],
    uploadedAt: "2026-02-07",
    accessLevel: "workspace",
  },
];

export const MOCK_STORAGE_STATS: StorageStats = {
  usedBytes: 59596800,
  limitBytes: 5368709120,
};

// ==================== CHANNELS ====================
export const MOCK_CHANNELS: Channel[] = [
  {
    id: "ch1",
    workspaceId: "ws1",
    name: "general",
    description: "General announcements and updates",
    type: "public",
    createdBy: MOCK_USERS[0],
    createdAt: "2026-01-15T09:00:00",
    members: MOCK_USERS.slice(0, 6),
    pinnedMessages: [],
    unreadCount: 3,
    isDefault: true,
    lastMessage: {
      id: "m1",
      channelId: "ch1",
      text: "Sprint 4 kickoff meeting scheduled for tomorrow at 10 AM",
      author: MOCK_USERS[0],
      createdAt: "2026-02-28T17:00:00",
      isPinned: false,
      attachments: [],
      reactions: [{ emoji: "👍", users: [MOCK_USERS[1], MOCK_USERS[4]] }],
      threadReplies: [],
      threadReplyCount: 0,
      mentions: [],
    },
  },
  {
    id: "ch2",
    workspaceId: "ws1",
    name: "random",
    description: "Fun, off-topic conversations",
    type: "public",
    createdBy: MOCK_USERS[0],
    createdAt: "2026-01-15T09:00:00",
    members: MOCK_USERS.slice(0, 6),
    pinnedMessages: [],
    unreadCount: 0,
    isDefault: true,
    lastMessage: {
      id: "m2",
      channelId: "ch2",
      text: "Anyone up for coffee? ☕",
      author: MOCK_USERS[2],
      createdAt: "2026-02-28T15:30:00",
      isPinned: false,
      attachments: [],
      reactions: [],
      threadReplies: [],
      threadReplyCount: 0,
      mentions: [],
    },
  },
  {
    id: "ch3",
    workspaceId: "ws1",
    name: "dev-frontend",
    description: "Frontend development discussions",
    type: "public",
    createdBy: MOCK_USERS[0],
    createdAt: "2026-01-20T10:00:00",
    members: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2], MOCK_USERS[4]],
    pinnedMessages: [],
    unreadCount: 5,
    isDefault: false,
    lastMessage: {
      id: "m3",
      channelId: "ch3",
      text: "I've pushed the new component library updates to the dev branch",
      author: MOCK_USERS[1],
      createdAt: "2026-02-28T16:45:00",
      isPinned: false,
      attachments: [],
      reactions: [],
      threadReplies: [],
      threadReplyCount: 2,
      mentions: [],
    },
  },
  {
    id: "ch4",
    workspaceId: "ws1",
    name: "dev-backend",
    description: "Backend & API discussions",
    type: "public",
    createdBy: MOCK_USERS[4],
    createdAt: "2026-01-20T10:00:00",
    members: [MOCK_USERS[0], MOCK_USERS[3], MOCK_USERS[4]],
    pinnedMessages: [],
    unreadCount: 1,
    isDefault: false,
    lastMessage: {
      id: "m4",
      channelId: "ch4",
      text: "Database migration script is ready for review",
      author: MOCK_USERS[4],
      createdAt: "2026-02-28T14:20:00",
      isPinned: false,
      attachments: [],
      reactions: [],
      threadReplies: [],
      threadReplyCount: 0,
      mentions: [],
    },
  },
  {
    id: "ch5",
    workspaceId: "ws1",
    name: "admin-private",
    description: "Admin-only discussions",
    type: "private",
    createdBy: MOCK_USERS[0],
    createdAt: "2026-02-01T09:00:00",
    members: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[4]],
    pinnedMessages: [],
    unreadCount: 0,
    isDefault: false,
    lastMessage: {
      id: "m5",
      channelId: "ch5",
      text: "Need to discuss team performance reviews",
      author: MOCK_USERS[0],
      createdAt: "2026-02-27T11:00:00",
      isPinned: false,
      attachments: [],
      reactions: [],
      threadReplies: [],
      threadReplyCount: 0,
      mentions: [],
    },
  },
];

export const MOCK_CHANNEL_MESSAGES: ChannelMessage[] = [
  {
    id: "cm1",
    channelId: "ch1",
    text: "Welcome to the Orion Project workspace! 🎉",
    author: MOCK_USERS[0],
    createdAt: "2026-01-15T09:00:00",
    isPinned: true,
    attachments: [],
    reactions: [
      { emoji: "🎉", users: [MOCK_USERS[1], MOCK_USERS[2], MOCK_USERS[3]] },
    ],
    threadReplies: [],
    threadReplyCount: 0,
    mentions: [],
  },
  {
    id: "cm2",
    channelId: "ch1",
    text: "Sprint 3 retrospective report is available in the Documents section.",
    author: MOCK_USERS[0],
    createdAt: "2026-02-25T10:00:00",
    isPinned: false,
    attachments: [],
    reactions: [],
    threadReplies: [],
    threadReplyCount: 0,
    mentions: [],
  },
  {
    id: "cm3",
    channelId: "ch1",
    text: "@My Duyen the login page fix has been deployed to staging",
    author: MOCK_USERS[4],
    createdAt: "2026-02-26T14:30:00",
    isPinned: false,
    attachments: [],
    reactions: [{ emoji: "👍", users: [MOCK_USERS[1]] }],
    threadReplies: [],
    threadReplyCount: 1,
    mentions: ["u2"],
  },
  {
    id: "cm4",
    channelId: "ch1",
    text: "Reminder: code freeze for v1.0 is this Friday",
    author: MOCK_USERS[0],
    createdAt: "2026-02-27T09:00:00",
    isPinned: false,
    attachments: [],
    reactions: [{ emoji: "✅", users: [MOCK_USERS[1], MOCK_USERS[4]] }],
    threadReplies: [],
    threadReplyCount: 0,
    mentions: [],
  },
  {
    id: "cm5",
    channelId: "ch1",
    text: "Sprint 4 kickoff meeting scheduled for tomorrow at 10 AM",
    author: MOCK_USERS[0],
    createdAt: "2026-02-28T17:00:00",
    isPinned: false,
    attachments: [],
    reactions: [{ emoji: "👍", users: [MOCK_USERS[1], MOCK_USERS[4]] }],
    threadReplies: [],
    threadReplyCount: 0,
    mentions: [],
  },
  {
    id: "cm6",
    channelId: "ch3",
    text: "I'm working on the new sidebar component",
    author: MOCK_USERS[1],
    createdAt: "2026-02-28T09:00:00",
    isPinned: false,
    attachments: [],
    reactions: [],
    threadReplies: [],
    threadReplyCount: 0,
    mentions: [],
  },
  {
    id: "cm7",
    channelId: "ch3",
    text: "The modal component has been refactored to support multiple sizes",
    author: MOCK_USERS[2],
    createdAt: "2026-02-28T11:30:00",
    isPinned: false,
    attachments: [],
    reactions: [{ emoji: "🔥", users: [MOCK_USERS[0]] }],
    threadReplies: [],
    threadReplyCount: 0,
    mentions: [],
  },
  {
    id: "cm8",
    channelId: "ch3",
    text: "I've pushed the new component library updates to the dev branch",
    author: MOCK_USERS[1],
    createdAt: "2026-02-28T16:45:00",
    isPinned: false,
    attachments: [],
    reactions: [],
    threadReplies: [
      {
        id: "cm8r1",
        channelId: "ch3",
        text: "Great work! I'll review it tomorrow",
        author: MOCK_USERS[0],
        createdAt: "2026-02-28T17:00:00",
        isPinned: false,
        attachments: [],
        reactions: [],
        threadReplies: [],
        threadReplyCount: 0,
        mentions: [],
      },
      {
        id: "cm8r2",
        channelId: "ch3",
        text: "Let me know if you need help with testing",
        author: MOCK_USERS[4],
        createdAt: "2026-02-28T17:15:00",
        isPinned: false,
        attachments: [],
        reactions: [],
        threadReplies: [],
        threadReplyCount: 0,
        mentions: [],
      },
    ],
    threadReplyCount: 2,
    mentions: [],
  },
];

// ==================== DIRECT MESSAGES ====================
export const MOCK_DM_THREADS: DirectMessageThread[] = [
  {
    id: "dm1",
    workspaceId: "ws1",
    participants: [MOCK_USERS[0], MOCK_USERS[1]],
    unreadCount: 2,
    updatedAt: "2026-02-28T16:00:00",
    lastMessage: {
      id: "dmsg1",
      threadId: "dm1",
      text: "Can you review my PR when you get a chance?",
      author: MOCK_USERS[1],
      createdAt: "2026-02-28T16:00:00",
      attachments: [],
      isRead: false,
    },
  },
  {
    id: "dm2",
    workspaceId: "ws1",
    participants: [MOCK_USERS[0], MOCK_USERS[4]],
    unreadCount: 0,
    updatedAt: "2026-02-28T14:00:00",
    lastMessage: {
      id: "dmsg2",
      threadId: "dm2",
      text: "CI pipeline is green now 🟢",
      author: MOCK_USERS[4],
      createdAt: "2026-02-28T14:00:00",
      attachments: [],
      isRead: true,
    },
  },
  {
    id: "dm3",
    workspaceId: "ws1",
    participants: [MOCK_USERS[0], MOCK_USERS[2]],
    unreadCount: 1,
    updatedAt: "2026-02-27T18:00:00",
    lastMessage: {
      id: "dmsg3",
      threadId: "dm3",
      text: "I'll finish the wireframes by tomorrow",
      author: MOCK_USERS[2],
      createdAt: "2026-02-27T18:00:00",
      attachments: [],
      isRead: false,
    },
  },
];

export const MOCK_DM_MESSAGES: DirectMessage[] = [
  {
    id: "dms1",
    threadId: "dm1",
    text: "Hey, I've been working on the auth module",
    author: MOCK_USERS[0],
    createdAt: "2026-02-28T10:00:00",
    attachments: [],
    isRead: true,
  },
  {
    id: "dms2",
    threadId: "dm1",
    text: "Nice! I saw the commits. Looks good so far.",
    author: MOCK_USERS[1],
    createdAt: "2026-02-28T10:30:00",
    attachments: [],
    isRead: true,
  },
  {
    id: "dms3",
    threadId: "dm1",
    text: "Thanks! Just need to finish the token refresh logic",
    author: MOCK_USERS[0],
    createdAt: "2026-02-28T11:00:00",
    attachments: [],
    isRead: true,
  },
  {
    id: "dms4",
    threadId: "dm1",
    text: "Can you review my PR when you get a chance?",
    author: MOCK_USERS[1],
    createdAt: "2026-02-28T16:00:00",
    attachments: [],
    isRead: false,
  },
  {
    id: "dms5",
    threadId: "dm2",
    text: "The build pipeline keeps failing on the test stage",
    author: MOCK_USERS[0],
    createdAt: "2026-02-28T09:00:00",
    attachments: [],
    isRead: true,
  },
  {
    id: "dms6",
    threadId: "dm2",
    text: "Looking into it now...",
    author: MOCK_USERS[4],
    createdAt: "2026-02-28T09:30:00",
    attachments: [],
    isRead: true,
  },
  {
    id: "dms7",
    threadId: "dm2",
    text: "Found the issue — was a flaky test. Fixed it.",
    author: MOCK_USERS[4],
    createdAt: "2026-02-28T13:00:00",
    attachments: [],
    isRead: true,
  },
  {
    id: "dms8",
    threadId: "dm2",
    text: "CI pipeline is green now 🟢",
    author: MOCK_USERS[4],
    createdAt: "2026-02-28T14:00:00",
    attachments: [],
    isRead: true,
  },
];

// ==================== AI INSIGHTS ====================
export const MOCK_INSIGHTS: InsightsSummary = {
  progressPercentage: 42,
  totalTasks: 10,
  completedTasks: 3,
  overdueTasks: 1,
  unclaimedTasks: 0,
  burndownData: [
    { date: "Feb 1", ideal: 10, actual: 10 },
    { date: "Feb 5", ideal: 9, actual: 9 },
    { date: "Feb 10", ideal: 7, actual: 8 },
    { date: "Feb 15", ideal: 6, actual: 7 },
    { date: "Feb 20", ideal: 4, actual: 7 },
    { date: "Feb 25", ideal: 2, actual: 5 },
    { date: "Mar 1", ideal: 0, actual: 4 },
  ],
  velocityData: [
    { sprint: "Sprint 1", completed: 8, planned: 10 },
    { sprint: "Sprint 2", completed: 12, planned: 12 },
    { sprint: "Sprint 3", completed: 6, planned: 10 },
    { sprint: "Sprint 4", completed: 3, planned: 10 },
  ],
  riskAlerts: [
    {
      id: "r1",
      type: "deadline",
      severity: "critical",
      message:
        '"Optimize database queries" is due in 2 days but still in To Do status.',
      taskId: "t8",
    },
    {
      id: "r2",
      type: "stale",
      severity: "warning",
      message: '"Design new landing page" has had no updates in 5 days.',
      taskId: "t2",
    },
    {
      id: "r3",
      type: "overloaded",
      severity: "warning",
      message: "Phan Phuoc Hiep has 4 active tasks with overlapping deadlines.",
      userId: "u1",
    },
    {
      id: "r4",
      type: "low_completion",
      severity: "warning",
      message: "Sprint 4 completion rate is 30%, below the 70% target.",
    },
  ],
  memberPerformance: [
    {
      user: MOCK_USERS[0],
      tasksCompleted: 5,
      tasksInProgress: 2,
      avgCompletionDays: 3.2,
      onTimeRate: 85,
    },
    {
      user: MOCK_USERS[1],
      tasksCompleted: 3,
      tasksInProgress: 1,
      avgCompletionDays: 2.8,
      onTimeRate: 92,
    },
    {
      user: MOCK_USERS[2],
      tasksCompleted: 2,
      tasksInProgress: 0,
      avgCompletionDays: 4.5,
      onTimeRate: 70,
    },
    {
      user: MOCK_USERS[3],
      tasksCompleted: 4,
      tasksInProgress: 1,
      avgCompletionDays: 2.1,
      onTimeRate: 95,
    },
    {
      user: MOCK_USERS[4],
      tasksCompleted: 3,
      tasksInProgress: 2,
      avgCompletionDays: 3.8,
      onTimeRate: 78,
    },
  ],
  aiSuggestions: [
    {
      id: "s1",
      type: "reassign",
      title: "Reassign database optimization",
      description:
        'Consider reassigning "Optimize database queries" to Long Vu who has bandwidth and relevant experience.',
      actionLabel: "Reassign Task",
    },
    {
      id: "s2",
      type: "split",
      title: "Break down authentication task",
      description:
        "The authentication task has grown complex. Consider splitting into separate login, register, and token management tasks.",
      actionLabel: "Split Task",
    },
    {
      id: "s3",
      type: "deadline",
      title: "Extend landing page deadline",
      description:
        "Based on historical velocity, the landing page task may need 3 more days. Consider extending deadline to Mar 8.",
      actionLabel: "Extend Deadline",
    },
  ],
  dailyDigest: [
    {
      id: "d1",
      type: "completed",
      message: 'Long Vu completed "Configure build pipeline"',
      timestamp: "2026-02-28T16:00:00",
    },
    {
      id: "d2",
      type: "created",
      message: "2 new tasks were created yesterday",
      timestamp: "2026-02-28T09:00:00",
    },
    {
      id: "d3",
      type: "overdue",
      message: '1 task is overdue: "Update API documentation"',
      timestamp: "2026-02-28T08:00:00",
    },
    {
      id: "d4",
      type: "assigned",
      message: 'My Duyen was assigned "Fix login page responsive issue"',
      timestamp: "2026-02-28T10:30:00",
    },
  ],
};

// ==================== GOALS & OKRs ====================
export interface Goal {
  id: string;
  title: string;
  description: string;
  owner: User;
  progress: number;
  status: "on_track" | "at_risk" | "behind" | "completed";
  startDate: string;
  endDate: string;
  keyResults: KeyResult[];
}

export interface KeyResult {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  linkedTaskCount: number;
}

export const MOCK_GOALS: Goal[] = [
  {
    id: "g1",
    title: "Launch MVP by Q1 2026",
    description:
      "Ship the minimum viable product with core features to early adopters",
    owner: MOCK_USERS[0],
    progress: 72,
    status: "on_track",
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    keyResults: [
      {
        id: "kr1",
        title: "Complete all core API endpoints",
        current: 18,
        target: 20,
        unit: "endpoints",
        linkedTaskCount: 8,
      },
      {
        id: "kr2",
        title: "Achieve 90% test coverage",
        current: 78,
        target: 90,
        unit: "%",
        linkedTaskCount: 5,
      },
      {
        id: "kr3",
        title: "Onboard 50 beta users",
        current: 32,
        target: 50,
        unit: "users",
        linkedTaskCount: 3,
      },
    ],
  },
  {
    id: "g2",
    title: "Improve Team Velocity by 30%",
    description: "Optimize development processes to increase sprint throughput",
    owner: MOCK_USERS[1],
    progress: 45,
    status: "at_risk",
    startDate: "2026-01-15",
    endDate: "2026-04-15",
    keyResults: [
      {
        id: "kr4",
        title: "Reduce average PR review time",
        current: 6,
        target: 4,
        unit: "hours",
        linkedTaskCount: 2,
      },
      {
        id: "kr5",
        title: "Automate 80% of CI/CD pipeline",
        current: 55,
        target: 80,
        unit: "%",
        linkedTaskCount: 4,
      },
      {
        id: "kr6",
        title: "Decrease bug reopen rate below 5%",
        current: 12,
        target: 5,
        unit: "%",
        linkedTaskCount: 6,
      },
    ],
  },
  {
    id: "g3",
    title: "Enhance User Experience",
    description: "Improve UI/UX based on user feedback and usability testing",
    owner: MOCK_USERS[2],
    progress: 88,
    status: "on_track",
    startDate: "2026-02-01",
    endDate: "2026-03-31",
    keyResults: [
      {
        id: "kr7",
        title: "Redesign 10 key screens",
        current: 9,
        target: 10,
        unit: "screens",
        linkedTaskCount: 10,
      },
      {
        id: "kr8",
        title: "Achieve NPS score of 40+",
        current: 38,
        target: 40,
        unit: "score",
        linkedTaskCount: 0,
      },
    ],
  },
  {
    id: "g4",
    title: "Infrastructure Scalability",
    description: "Prepare backend infrastructure for 10x user growth",
    owner: MOCK_USERS[4],
    progress: 20,
    status: "behind",
    startDate: "2026-02-15",
    endDate: "2026-05-30",
    keyResults: [
      {
        id: "kr9",
        title: "Migrate to Kubernetes",
        current: 1,
        target: 5,
        unit: "services",
        linkedTaskCount: 3,
      },
      {
        id: "kr10",
        title: "API response time < 200ms (p95)",
        current: 450,
        target: 200,
        unit: "ms",
        linkedTaskCount: 4,
      },
      {
        id: "kr11",
        title: "Set up auto-scaling for all services",
        current: 0,
        target: 5,
        unit: "services",
        linkedTaskCount: 2,
      },
    ],
  },
];

// ==================== SPRINTS ====================
export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "completed" | "cancelled";
  tasks: SprintTask[];
}

export interface SprintTask {
  id: string;
  title: string;
  status: "todo" | "inprogress" | "review" | "done";
  priority: "low" | "medium" | "high" | "critical";
  assignee: User;
  storyPoints: number;
  boardName: string;
}

export const MOCK_SPRINTS: Sprint[] = [
  {
    id: "sp1",
    name: "Sprint 5",
    goal: "Complete user authentication flow and dashboard redesign",
    startDate: "2026-03-09",
    endDate: "2026-03-22",
    status: "active",
    tasks: [
      {
        id: "st1",
        title: "Implement OAuth2 login",
        status: "done",
        priority: "high",
        assignee: MOCK_USERS[0],
        storyPoints: 5,
        boardName: "Backend",
      },
      {
        id: "st2",
        title: "Design new dashboard layout",
        status: "inprogress",
        priority: "high",
        assignee: MOCK_USERS[2],
        storyPoints: 8,
        boardName: "Frontend",
      },
      {
        id: "st3",
        title: "API rate limiting middleware",
        status: "inprogress",
        priority: "medium",
        assignee: MOCK_USERS[4],
        storyPoints: 3,
        boardName: "Backend",
      },
      {
        id: "st4",
        title: "Write E2E tests for auth",
        status: "todo",
        priority: "medium",
        assignee: MOCK_USERS[1],
        storyPoints: 5,
        boardName: "QA",
      },
      {
        id: "st5",
        title: "Fix navbar responsive issue",
        status: "done",
        priority: "low",
        assignee: MOCK_USERS[3],
        storyPoints: 2,
        boardName: "Frontend",
      },
      {
        id: "st6",
        title: "Update user profile API",
        status: "review",
        priority: "medium",
        assignee: MOCK_USERS[0],
        storyPoints: 3,
        boardName: "Backend",
      },
    ],
  },
  {
    id: "sp2",
    name: "Sprint 4",
    goal: "File management system and notification improvements",
    startDate: "2026-02-23",
    endDate: "2026-03-08",
    status: "completed",
    tasks: [
      {
        id: "st7",
        title: "File upload service",
        status: "done",
        priority: "high",
        assignee: MOCK_USERS[4],
        storyPoints: 8,
        boardName: "Backend",
      },
      {
        id: "st8",
        title: "File preview component",
        status: "done",
        priority: "high",
        assignee: MOCK_USERS[2],
        storyPoints: 5,
        boardName: "Frontend",
      },
      {
        id: "st9",
        title: "Push notification integration",
        status: "done",
        priority: "medium",
        assignee: MOCK_USERS[0],
        storyPoints: 5,
        boardName: "Backend",
      },
      {
        id: "st10",
        title: "Notification preferences UI",
        status: "done",
        priority: "low",
        assignee: MOCK_USERS[3],
        storyPoints: 3,
        boardName: "Frontend",
      },
      {
        id: "st11",
        title: "Storage quota management",
        status: "done",
        priority: "medium",
        assignee: MOCK_USERS[1],
        storyPoints: 3,
        boardName: "Backend",
      },
    ],
  },
  {
    id: "sp3",
    name: "Sprint 6",
    goal: "Real-time collaboration and workspace settings",
    startDate: "2026-03-23",
    endDate: "2026-04-05",
    status: "planning",
    tasks: [
      {
        id: "st12",
        title: "WebSocket connection manager",
        status: "todo",
        priority: "critical",
        assignee: MOCK_USERS[4],
        storyPoints: 8,
        boardName: "Backend",
      },
      {
        id: "st13",
        title: "Real-time cursor sharing",
        status: "todo",
        priority: "high",
        assignee: MOCK_USERS[0],
        storyPoints: 5,
        boardName: "Frontend",
      },
      {
        id: "st14",
        title: "Workspace role permissions",
        status: "todo",
        priority: "high",
        assignee: MOCK_USERS[1],
        storyPoints: 5,
        boardName: "Backend",
      },
    ],
  },
];

// ==================== ROADMAP ====================
export interface RoadmapEpic {
  id: string;
  title: string;
  description: string;
  color: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: "planned" | "in_progress" | "completed" | "blocked";
  owner: User;
  boardName: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  date: string;
  status: "upcoming" | "reached" | "missed";
}

export const MOCK_ROADMAP_EPICS: RoadmapEpic[] = [
  {
    id: "e1",
    title: "User Authentication System",
    description: "OAuth2, SSO, MFA support",
    color: "#3b82f6",
    startDate: "2026-01-05",
    endDate: "2026-02-15",
    progress: 100,
    status: "completed",
    owner: MOCK_USERS[0],
    boardName: "Backend",
  },
  {
    id: "e2",
    title: "Real-time Collaboration",
    description: "WebSocket, live cursors, co-editing",
    color: "#8b5cf6",
    startDate: "2026-02-01",
    endDate: "2026-04-10",
    progress: 35,
    status: "in_progress",
    owner: MOCK_USERS[4],
    boardName: "Backend",
  },
  {
    id: "e3",
    title: "Dashboard & Analytics",
    description: "Charts, insights, reports",
    color: "#10b981",
    startDate: "2026-02-15",
    endDate: "2026-03-30",
    progress: 65,
    status: "in_progress",
    owner: MOCK_USERS[2],
    boardName: "Frontend",
  },
  {
    id: "e4",
    title: "File Management",
    description: "Upload, preview, storage, sharing",
    color: "#f97316",
    startDate: "2026-02-20",
    endDate: "2026-03-15",
    progress: 90,
    status: "in_progress",
    owner: MOCK_USERS[1],
    boardName: "Backend",
  },
  {
    id: "e5",
    title: "Mobile Responsive",
    description: "Responsive design for all screens",
    color: "#ef4444",
    startDate: "2026-03-10",
    endDate: "2026-04-20",
    progress: 15,
    status: "in_progress",
    owner: MOCK_USERS[3],
    boardName: "Frontend",
  },
  {
    id: "e6",
    title: "API v2 & Documentation",
    description: "New endpoints, Swagger docs, SDK",
    color: "#6366f1",
    startDate: "2026-04-01",
    endDate: "2026-05-15",
    progress: 0,
    status: "planned",
    owner: MOCK_USERS[0],
    boardName: "Backend",
  },
  {
    id: "e7",
    title: "AI-Powered Features",
    description: "Smart suggestions, auto-assign, predictions",
    color: "#ec4899",
    startDate: "2026-04-15",
    endDate: "2026-06-30",
    progress: 0,
    status: "planned",
    owner: MOCK_USERS[4],
    boardName: "AI/ML",
  },
];

export const MOCK_MILESTONES: RoadmapMilestone[] = [
  { id: "m1", title: "Alpha Release", date: "2026-02-01", status: "reached" },
  { id: "m2", title: "Beta Launch", date: "2026-03-15", status: "upcoming" },
  {
    id: "m3",
    title: "Public Release v1.0",
    date: "2026-05-01",
    status: "upcoming",
  },
  {
    id: "m4",
    title: "10K Users Milestone",
    date: "2026-06-30",
    status: "upcoming",
  },
];

// ==================== WORKLOAD ====================
export interface MemberWorkload {
  user: User;
  totalTasks: number;
  capacityMax: number;
  tasksByPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  tasksByStatus: {
    todo: number;
    inprogress: number;
    review: number;
    done: number;
  };
  hoursEstimated: number;
  hoursLogged: number;
}

export const MOCK_WORKLOADS: MemberWorkload[] = [
  {
    user: MOCK_USERS[0],
    totalTasks: 8,
    capacityMax: 10,
    tasksByPriority: { critical: 1, high: 3, medium: 3, low: 1 },
    tasksByStatus: { todo: 2, inprogress: 3, review: 1, done: 2 },
    hoursEstimated: 42,
    hoursLogged: 28,
  },
  {
    user: MOCK_USERS[1],
    totalTasks: 6,
    capacityMax: 8,
    tasksByPriority: { critical: 0, high: 2, medium: 3, low: 1 },
    tasksByStatus: { todo: 1, inprogress: 2, review: 2, done: 1 },
    hoursEstimated: 30,
    hoursLogged: 18,
  },
  {
    user: MOCK_USERS[2],
    totalTasks: 9,
    capacityMax: 8,
    tasksByPriority: { critical: 2, high: 3, medium: 2, low: 2 },
    tasksByStatus: { todo: 3, inprogress: 3, review: 1, done: 2 },
    hoursEstimated: 48,
    hoursLogged: 30,
  },
  {
    user: MOCK_USERS[3],
    totalTasks: 4,
    capacityMax: 10,
    tasksByPriority: { critical: 0, high: 1, medium: 2, low: 1 },
    tasksByStatus: { todo: 1, inprogress: 1, review: 1, done: 1 },
    hoursEstimated: 20,
    hoursLogged: 12,
  },
  {
    user: MOCK_USERS[4],
    totalTasks: 7,
    capacityMax: 10,
    tasksByPriority: { critical: 1, high: 2, medium: 3, low: 1 },
    tasksByStatus: { todo: 2, inprogress: 2, review: 1, done: 2 },
    hoursEstimated: 36,
    hoursLogged: 24,
  },
  {
    user: MOCK_USERS[5],
    totalTasks: 3,
    capacityMax: 8,
    tasksByPriority: { critical: 0, high: 1, medium: 1, low: 1 },
    tasksByStatus: { todo: 1, inprogress: 1, review: 0, done: 1 },
    hoursEstimated: 16,
    hoursLogged: 8,
  },
];

// ==================== AUTOMATIONS ====================
export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: { type: string; label: string; value?: string };
  conditions: { field: string; operator: string; value: string }[];
  action: { type: string; label: string; value?: string };
  isEnabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
  createdBy: User;
  createdAt: string;
}

export const MOCK_AUTOMATIONS: AutomationRule[] = [
  {
    id: "auto1",
    name: "Notify on task completion",
    description: "When a task is moved to Done, notify the task creator",
    trigger: { type: "status_change", label: "Task status changes to Done" },
    conditions: [],
    action: { type: "notify", label: "Send notification to task creator" },
    isEnabled: true,
    lastTriggered: "2026-03-14T15:30:00",
    triggerCount: 47,
    createdBy: MOCK_USERS[0],
    createdAt: "2026-01-15T10:00:00",
  },
  {
    id: "auto2",
    name: "Escalate overdue tasks",
    description:
      "When a task is overdue by 2+ days, increase its priority to Critical",
    trigger: {
      type: "deadline_passed",
      label: "Task deadline passed by 2 days",
    },
    conditions: [
      { field: "priority", operator: "not_equals", value: "critical" },
    ],
    action: { type: "update_field", label: "Set priority to Critical" },
    isEnabled: true,
    lastTriggered: "2026-03-13T08:00:00",
    triggerCount: 12,
    createdBy: MOCK_USERS[0],
    createdAt: "2026-01-20T14:00:00",
  },
  {
    id: "auto3",
    name: "Auto-assign reviewer",
    description: "When task moves to Review, assign the team lead as reviewer",
    trigger: { type: "status_change", label: "Task status changes to Review" },
    conditions: [],
    action: {
      type: "assign",
      label: "Add Phan Phuoc Hiep as reviewer",
      value: "u1",
    },
    isEnabled: true,
    lastTriggered: "2026-03-14T11:00:00",
    triggerCount: 23,
    createdBy: MOCK_USERS[1],
    createdAt: "2026-02-01T09:00:00",
  },
  {
    id: "auto4",
    name: "Welcome new member",
    description:
      "When a new member joins, send them a welcome message with workspace guide",
    trigger: { type: "member_joined", label: "New member joins workspace" },
    conditions: [],
    action: {
      type: "send_message",
      label: "Send welcome message with guide link",
    },
    isEnabled: false,
    lastTriggered: "2026-03-01T10:00:00",
    triggerCount: 6,
    createdBy: MOCK_USERS[0],
    createdAt: "2026-02-10T16:00:00",
  },
  {
    id: "auto5",
    name: "Stale task reminder",
    description:
      "If a task has no updates for 5 days, send a reminder to the assignee",
    trigger: { type: "no_activity", label: "No activity for 5 days" },
    conditions: [{ field: "status", operator: "not_equals", value: "done" }],
    action: { type: "notify", label: "Send reminder to assignee" },
    isEnabled: true,
    lastTriggered: "2026-03-12T09:00:00",
    triggerCount: 31,
    createdBy: MOCK_USERS[4],
    createdAt: "2026-02-15T11:00:00",
  },
  {
    id: "auto6",
    name: "Auto-label critical bugs",
    description:
      "When priority is set to Critical, add 'Urgent' label automatically",
    trigger: { type: "field_change", label: "Priority changes to Critical" },
    conditions: [
      { field: "labels", operator: "not_contains", value: "Urgent" },
    ],
    action: { type: "add_label", label: "Add label 'Urgent'" },
    isEnabled: true,
    lastTriggered: "2026-03-10T14:20:00",
    triggerCount: 8,
    createdBy: MOCK_USERS[1],
    createdAt: "2026-02-20T10:00:00",
  },
];

// ==================== REPORTS ====================
export interface ReportData {
  completionByPeriod: { period: string; completed: number; created: number }[];
  completionByBoard: {
    board: string;
    completed: number;
    total: number;
    color: string;
  }[];
  completionByMember: {
    user: User;
    completed: number;
    total: number;
    avgDays: number;
  }[];
  overdueTrend: { week: string; count: number }[];
}

export const MOCK_REPORT_DATA: ReportData = {
  completionByPeriod: [
    { period: "Week 1 (Mar)", completed: 12, created: 15 },
    { period: "Week 2 (Mar)", completed: 18, created: 14 },
    { period: "Week 3 (Feb)", completed: 8, created: 11 },
    { period: "Week 4 (Feb)", completed: 14, created: 10 },
    { period: "Week 1 (Feb)", completed: 10, created: 13 },
    { period: "Week 2 (Jan)", completed: 16, created: 12 },
  ],
  completionByBoard: [
    { board: "Frontend", completed: 24, total: 32, color: "#3b82f6" },
    { board: "Backend", completed: 18, total: 28, color: "#10b981" },
    { board: "QA", completed: 15, total: 20, color: "#f97316" },
  ],
  completionByMember: [
    { user: MOCK_USERS[0], completed: 18, total: 22, avgDays: 3.2 },
    { user: MOCK_USERS[1], completed: 12, total: 16, avgDays: 4.1 },
    { user: MOCK_USERS[2], completed: 15, total: 18, avgDays: 2.8 },
    { user: MOCK_USERS[3], completed: 8, total: 12, avgDays: 5.0 },
    { user: MOCK_USERS[4], completed: 14, total: 17, avgDays: 3.5 },
    { user: MOCK_USERS[5], completed: 5, total: 8, avgDays: 4.5 },
  ],
  overdueTrend: [
    { week: "W1 Jan", count: 3 },
    { week: "W2 Jan", count: 5 },
    { week: "W3 Jan", count: 2 },
    { week: "W4 Jan", count: 4 },
    { week: "W1 Feb", count: 6 },
    { week: "W2 Feb", count: 3 },
    { week: "W3 Feb", count: 2 },
    { week: "W4 Feb", count: 1 },
    { week: "W1 Mar", count: 4 },
    { week: "W2 Mar", count: 2 },
  ],
};

// ==================== ACTIVITY FEED ====================
export interface ActivityFeedItem {
  id: string;
  type:
    | "task_created"
    | "task_completed"
    | "task_moved"
    | "comment_added"
    | "member_joined"
    | "board_created"
    | "file_uploaded"
    | "document_edited"
    | "label_added"
    | "sprint_started"
    | "deadline_changed";
  actor: User;
  description: string;
  target?: string;
  targetUrl?: string;
  boardName?: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export const MOCK_ACTIVITY_FEED: ActivityFeedItem[] = [
  {
    id: "af1",
    type: "task_completed",
    actor: MOCK_USERS[0],
    description: "completed task",
    target: "Implement OAuth2 login",
    boardName: "Backend",
    timestamp: "2026-03-15T14:30:00",
  },
  {
    id: "af2",
    type: "comment_added",
    actor: MOCK_USERS[1],
    description: "commented on",
    target: "Design new dashboard layout",
    boardName: "Frontend",
    timestamp: "2026-03-15T13:45:00",
  },
  {
    id: "af3",
    type: "task_moved",
    actor: MOCK_USERS[2],
    description: "moved task to Review",
    target: "File preview component",
    boardName: "Frontend",
    timestamp: "2026-03-15T12:20:00",
  },
  {
    id: "af4",
    type: "file_uploaded",
    actor: MOCK_USERS[4],
    description: "uploaded file",
    target: "architecture-diagram.pdf",
    timestamp: "2026-03-15T11:00:00",
  },
  {
    id: "af5",
    type: "task_created",
    actor: MOCK_USERS[0],
    description: "created new task",
    target: "WebSocket connection manager",
    boardName: "Backend",
    timestamp: "2026-03-15T10:15:00",
  },
  {
    id: "af6",
    type: "member_joined",
    actor: MOCK_USERS[5],
    description: "joined the workspace",
    timestamp: "2026-03-15T09:30:00",
  },
  {
    id: "af7",
    type: "sprint_started",
    actor: MOCK_USERS[0],
    description: "started",
    target: "Sprint 5",
    timestamp: "2026-03-14T09:00:00",
  },
  {
    id: "af8",
    type: "deadline_changed",
    actor: MOCK_USERS[1],
    description: "changed deadline for",
    target: "Push notification integration",
    boardName: "Backend",
    timestamp: "2026-03-14T16:00:00",
    metadata: { from: "2026-03-12", to: "2026-03-18" },
  },
  {
    id: "af9",
    type: "document_edited",
    actor: MOCK_USERS[2],
    description: "edited document",
    target: "API Documentation v2",
    timestamp: "2026-03-14T14:30:00",
  },
  {
    id: "af10",
    type: "task_completed",
    actor: MOCK_USERS[3],
    description: "completed task",
    target: "Fix navbar responsive issue",
    boardName: "Frontend",
    timestamp: "2026-03-14T13:00:00",
  },
  {
    id: "af11",
    type: "label_added",
    actor: MOCK_USERS[0],
    description: "added label 'Urgent' to",
    target: "API rate limiting middleware",
    boardName: "Backend",
    timestamp: "2026-03-14T11:30:00",
  },
  {
    id: "af12",
    type: "board_created",
    actor: MOCK_USERS[0],
    description: "created new board",
    target: "Mobile App",
    timestamp: "2026-03-13T10:00:00",
  },
  {
    id: "af13",
    type: "task_moved",
    actor: MOCK_USERS[4],
    description: "moved task to In Progress",
    target: "Storage quota management",
    boardName: "Backend",
    timestamp: "2026-03-13T15:00:00",
  },
  {
    id: "af14",
    type: "comment_added",
    actor: MOCK_USERS[3],
    description: "commented on",
    target: "Notification preferences UI",
    boardName: "Frontend",
    timestamp: "2026-03-13T14:00:00",
  },
  {
    id: "af15",
    type: "task_created",
    actor: MOCK_USERS[1],
    description: "created new task",
    target: "Write E2E tests for auth",
    boardName: "QA",
    timestamp: "2026-03-13T09:30:00",
  },
];
