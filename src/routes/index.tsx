import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "../types/routes.types";

// Layouts
import { MainLayout } from "../components/layout/MainLayout";
import { AuthLayout } from "../components/layout/AuthLayout";
import { ChatLayout } from "../components/layout/ChatLayout";

// Pages
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { ChatPage } from "../pages/chat/ChatPage";
import { NotFoundPage } from "../pages/notFound/NotFoundPage";
import WorkHubLayout from "../components/layout/WorkHubLayout";
import WorkHubPage from "../pages/work-hub/home/WorkHubPage";
import TasksManagerPage from "../pages/work-hub/task/TasksManagerPage";

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <MainLayout />,
    children: [
      {
        index: true,
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
        ],
      },
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
        path: "/work-hub/*",
        element: <WorkHubLayout />,
        children: [
          {
            index: true,
            element: <WorkHubPage />,
          },
          {
            path: "tasks",
            element: <TasksManagerPage />,
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
