import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "@/api/auth";
import { NotificationsPanel } from "@/features/notifications/NotificationsPanel";

/**
 * Page shell — sidebar + topbar + content area. Every module's pages render
 * inside this, so the app looks like one product instead of four different
 * ones. Real navigation items get added here once modules exist.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white flex flex-col justify-between">
        <div>
          <div className="px-4 py-4 text-sm font-semibold text-gray-900">
            Sagarmala 2.0 Portal
          </div>
          <nav className="px-2 space-y-1 text-sm text-gray-600">
            <Link
              to="/"
              className="block rounded-md px-2 py-1.5 hover:bg-gray-100 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className="block rounded-md px-2 py-1.5 font-medium hover:bg-gray-100 hover:text-gray-900"
            >
              Projects
            </Link>
            <Link
              to="/dprs"
              className="block rounded-md px-2 py-1.5 font-medium hover:bg-gray-100 hover:text-gray-900"
            >
              DPR Approvals
            </Link>
            <Link
              to="/tasks"
              className="block rounded-md px-2 py-1.5 font-medium hover:bg-gray-100 hover:text-gray-900"
            >
              Tasks
            </Link>
            <Link
              to="/contractors"
              className="block rounded-md px-2 py-1.5 font-medium hover:bg-gray-100 hover:text-gray-900"
            >
              Contractors
            </Link>
            <Link
              to="/stakeholders"
              className="block rounded-md px-2 py-1.5 font-medium hover:bg-gray-100 hover:text-gray-900"
            >
              Stakeholders
            </Link>
            <Link
              to="/tenders"
              className="block rounded-md px-2 py-1.5 font-medium hover:bg-gray-100 hover:text-gray-900"
            >
              Tenders & Bids
            </Link>
            <Link
              to="/clearances"
              className="block rounded-md px-2 py-1.5 font-medium hover:bg-gray-100 hover:text-gray-900"
            >
              Clearances
            </Link>
            <Link
              to="/meetings"
              className="block rounded-md px-2 py-1.5 font-medium hover:bg-gray-100 hover:text-gray-900"
            >
              Meetings
            </Link>
          </nav>
        </div>

        {/* Sidebar Footer Logout Button */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full text-left rounded-md px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
          <span className="text-sm font-semibold text-gray-700">
            Sagarmala 2.0 MVP Portal
          </span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">Phase 1 & Phase 2</span>
            <NotificationsPanel />
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-gray-800 font-medium"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
