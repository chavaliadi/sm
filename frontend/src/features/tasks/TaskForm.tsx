import { useEffect, useState } from "react";
import type { TaskCreate, TaskPriority, TaskRead, TaskStatus } from "@/types/task";

interface TaskFormProps {
  task: TaskRead | null;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (task: TaskCreate) => Promise<void>;
}

interface TaskFormValues {
  projectId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  dueDate: string;
  evidenceUrl: string;
}

const emptyValues: TaskFormValues = {
  projectId: "",
  title: "",
  description: "",
  priority: "MEDIUM",
  status: "TODO",
  assignedTo: "",
  dueDate: "",
  evidenceUrl: "",
};

function toFormValues(task: TaskRead | null): TaskFormValues {
  if (task === null) {
    return emptyValues;
  }

  return {
    projectId: String(task.project_id),
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    status: task.status,
    assignedTo: task.assigned_to === null ? "" : String(task.assigned_to),
    dueDate: task.due_date?.slice(0, 16) ?? "",
    evidenceUrl: task.evidence_url ?? "",
  };
}

export function TaskForm({ task, isSaving, onCancel, onSubmit }: TaskFormProps) {
  const [values, setValues] = useState<TaskFormValues>(() => toFormValues(task));

  useEffect(() => {
    setValues(toFormValues(task));
  }, [task]);

  function setValue<Key extends keyof TaskFormValues>(
    key: Key,
    value: TaskFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      project_id: Number(values.projectId),
      title: values.title.trim(),
      description: values.description.trim() || null,
      priority: values.priority,
      status: values.status,
      assigned_to: values.assignedTo ? Number(values.assignedTo) : null,
      due_date: values.dueDate || null,
      evidence_url: values.evidenceUrl.trim() || null,
      is_active: true,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Project ID
          <input
            required
            min="1"
            type="number"
            value={values.projectId}
            onChange={(event) => setValue("projectId", event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Assigned user ID
          <input
            min="1"
            type="number"
            value={values.assignedTo}
            onChange={(event) => setValue("assignedTo", event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-medium text-gray-700">
        Task title
        <input
          required
          value={values.title}
          onChange={(event) => setValue("title", event.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <label className="grid gap-1.5 text-sm font-medium text-gray-700">
        Description
        <textarea
          rows={3}
          value={values.description}
          onChange={(event) => setValue("description", event.target.value)}
          className="resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Priority
          <select
            value={values.priority}
            onChange={(event) => setValue("priority", event.target.value as TaskPriority)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Status
          <select
            value={values.status}
            onChange={(event) => setValue("status", event.target.value as TaskStatus)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          >
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Due date
          <input
            type="datetime-local"
            value={values.dueDate}
            onChange={(event) => setValue("dueDate", event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
        </label>
      </div>

      {task !== null && (
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Evidence URL
          <input
            type="url"
            value={values.evidenceUrl}
            onChange={(event) => setValue("evidenceUrl", event.target.value)}
            placeholder="https://example.com/proof-of-completion"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
          <span className="text-xs font-normal text-gray-500">
            Required before a task can be marked as done.
          </span>
        </label>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          disabled={isSaving}
          type="submit"
          className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : task === null ? "Create task" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
