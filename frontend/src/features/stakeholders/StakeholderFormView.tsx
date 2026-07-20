import type { ReactNode } from "react";
import type { StakeholderCreate } from "../../types";

interface StakeholderFormViewProps {
  initialValues?: Partial<StakeholderCreate>;
  onSubmit: (data: StakeholderCreate) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  title: string;
}

export function StakeholderFormView({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  title,
}: StakeholderFormViewProps): ReactNode {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: StakeholderCreate = {
      project_id: Number(formData.get("project_id")),
      name: String(formData.get("name") ?? "").trim(),
      organization: String(formData.get("organization") ?? "").trim(),
      role: String(formData.get("role") ?? "").trim(),
      contact_info: String(formData.get("contact_info") ?? "").trim() || null,
    };
    onSubmit(data);
  };

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
              Project ID *
            </label>
            <input
              id="project_id"
              name="project_id"
              type="number"
              required
              defaultValue={initialValues?.project_id ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium text-gray-700"
            >
              Full Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={initialValues?.name ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="organization"
              className="block text-xs font-medium text-gray-700"
            >
              Organization *
            </label>
            <input
              id="organization"
              name="organization"
              type="text"
              required
              defaultValue={initialValues?.organization ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-xs font-medium text-gray-700"
            >
              Role *
            </label>
            <input
              id="role"
              name="role"
              type="text"
              required
              defaultValue={initialValues?.role ?? ""}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="contact_info"
              className="block text-xs font-medium text-gray-700"
            >
              Contact Info (Email / Phone)
            </label>
            <input
              id="contact_info"
              name="contact_info"
              type="text"
              defaultValue={initialValues?.contact_info ?? ""}
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
