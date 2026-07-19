import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { HomePage } from "../pages/HomePage";
import { StakeholdersPage } from "../pages/StakeholdersPage";
import { MeetingsPage } from "../pages/MeetingsPage";
import { TaskManagementPage } from "../features/tasks/TaskManagementPage";

/**
 * Route table — one place to see every page in the app. As modules land,
 * add routes here rather than nesting <Routes> in multiple files.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppLayout>
        <HomePage />
      </AppLayout>
    ),
  },
  {
    path: "/tasks",
    element: (
      <AppLayout>
        <TaskManagementPage />
      </AppLayout>
    ),
  },
  {
    path: "/stakeholders",
    element: (
      <AppLayout>
        <StakeholdersPage />
      </AppLayout>
    ),
  },
  {
    path: "/meetings",
    element: (
      <AppLayout>
        <MeetingsPage />
      </AppLayout>
    ),
  },
]);

