import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * Page shell — sidebar + topbar + content area. Every module's pages render
 * inside this, so the app looks like one product instead of four different
 * ones. Real navigation items get added here once modules exist.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white">
        <div className="px-4 py-4 text-sm font-semibold text-gray-900">
          Sagarmala 2.0 Portal
        </div>
        <nav className="px-2 text-sm text-gray-500">
          <div className="rounded-md px-2 py-1.5">Dashboard</div>
          <div className="rounded-md px-2 py-1.5">Projects</div>
          <div className="rounded-md px-2 py-1.5">DPR Approvals</div>
          <Link
            to="/tasks"
            className="block rounded-md px-2 py-1.5 hover:bg-gray-100 hover:text-gray-900"
          >
            Tasks
          </Link>
          <div className="rounded-md px-2 py-1.5">Stakeholders</div>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-gray-200 bg-white px-6">
          <span className="text-sm text-gray-500">MVP Scaffold</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
