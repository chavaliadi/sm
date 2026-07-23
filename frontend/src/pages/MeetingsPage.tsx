import { useEffect, useState } from "react";
import type { MeetingRead, MeetingCreate, ProjectRead } from "../types";
import { getProjects } from "../api/projects";
import {
  fetchMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from "../api/meetings";
import { MeetingTableView } from "../features/meetings/MeetingTableView";
import { MeetingFormView } from "../features/meetings/MeetingFormView";

export function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingRead[]>([]);
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingRead | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [res, projectResponse] = await Promise.all([
        fetchMeetings(),
        getProjects({ page_size: 100 }),
      ]);
      setMeetings(res.data);
      setProjects(projectResponse.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load meetings";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClick = () => {
    setEditingMeeting(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (meeting: MeetingRead) => {
    setEditingMeeting(meeting);
    setIsModalOpen(true);
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
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save meeting");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Meeting Minutes Logger
          </h1>
          <p className="text-xs text-gray-500">
            Log and review project meeting notes, timelines, and decision summaries.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateClick}
          className="rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          + Log Meeting
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          {error}
        </div>
      )}

      <MeetingTableView
        meetings={meetings}
        projects={projects}
        isLoading={isLoading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {isModalOpen && (
        <MeetingFormView
          title={editingMeeting ? "Edit Meeting Notes" : "Log New Meeting"}
          initialValues={editingMeeting ?? undefined}
          projects={projects}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
