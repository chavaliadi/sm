import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { HomePage } from "@/pages/HomePage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { DprsPage } from "@/pages/DprsPage";
import { TasksPage } from "@/pages/TasksPage";
import { StakeholdersPage } from "@/pages/StakeholdersPage";
import { MeetingsPage } from "@/pages/MeetingsPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";

/**
 * Route table — one place to see every page in the app. As modules land,
 * add routes here rather than nesting <Routes> in multiple files.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <HomePage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/projects",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <ProjectsPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/dprs",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <DprsPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/tasks",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <TasksPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/stakeholders",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <StakeholdersPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/meetings",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <MeetingsPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
]);
