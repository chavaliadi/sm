import { useEffect, useState } from "react";
import type { ProjectRead, StakeholderRead, StakeholderCreate } from "../types";
import { getProjects } from "../api/projects";
import {
  fetchStakeholders,
  createStakeholder,
  updateStakeholder,
  deleteStakeholder,
} from "../api/stakeholders";
import { StakeholderTableView } from "../features/stakeholders/StakeholderTableView";
import { StakeholderFormView } from "../features/stakeholders/StakeholderFormView";

export function StakeholdersPage() {
  const [stakeholders, setStakeholders] = useState<StakeholderRead[]>([]);
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] =
    useState<StakeholderRead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [res, projectResponse] = await Promise.all([
        fetchStakeholders(),
        getProjects({ page_size: 100 }),
      ]);
      setStakeholders(res.data);
      setProjects(projectResponse.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load stakeholders";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClick = () => {
    setEditingStakeholder(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (stakeholder: StakeholderRead) => {
    setEditingStakeholder(stakeholder);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this stakeholder?")) {
      return;
    }
    try {
      await deleteStakeholder(id);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete stakeholder");
    }
  };

  const handleFormSubmit = async (data: StakeholderCreate) => {
    try {
      setIsSubmitting(true);
      if (editingStakeholder) {
        await updateStakeholder(editingStakeholder.id, data);
      } else {
        await createStakeholder(data);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save stakeholder");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Stakeholder Directory
          </h1>
          <p className="text-xs text-gray-500">
            Manage external port authorities, ministries, and agency stakeholders.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateClick}
          className="rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          + Add Stakeholder
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          {error}
        </div>
      )}

      <StakeholderTableView
        stakeholders={stakeholders}
        projects={projects}
        isLoading={isLoading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {isModalOpen && (
        <StakeholderFormView
          title={editingStakeholder ? "Edit Stakeholder" : "Add Stakeholder"}
          initialValues={editingStakeholder ?? undefined}
          projects={projects}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
