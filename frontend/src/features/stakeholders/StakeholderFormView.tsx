import { useState, useEffect, type ReactNode } from "react";
import type { StakeholderCreate, ProjectRead } from "@/types";
import { ProjectSelect } from "@/components/ProjectSelect";

interface StakeholderFormViewProps {
  initialValues?: Partial<StakeholderCreate>;
  projects: ProjectRead[];
  onSubmit: (data: StakeholderCreate) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  title: string;
}

export function StakeholderFormView({
  initialValues,
  projects,
  onSubmit,
  onCancel,
  isSubmitting = false,
  title,
}: StakeholderFormViewProps): ReactNode {
  const [projectId, setProjectId] = useState<number>(
    initialValues?.project_id || projects[0]?.id || 0
  );
  const [name, setName] = useState(initialValues?.name || "");
  const [organization, setOrganization] = useState(
    initialValues?.organization || ""
  );
  const [role, setRole] = useState(initialValues?.role || "");
  const [contactInfo, setContactInfo] = useState(
    initialValues?.contact_info || ""
  );

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
    const data: StakeholderCreate = {
      project_id: Number(projectId),
      name: name.trim(),
      organization: organization.trim(),
      role: role.trim(),
      contact_info: contactInfo.trim() || null,
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
          Register port authorities, ministry contacts, and agency representatives.
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Visakhapatnam Port Authority / MoPSW"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-xs font-medium text-gray-700"
            >
              Role / Designation *
            </label>
            <input
              id="role"
              name="role"
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Chief Engineer / Nodal Officer"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="e.g. r.sharma@vpa.gov.in"
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
              {isSubmitting ? "Saving..." : "Save Stakeholder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
