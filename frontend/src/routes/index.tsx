import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { StakeholdersPage } from "../pages/StakeholdersPage";
import { MeetingsPage } from "../pages/MeetingsPage";
import { TaskManagementPage } from "../features/tasks/TaskManagementPage";
import { ProtectedRoute } from "../components/ProtectedRoute";

/**
 * Route table — one place to see every page in the app. Protected routes
 * require a valid access token in localStorage, redirecting to /login otherwise.
 */
export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
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
    path: "/tasks",
    element: (
      <ProtectedRoute>
        <AppLayout>
          <TaskManagementPage />
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
]);
