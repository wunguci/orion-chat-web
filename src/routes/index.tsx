/*eslint-disable*/
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "../types/routes.types";

// Root Layout
import { RootLayout } from "../components/layout/RootLayout";

// Layouts
import { MainLayout } from "../components/layout/MainLayout";
import { AuthLayout } from "../components/layout/AuthLayout";
import { ChatLayout } from "../components/layout/ChatLayout";

// Pages
import { ChatPage } from "../pages/chat/ChatPageWithConversationService";
import { NotFoundPage } from "../pages/notFound/NotFoundPage";
import GroupChat from "../components/layout/GroupChat";
import VideoCallPage from "../pages/video-call/VideoCallPage";
import TestVideoCallPage from "../pages/video-call/TestVideoCallPage";
import GroupCallPage from "../pages/video-call/GroupCallPage";
import NotesPage from "../pages/note/NotesPage";
import FriendPage from "../pages/contacts/ContactPage";
import FriendListPage from "../pages/friend/FriendListPage";
import AIChatPage from "../pages/ai-chat/AIChatPage";
import CalendarPage from "../pages/calendar/CalendarPage";
import WorkHubLayout from "../components/layout/WorkHubLayout";
import WorkHubPage from "../pages/work-hub/home/WorkHubPage";
import CreateWorkHub from "../pages/work-hub/create/CreateWorkHub";
import BoardPage from "../pages/work-hub/boards/BoardPage";
import MembersPage from "../pages/work-hub/members/MembersPage";
import WorkspaceSettingsPage from "../pages/work-hub/settings/WorkspaceSettingsPage";
import AIInsightsPage from "../pages/work-hub/insights/AIInsightsPage";
import DocumentsPage from "../pages/work-hub/documents/DocumentsPage";
import DocumentEditorPage from "../pages/work-hub/documents/DocumentEditorPage";
import FilesPage from "../pages/work-hub/files/FilesPage";
import ChannelsPage from "../pages/work-hub/channels/ChannelsPage";
import DirectMessagesPage from "../pages/work-hub/messages/DirectMessagesPage";
import WorkHubIntroPage from "../pages/work-hub/intro/WorkHubIntroPage";
import RegisterPage from "../pages/auth/RegisterPage";
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import GoalsOKRsPage from "../pages/work-hub/goals/GoalsOKRsPage";
import SprintPlanningPage from "../pages/work-hub/sprints/SprintPlanningPage";
import RoadmapPage from "../pages/work-hub/roadmap/RoadmapPage";
import WorkloadPage from "../pages/work-hub/workload/WorkloadPage";
import AutomationsPage from "../pages/work-hub/automations/AutomationsPage";
import ReportsExportPage from "../pages/work-hub/reports/ReportsExportPage";
import LabelsManagementPage from "../pages/work-hub/labels/LabelsManagementPage";
import ActivityFeedPage from "../pages/work-hub/activity/ActivityFeedPage";
import JoinWorkspaceByLinkPage from "../pages/work-hub/join/JoinWorkspaceByLinkPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Navigate to={ROUTES.AUTH.LOGIN} replace />,
      },
      {
        path: ROUTES.AUTH.ROOT,
        element: <AuthLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={ROUTES.AUTH.LOGIN} replace />,
          },
          {
            path: ROUTES.AUTH.LOGIN,
            element: <LoginPage />,
          },
          {
            path: ROUTES.AUTH.REGISTER,
            element: <RegisterPage />,
          },
          {
            path: ROUTES.AUTH.FORGOT_PASSWORD,
            element: <ForgotPasswordPage />,
          },
        ],
      },
      {
        path: ROUTES.HOME,
        element: <MainLayout />,
        children: [
          {
            path: ROUTES.CHAT.ROOT,
            element: <ChatLayout />,

            children: [
              {
                index: true,
                element: <ChatPage />,
              },
            ],
          },
          {
            path: ROUTES.CHAT.GROUP,
            element: <ChatLayout />,
            children: [
              {
                index: true,
                element: <GroupChat />,
              },
            ],
          },
          {
            path: ROUTES.CHAT.CONTACTS,
            element: <FriendPage />,
          },
          {
            path: ROUTES.NOTE,
            element: <NotesPage />,
          },
          {
            path: ROUTES.FRIENDS,
            element: <FriendListPage />,
          },
          {
            path: ROUTES.AICHAT,
            element: <AIChatPage />,
          },
          {
            path: ROUTES.CALENDAR,
            element: <CalendarPage />,
          },
          {
            path: ROUTES.NOT_FOUND,
            element: <NotFoundPage />,
          },
          {
            path: "/video-call/*",
            element: <VideoCallPage />,
          },
          {
            path: "/group-call/*",
            element: <GroupCallPage />,
          },
          {
            path: ROUTES.WORK_HUB.ROOT,
            element: <WorkHubIntroPage />,
          },
          {
            path: "/work-hub/create",
            element: <CreateWorkHub />,
          },
          {
            path: "/work-hub/join",
            element: <JoinWorkspaceByLinkPage />,
          },
          {
            path: "/test-video-call",
            element: <TestVideoCallPage />,
          },
          {
            path: ROUTES.NOT_FOUND,
            element: <NotFoundPage />,
          },
        ],
      },

      {
        path: "/work-hub/:workspaceId",
        element: <WorkHubLayout />,
        children: [
          {
            index: true,
            element: <WorkHubPage />,
          },
          {
            path: "boards/:boardId",
            element: <BoardPage />,
          },
          {
            path: "members",
            element: <MembersPage />,
          },
          {
            path: "settings",
            element: <WorkspaceSettingsPage />,
          },
          {
            path: "insights",
            element: <AIInsightsPage />,
          },
          {
            path: "documents",
            element: <DocumentsPage />,
          },
          {
            path: "documents/:documentId",
            element: <DocumentEditorPage />,
          },
          {
            path: "files",
            element: <FilesPage />,
          },
          // Channels & DirectMessages tạm:(( bỏ khỏi WorkHub
          // {
          //   path: "channels",
          //   element: <ChannelsPage />,
          // },
          // {
          //   path: "messages",
          //   element: <DirectMessagesPage />,
          // },
          {
            path: "goals",
            element: <GoalsOKRsPage />,
          },
          {
            path: "sprints",
            element: <SprintPlanningPage />,
          },
          {
            path: "roadmap",
            element: <RoadmapPage />,
          },
          {
            path: "workload",
            element: <WorkloadPage />,
          },
          {
            path: "automations",
            element: <AutomationsPage />,
          },
          {
            path: "reports",
            element: <ReportsExportPage />,
          },
          {
            path: "labels",
            element: <LabelsManagementPage />,
          },
          {
            path: "activity",
            element: <ActivityFeedPage />,
          },
        ],
      },
    ],
  },
]);
