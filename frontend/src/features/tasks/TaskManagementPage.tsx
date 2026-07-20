import { useCallback, useEffect, useState } from "react";
import type { TaskCreate, TaskListFilters, TaskRead, TaskStatus } from "@/types/task";
import { TaskForm } from "./TaskForm";
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
  updateTaskStatus,
} from "./api";

const pageSize = 10;

function formatDate(value: string | null): string {
  if (value === null) {
    return "No due date";
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function priorityClass(priority: TaskRead["priority"]): string {
  return {
    HIGH: "bg-red-50 text-red-700",
    MEDIUM: "bg-amber-50 text-amber-700",
    LOW: "bg-slate-100 text-slate-700",
  }[priority];
}

function statusClass(status: TaskStatus): string {
  return {
    TODO: "bg-slate-100 text-slate-700",
    IN_PROGRESS: "bg-sky-50 text-sky-700",
    DONE: "bg-emerald-50 text-emerald-700",
  }[status];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function TaskManagementPage() {
  const [tasks, setTasks] = useState<TaskRead[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<TaskListFilters>({});
  const [projectFilter, setProjectFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRead | null>(null);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTasks(page, pageSize, filters);
      setTasks(response.data);
      setTotal(response.meta.total);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  function openCreateForm() {
    setEditingTask(null);
    setIsFormOpen(true);
  }

  function openEditForm(task: TaskRead) {
    setEditingTask(task);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingTask(null);
  }

  async function saveTask(task: TaskCreate) {
    setIsSaving(true);
    setError(null);
    try {
      if (editingTask === null) {
        await createTask(task);
      } else {
        await updateTask(editingTask.id, task);
      }
      closeForm();
      await loadTasks();
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus(taskId: number, status: TaskStatus) {
    setError(null);
    try {
      await updateTaskStatus(taskId, status);
      await loadTasks();
    } catch (statusError) {
      setError(getErrorMessage(statusError));
    }
  }

  async function removeTask(taskId: number) {
    if (!window.confirm("Remove this task? This can be restored only from the database.")) {
      return;
    }
    setError(null);
    try {
      await deleteTask(taskId);
      await loadTasks();
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    }
  }

  function applyFilters() {
    setPage(1);
    setFilters({
      project_id: projectFilter ? Number(projectFilter) : undefined,
      assigned_to: assignedFilter ? Number(assignedFilter) : undefined,
      status: filters.status,
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-white p-6 shadow-sm sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Project delivery</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Task Management</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">Create, assign, schedule, and track every project task in one place.</p>
        </div>
        <button
          onClick={openCreateForm}
          className="rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-800"
        >
          Create task
        </button>
      </div>

      {error !== null && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isFormOpen && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">{editingTask === null ? "Create a task" : "Edit task"}</h2>
          <TaskForm task={editingTask} isSaving={isSaving} onCancel={closeForm} onSubmit={saveTask} />
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Project ID
            <input min="1" type="number" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Assigned user ID
            <input min="1" type="number" value={assignedFilter} onChange={(event) => setAssignedFilter(event.target.value)} className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            Status
            <select value={filters.status ?? ""} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value ? event.target.value as TaskStatus : undefined }))} className="rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100">
              <option value="">All statuses</option>
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="DONE">Done</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button onClick={applyFilters} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">Apply filters</button>
            <button onClick={() => { setProjectFilter(""); setAssignedFilter(""); setFilters({}); setPage(1); }} className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">Reset</button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Active tasks</h2>
          <span className="text-sm text-gray-500">{total} total</span>
        </div>
        {isLoading ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">No tasks match the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr><th className="px-5 py-3">Task</th><th className="px-5 py-3">Priority</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Due date</th><th className="px-5 py-3">Assigned</th><th className="px-5 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-sky-50/40">
                    <td className="px-5 py-4"><p className="font-semibold text-gray-900">{task.title}</p><p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">Project {task.project_id}{task.description ? ` · ${task.description}` : ""}</p></td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass(task.priority)}`}>{task.priority.replace("_", " ")}</span></td>
                    <td className="px-5 py-4"><select aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => void changeStatus(task.id, event.target.value as TaskStatus)} className={`rounded-full px-2.5 py-1 text-xs font-semibold outline-none ${statusClass(task.status)}`}><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select></td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(task.due_date)}</td>
                    <td className="px-5 py-4 text-gray-600">{task.assigned_to === null ? "Unassigned" : `User ${task.assigned_to}`}</td>
                    <td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => openEditForm(task)} className="text-sm font-medium text-sky-700 hover:text-sky-900">Edit</button><button onClick={() => void removeTask(task.id)} className="text-sm font-medium text-red-700 hover:text-red-900">Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-sm">
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button><button disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button></div>
        </div>
      </div>
    </section>
  );
}
