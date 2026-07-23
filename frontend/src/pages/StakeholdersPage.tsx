import { useEffect, useState, useMemo, useCallback } from "react";
import type { StakeholderRead, StakeholderCreate, ProjectRead } from "../types";
import {
  fetchStakeholders,
  createStakeholder,
  updateStakeholder,
  deleteStakeholder,
} from "../api/stakeholders";
import { getProjects } from "../api/projects";
import { StakeholderTableView } from "../features/stakeholders/StakeholderTableView";
import { StakeholderFormView } from "../features/stakeholders/StakeholderFormView";

export function StakeholdersPage() {
  const [stakeholders, setStakeholders] = useState<StakeholderRead[]>([]);
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] =
    useState<StakeholderRead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [stakeholdersRes, projectsRes] = await Promise.all([
        fetchStakeholders(undefined, 1, 100),
        getProjects({ page: 1, page_size: 100 }),
      ]);
      setStakeholders(stakeholdersRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load stakeholders data";
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

  // Unique organization list for filter
  const organizationsList = useMemo(() => {
    const orgs = new Set<string>();
    stakeholders.forEach((s) => {
      if (s.organization && s.organization.trim()) {
        orgs.add(s.organization.trim());
      }
    });
    return Array.from(orgs).sort();
  }, [stakeholders]);

  // Derived KPI metrics strictly from real data
  const kpis = useMemo(() => {
    const total = stakeholders.length;

    const portAuthorities = stakeholders.filter((s) => {
      const org = (s.organization || "").toLowerCase();
      const role = (s.role || "").toLowerCase();
      return (
        org.includes("port") ||
        org.includes("vpa") ||
        org.includes("dpt") ||
        org.includes("dpa") ||
        role.includes("port")
      );
    }).length;

    const ministriesAgencies = stakeholders.filter((s) => {
      const org = (s.organization || "").toLowerCase();
      const role = (s.role || "").toLowerCase();
      return (
        org.includes("ministry") ||
        org.includes("mopsw") ||
        org.includes("agency") ||
        org.includes("niti") ||
        org.includes("state") ||
        org.includes("dept") ||
        role.includes("ministry") ||
        role.includes("nodal")
      );
    }).length;

    const activeOrganizations = new Set(
      stakeholders
        .map((s) => s.organization && s.organization.trim())
        .filter(Boolean)
    ).size;

    return { total, portAuthorities, ministriesAgencies, activeOrganizations };
  }, [stakeholders]);

  // Filtered Stakeholders calculation
  const filteredStakeholders = useMemo(() => {
    return stakeholders.filter((s) => {
      const project = projectMap[s.project_id];

      // Search matching name, organization, role, contact info, project code, or project name
      if (search.trim()) {
        const query = search.toLowerCase();
        const nameMatch = s.name.toLowerCase().includes(query);
        const orgMatch = s.organization.toLowerCase().includes(query);
        const roleMatch = s.role.toLowerCase().includes(query);
        const contactMatch = (s.contact_info || "").toLowerCase().includes(query);
        const codeMatch = project?.project_code.toLowerCase().includes(query);
        const projNameMatch = project?.name.toLowerCase().includes(query);

        if (
          !nameMatch &&
          !orgMatch &&
          !roleMatch &&
          !contactMatch &&
          !codeMatch &&
          !projNameMatch
        ) {
          return false;
        }
      }

      // Organization filter
      if (orgFilter !== "ALL") {
        if (s.organization.trim() !== orgFilter) {
          return false;
        }
      }

      // Project filter
      if (projectFilter !== "ALL") {
        if (s.project_id !== Number(projectFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [stakeholders, search, orgFilter, projectFilter, projectMap]);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Stakeholder Directory
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage external port authorities, ministries, and agency stakeholders.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateClick}
          className="rounded-md bg-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          + Add Stakeholder
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Stakeholders
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{kpis.total}</p>
          <p className="mt-1 text-[11px] text-gray-400">All registered contacts</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Port Authorities
          </p>
          <p className="mt-2 text-2xl font-bold text-sky-700">
            {kpis.portAuthorities}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">Port authority reps</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Ministries / Agencies
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {kpis.ministriesAgencies}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">Government & bodies</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Active Organizations
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {kpis.activeOrganizations}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">Unique partner orgs</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search name, org, role, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:w-64"
          />

          {/* Organization Filter */}
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="ALL">All Organizations</option>
            {organizationsList.map((org) => (
              <option key={org} value={org}>
                {org}
              </option>
            ))}
          </select>

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
        </div>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setOrgFilter("ALL");
            setProjectFilter("ALL");
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

      {/* Stakeholders Table */}
      <StakeholderTableView
        stakeholders={filteredStakeholders}
        projectMap={projectMap}
        isLoading={isLoading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {/* Modal Dialog Form */}
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
