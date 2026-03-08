import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from '../types/routes.types';

// Layouts
import { MainLayout } from '../components/layout/MainLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ChatLayout } from '../components/layout/ChatLayout';

// Pages
import { ChatPage } from '../pages/chat/ChatPage';
import { NotFoundPage } from '../pages/notFound/NotFoundPage';
import GroupChat from '../components/layout/GroupChat';
import VideoCallPage from '../pages/video-call/VideoCallPage';
import NotesPage from '../pages/note/NotesPage';
import FriendPage from '../pages/contacts/ContactPage';
import FriendListPage from '../pages/friend/FriendListPage';
import AIChatPage from '../pages/ai-chat/AIChatPage';
import CalendarPage from '../pages/calendar/CalendarPage';
import WorkHubLayout from '../components/layout/WorkHubLayout';
import WorkHubPage from '../pages/work-hub/home/WorkHubPage';
import CreateWorkHub from '../pages/work-hub/create/CreateWorkHub';
import BoardPage from '../pages/work-hub/boards/BoardPage';
import MembersPage from '../pages/work-hub/members/MembersPage';
import WorkspaceSettingsPage from '../pages/work-hub/settings/WorkspaceSettingsPage';
import AIInsightsPage from '../pages/work-hub/insights/AIInsightsPage';
import DocumentsPage from '../pages/work-hub/documents/DocumentsPage';
import DocumentEditorPage from '../pages/work-hub/documents/DocumentEditorPage';
import FilesPage from '../pages/work-hub/files/FilesPage';
import ChannelsPage from '../pages/work-hub/channels/ChannelsPage';
import DirectMessagesPage from '../pages/work-hub/messages/DirectMessagesPage';
import RegisterPage from '../pages/auth/RegisterPage';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

export const router = createBrowserRouter([
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
                path: '/video-call/*',
                element: <VideoCallPage />,
            },
            {
                path: '/work-hub/create',
                element: <CreateWorkHub />,
            },
            {
                path: '/work-hub/:workspaceId',
                element: <WorkHubLayout />,
                children: [
                    {
                        index: true,
                        element: <WorkHubPage />,
                    },
                    {
                        path: 'boards/:boardId',
                        element: <BoardPage />,
                    },
                    {
                        path: 'members',
                        element: <MembersPage />,
                    },
                    {
                        path: 'settings',
                        element: <WorkspaceSettingsPage />,
                    },
                    {
                        path: 'insights',
                        element: <AIInsightsPage />,
                    },
                    {
                        path: 'documents',
                        element: <DocumentsPage />,
                    },
                    {
                        path: 'documents/:documentId',
                        element: <DocumentEditorPage />,
                    },
                    {
                        path: 'files',
                        element: <FilesPage />,
                    },
                    {
                        path: 'channels',
                        element: <ChannelsPage />,
                    },
                    {
                        path: 'messages',
                        element: <DirectMessagesPage />,
                    },
                ],
            },
            {
                path: ROUTES.NOT_FOUND,
                element: <NotFoundPage />,
            },
        ],
    },
]);
