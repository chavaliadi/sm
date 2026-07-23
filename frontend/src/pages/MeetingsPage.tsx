import { useEffect, useState, useMemo, useCallback } from "react";
import type { MeetingRead, MeetingCreate, ProjectRead } from "../types";
import {
  fetchMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from "../api/meetings";
import { getProjects } from "../api/projects";
import { MeetingTableView } from "../features/meetings/MeetingTableView";
import { MeetingFormView } from "../features/meetings/MeetingFormView";
import { MeetingViewModal } from "../features/meetings/MeetingViewModal";

export function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingRead[]>([]);
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingRead | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<MeetingRead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [meetingsRes, projectsRes] = await Promise.all([
        fetchMeetings(undefined, 1, 100),
        getProjects({ page: 1, page_size: 100 }),
      ]);
      setMeetings(meetingsRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load meetings data";
      setError(msg);
    } fontally: {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Project lookup map
  const projectMap = useMemo(() => {
    const map: Record<number, ProjectRead> = {};
    projects.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [projects]);

  // Derived KPI metrics
  const kpis = useMemo(() => {
    const total = meetings.length;
    const now = new Date();

    const meetingsThisMonth = meetings.filter((m) => {
      if (!m.date) return false;
      const d = new Date(m.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;

    const upcoming = meetings.filter((m) => {
      if (!m.date) return false;
      return new Date(m.date) > now;
    }).length;

    const withMinutes = meetings.filter(
      (m) => m.notes && m.notes.trim().length > 0
    ).length;

    return { total, meetingsThisMonth, upcoming, withMinutes };
  }, [meetings]);

  // Filtered Meetings calculation
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const project = projectMap[m.project_id];

      // Search matching title, notes, project code, or project name
      if (search.trim()) {
        const query = search.toLowerCase();
        const titleMatch = m.title.toLowerCase().includes(query);
        const notesMatch = (m.notes || "").toLowerCase().includes(query);
        const codeMatch = project?.project_code.toLowerCase().includes(query);
        const nameMatch = project?.name.toLowerCase().includes(query);

        if (!titleMatch && !notesMatch && !codeMatch && !nameMatch) {
          return false;
        }
      }

      // Project filter
      if (projectFilter !== "ALL") {
        if (m.project_id !== Number(projectFilter)) {
          return false;
        }
      }

      // Date filter
      if (dateFilter !== "ALL" && m.date) {
        const meetingDate = new Date(m.date);
        const now = new Date();

        if (dateFilter === "TODAY") {
          const isToday =
            meetingDate.getDate() === now.getDate() &&
            meetingDate.getMonth() === now.getMonth() &&
            meetingDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateFilter === "THIS_WEEK") {
          const diffDays =
            (now.getTime() - meetingDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays < 0 || diffDays > 7) return false;
        } else if (dateFilter === "THIS_MONTH") {
          const isSameMonth =
            meetingDate.getMonth() === now.getMonth() &&
            meetingDate.getFullYear() === now.getFullYear();
          if (!isSameMonth) return false;
        } else if (dateFilter === "PAST_30_DAYS") {
          const diffDays =
            (now.getTime() - meetingDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays < 0 || diffDays > 30) return false;
        }
      }

      return true;
    });
  }, [meetings, search, projectFilter, dateFilter, projectMap]);

  const handleCreateClick = () => {
    setEditingMeeting(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (meeting: MeetingRead) => {
    setEditingMeeting(meeting);
    setIsFormModalOpen(true);
  };

  const handleViewClick = (meeting: MeetingRead) => {
    setViewingMeeting(meeting);
  };

  const handleDeleteClick = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this meeting record?")) {
      return;
    }
    try {
      await deleteMeeting(id);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete meeting");
    }
  };

  const handleFormSubmit = async (data: MeetingCreate) => {
    try {
      setIsSubmitting(true);
      if (editingMeeting) {
        await updateMeeting(editingMeeting.id, data);
      } else {
        await createMeeting(data);
      }
      setIsFormModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Meeting Minutes Logger
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Log and review project meeting notes, timelines, and decision summaries.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateClick}
          className="rounded-md bg-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          + Log Meeting
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Meetings
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{kpis.total}</p>
          <p className="mt-1 text-[11px] text-gray-400">All logged meetings</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Meetings This Month
          </p>
          <p className="mt-2 text-2xl font-bold text-sky-700">
            {kpis.meetingsThisMonth}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">Current calendar month</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Upcoming Meetings
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {kpis.upcoming}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">Scheduled future sessions</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Meetings with Minutes
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {kpis.withMinutes}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">Documented notes & MoMs</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search title, notes, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:w-64"
          />

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_code} – {p.name}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="PAST_30_DAYS">Past 30 Days</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setProjectFilter("ALL");
            setDateFilter("ALL");
          }}
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          Reset Filters
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <p className="font-semibold">Error Loading Data</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* Meetings Table */}
      <MeetingTableView
        meetings={filteredMeetings}
        projectMap={projectMap}
        isLoading={isLoading}
        onView={handleViewClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {/* View MoM Modal */}
      {viewingMeeting && (
        <MeetingViewModal
          meeting={viewingMeeting}
          project={projectMap[viewingMeeting.project_id]}
          onClose={() => setViewingMeeting(null)}
        />
      )}

      {/* Create / Edit Form Modal */}
      {isFormModalOpen && (
        <MeetingFormView
          title={editingMeeting ? "Edit Meeting Notes" : "Log New Meeting"}
          initialValues={editingMeeting ?? undefined}
          projects={projects}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
