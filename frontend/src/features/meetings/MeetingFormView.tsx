import { useState, useEffect, type ReactNode } from "react";
import type { MeetingCreate, ProjectRead } from "@/types";
import { ProjectSelect } from "@/components/ProjectSelect";

interface MeetingFormViewProps {
  initialValues?: Partial<MeetingCreate>;
  projects: ProjectRead[];
  onSubmit: (data: MeetingCreate) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  title: string;
}

export function MeetingFormView({
  initialValues,
  projects,
  onSubmit,
  onCancel,
  isSubmitting = false,
  title,
}: MeetingFormViewProps): ReactNode {
  const [projectId, setProjectId] = useState<number>(
    initialValues?.project_id || projects[0]?.id || 0
  );
  const [meetingTitle, setMeetingTitle] = useState(initialValues?.title || "");
  const [date, setDate] = useState(
    initialValues?.date
      ? new Date(initialValues.date).toISOString().slice(0, 16)
      : ""
  );
  const [notes, setNotes] = useState(initialValues?.notes || "");

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data: MeetingCreate = {
      project_id: Number(projectId),
      title: meetingTitle.trim(),
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      notes: notes.trim() || null,
    };
    onSubmit(data);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Record meeting agenda, participant decisions, and project timelines.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="project_id"
              className="block text-xs font-medium text-gray-700"
            >
              Associated Project *
            </label>
            <div className="mt-1">
              <ProjectSelect
                projects={projects}
                value={projectId}
                onChange={setProjectId}
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-xs font-medium text-gray-700"
            >
              Meeting Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="e.g. Stakeholder DPR Review Session"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label
              htmlFor="date"
              className="block text-xs font-medium text-gray-700"
            >
              Date & Time *
            </label>
            <input
              id="date"
              name="date"
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-xs font-medium text-gray-700"
            >
              Minutes of Meeting / Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter meeting summary, decisions, and action items..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-sky-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Meeting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
