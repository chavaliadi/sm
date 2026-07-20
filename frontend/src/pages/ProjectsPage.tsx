import { useEffect, useState, useMemo, useCallback, type FormEvent } from "react";
import { getProjects, createProject, updateProject, deleteProject } from "@/api/projects";
import type { ProjectRead, ProjectCreate, ProjectUpdate } from "@/types";

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stageFilter, setStageFilter] = useState("ALL");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form inputs
  const [projectCode, setProjectCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Port Modernization");
  const [state, setState] = useState("Andhra Pradesh");
  const [portName, setPortName] = useState("Visakhapatnam Port");
  const [stakeholderInfo, setStakeholderInfo] = useState("");
  const [fundingModel, setFundingModel] = useState("Grant-in-aid");
  const [estimatedCost, setEstimatedCost] = useState<number | "">(100);
  const [approvedCost, setApprovedCost] = useState<number | "">("");
  const [lifecycleStage, setLifecycleStage] = useState("INITIATION");

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: 1, page_size: 100 };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter !== "ALL") params.category = categoryFilter;
      if (stageFilter !== "ALL") params.lifecycle_stage = stageFilter;

      const res = await getProjects(params);
      setProjects(res.data || []);
    } catch (err: any) {
      console.error("Failed to load projects:", err);
      setError(
        err.response?.data?.error?.message ||
          (err instanceof Error ? err.message : "Failed to load projects. Ensure backend is running.")
      );
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, stageFilter]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  // KPI Computations
  const kpis = useMemo(() => {
    const total = projects.length;
    const initiation = projects.filter((p) => p.lifecycle_stage === "INITIATION").length;
    const appraisal = projects.filter(
      (p) =>
        p.lifecycle_stage === "APPRAISAL" ||
        p.lifecycle_stage === "APPRAISAL_AND_SANCTION"
    ).length;
    const sanctioned = projects.filter((p) => p.lifecycle_stage === "SANCTIONED").length;
    const execution = projects.filter((p) => p.lifecycle_stage === "UNDER_EXECUTION").length;
    const completed = projects.filter((p) => p.lifecycle_stage === "COMPLETED").length;

    return { total, initiation, appraisal, sanctioned, execution, completed };
  }, [projects]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setProjectCode(`PROJ-${Math.floor(100 + Math.random() * 900)}`);
    setName("");
    setCategory("Port Modernization");
    setState("Andhra Pradesh");
    setPortName("Visakhapatnam Port");
    setStakeholderInfo("");
    setFundingModel("Grant-in-aid");
    setEstimatedCost(100);
    setApprovedCost("");
    setLifecycleStage("INITIATION");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: ProjectRead) => {
    setEditingProject(project);
    setProjectCode(project.project_code);
    setName(project.name);
    setCategory(project.category);
    setState(project.state);
    setPortName(project.port_name);
    setStakeholderInfo(project.stakeholder_info || "");
    setFundingModel(project.funding_model);
    setEstimatedCost(project.estimated_cost);
    setApprovedCost(project.approved_cost ?? "");
    setLifecycleStage(project.lifecycle_stage);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, projectCodeStr: string) => {
    if (!window.confirm(`Are you sure you want to soft-delete project ${projectCodeStr}?`)) {
      return;
    }
    try {
      await deleteProject(id);
      await loadProjects();
    } catch (err: any) {
      alert(
        err.response?.data?.error?.message ||
          (err instanceof Error ? err.message : "Failed to delete project")
      );
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectCode.trim() || !name.trim() || !category || !state || !portName || estimatedCost === "") {
      setFormError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: ProjectCreate = {
      project_code: projectCode.trim(),
      name: name.trim(),
      category,
      state,
      port_name: portName.trim(),
      stakeholder_info: stakeholderInfo.trim() || null,
      funding_model: fundingModel,
      estimated_cost: Number(estimatedCost),
      approved_cost: approvedCost !== "" ? Number(approvedCost) : null,
      lifecycle_stage: lifecycleStage,
    };

    try {
      if (editingProject) {
        const updatePayload: ProjectUpdate = { ...payload };
        await updateProject(editingProject.id, updatePayload);
      } else {
        await createProject(payload);
      }
      setIsModalOpen(false);
      await loadProjects();
    } catch (err: any) {
      const errRes = err.response?.data?.error;
      if (errRes?.code === "DUPLICATE_PROJECT_CODE") {
        setFormError(`Project code '${projectCode}' already exists. Please use a unique project code.`);
      } else {
        setFormError(errRes?.message || (err instanceof Error ? err.message : "Failed to save project."));
      }
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
            Project Configuration & Lifecycle
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Setup port infrastructure projects, funding models, and track appraisal stages.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="rounded-md bg-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          + New Project
        </button>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Projects
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{kpis.total}</p>
          <p className="mt-1 text-[11px] text-gray-400">All registered projects</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Initiation Phase
          </p>
          <p className="mt-2 text-2xl font-bold text-sky-700">{kpis.initiation}</p>
          <p className="mt-1 text-[11px] text-gray-400">Newly proposed</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Appraisal Stage
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{kpis.appraisal}</p>
          <p className="mt-1 text-[11px] text-gray-400">Under SMFCL / Ministry review</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Execution / Sanctioned
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {kpis.sanctioned + kpis.execution + kpis.completed}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">Sanctioned or in execution</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by code, name, port..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:w-64"
          />

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Port Modernization">Port Modernization</option>
            <option value="Connectivity Infrastructure">Connectivity Infrastructure</option>
            <option value="Coastal Shipping">Coastal Shipping</option>
            <option value="Port-led Industrialization">Port-led Industrialization</option>
            <option value="Port">Port</option>
          </select>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="ALL">All Lifecycle Stages</option>
            <option value="INITIATION">Initiation</option>
            <option value="APPRAISAL_AND_SANCTION">Appraisal & Sanction</option>
            <option value="SANCTIONED">Sanctioned</option>
            <option value="UNDER_EXECUTION">Under Execution</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setCategoryFilter("ALL");
            setStageFilter("ALL");
          }}
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          Reset Filters
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <h3 className="font-semibold text-red-800">Error Loading Projects</h3>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => void loadProjects()}
            className="mt-2 rounded bg-red-700 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Projects Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-xs text-gray-500">
            Loading projects data…
          </div>
        ) : projects.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center p-6 text-center text-xs text-gray-500">
            <p className="font-semibold text-gray-700">No Projects Found</p>
            <p className="mt-1">No active projects match your query parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Project Code
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Name & Category
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Port & State
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Est. Cost (Cr)
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Stage
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-sky-800">
                      {project.project_code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{project.name}</div>
                      <div className="text-[11px] text-gray-400">{project.category}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800">{project.port_name}</div>
                      <div className="text-[11px] text-gray-400">{project.state}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      ₹{project.estimated_cost.toLocaleString("en-IN")} Cr
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          project.lifecycle_stage === "INITIATION"
                            ? "bg-sky-100 text-sky-800"
                            : project.lifecycle_stage.includes("APPRAISAL")
                            ? "bg-amber-100 text-amber-800"
                            : project.lifecycle_stage === "SANCTIONED"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {project.lifecycle_stage}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(project)}
                        className="mr-2 text-xs font-semibold text-sky-700 hover:text-sky-900"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(project.id, project.project_code)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              {editingProject ? "Edit Project Configuration" : "Create New Project"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Enter project profile details, port authority mapping, and financial estimates.
            </p>

            {/* Form Error Banner */}
            {formError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">
                    Project Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value)}
                    placeholder="PROJ-2026-001"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Port Modernization">Port Modernization</option>
                    <option value="Connectivity Infrastructure">Connectivity Infrastructure</option>
                    <option value="Coastal Shipping">Coastal Shipping</option>
                    <option value="Port-led Industrialization">Port-led Industrialization</option>
                    <option value="Port">Port</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Visakhapatnam Port Container Terminal Expansion"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Andhra Pradesh"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">
                    Port Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={portName}
                    onChange={(e) => setPortName(e.target.value)}
                    placeholder="Visakhapatnam Port"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">
                    Funding Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={fundingModel}
                    onChange={(e) => setFundingModel(e.target.value)}
                    placeholder="Grant-in-aid / PPP"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">
                    Lifecycle Stage *
                  </label>
                  <select
                    value={lifecycleStage}
                    onChange={(e) => setLifecycleStage(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="INITIATION">Initiation</option>
                    <option value="APPRAISAL_AND_SANCTION">Appraisal & Sanction</option>
                    <option value="SANCTIONED">Sanctioned</option>
                    <option value="UNDER_EXECUTION">Under Execution</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">
                    Estimated Cost (₹ Cr) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={estimatedCost}
                    onChange={(e) =>
                      setEstimatedCost(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="120.5"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-700">
                    Approved Sanction Cost (₹ Cr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={approvedCost}
                    onChange={(e) =>
                      setApprovedCost(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder="Optional"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700">
                  Stakeholder Notes / Contact Info
                </label>
                <textarea
                  rows={2}
                  value={stakeholderInfo}
                  onChange={(e) => setStakeholderInfo(e.target.value)}
                  placeholder="e.g. Chief Engineer S. K. Murthy"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-sky-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving…" : editingProject ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
