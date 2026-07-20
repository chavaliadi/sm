import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
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
      <AppLayout>
        <HomePage />
      </AppLayout>
    ),
  },
  {
    path: "/projects",
    element: (
      <AppLayout>
        <ProjectsPage />
      </AppLayout>
    ),
  },
  {
    path: "/dprs",
    element: (
      <AppLayout>
        <DprsPage />
      </AppLayout>
    ),
  },
  {
    path: "/tasks",
    element: (
      <AppLayout>
        <TasksPage />
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
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
]);
