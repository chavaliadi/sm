import type { ReactNode } from "react";
import type { MeetingCreate, ProjectRead } from "../../types";

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
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateStr = String(formData.get("date") ?? "");
    const data: MeetingCreate = {
      project_id: Number(formData.get("project_id")),
      title: String(formData.get("title") ?? "").trim(),
      date: new Date(dateStr).toISOString(),
      notes: String(formData.get("notes") ?? "").trim() || null,
    };
    onSubmit(data);
  };

  const defaultDateFormatted = initialValues?.date
    ? new Date(initialValues.date).toISOString().slice(0, 16)
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="project_id"
              className="block text-xs font-medium text-gray-700"
            >
              Project *
            </label>
            <select
              id="project_id"
              name="project_id"
              required
              defaultValue={initialValues?.project_id ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_code} - {project.name}
                </option>
              ))}
            </select>
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
              defaultValue={initialValues?.title ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
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
              defaultValue={defaultDateFormatted}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-xs font-medium text-gray-700"
            >
              Meeting Minutes / Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={initialValues?.notes ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
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
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
