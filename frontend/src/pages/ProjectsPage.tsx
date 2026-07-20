import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, Edit2, Trash2 } from "lucide-react";
import { getProjects, createProject, updateProject, deleteProject } from "@/api/portal";
import type { ProjectRead, ProjectCreate, ProjectUpdate } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { AmountDisplay } from "@/components/common/AmountDisplay";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusPill } from "@/components/common/StatusPill";
import { FilterBar } from "@/components/common/FilterBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import { ProjectDetailsDialog } from "@/features/projects/ProjectDetailsDialog";

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [activeStageTab, setActiveStageTab] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectRead | null>(null);
  const [projectToView, setProjectToView] = useState<ProjectRead | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ProjectRead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = useCallback(() => {
    setLoading(true);
    setError(null);

    const params: {
      page: number;
      page_size: number;
      search?: string;
      category?: string;
      lifecycle_stage?: string;
    } = {
      page,
      page_size: pageSize,
    };

    if (search.trim()) {
      params.search = search.trim();
    }
    if (categoryFilter !== "ALL") {
      params.category = categoryFilter;
    }
    if (activeStageTab !== "ALL") {
      params.lifecycle_stage = activeStageTab;
    }

    getProjects(params)
      .then((res) => {
        setProjects(res.data || []);
        setTotalProjects(res.meta?.total || 0);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load projects:", err);
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, pageSize, search, categoryFilter, activeStageTab]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handlers
  const handleCreateOpen = () => {
    setProjectToEdit(null);
    setIsFormOpen(true);
  };

  const handleEditOpen = (project: ProjectRead) => {
    setProjectToEdit(project);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: ProjectCreate | ProjectUpdate) => {
    if (projectToEdit) {
      await updateProject(projectToEdit.id, data as ProjectUpdate);
    } else {
      await createProject(data as ProjectCreate);
    }
    fetchProjects();
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
      fetchProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<ProjectRead>[] = [
    {
      key: "project_code",
      header: "Code",
      sortable: true,
      render: (project) => (
        <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
          {project.project_code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Project Profile",
      sortable: true,
      render: (project) => (
        <div>
          <div className="font-semibold text-slate-800 hover:text-blue-600 transition-colors">
            {project.name}
          </div>
          <div className="text-xs text-slate-400 font-medium">{project.category}</div>
        </div>
      ),
    },
    {
      key: "port_name",
      header: "Port & Location",
      render: (project) => (
        <div>
          <div className="font-medium text-slate-700">{project.port_name}</div>
          <div className="text-xs text-slate-400">{project.state}</div>
        </div>
      ),
    },
    {
      key: "estimated_cost",
      header: "Est. Cost",
      align: "right",
      render: (project) => (
        <span className="font-medium text-slate-700">
          ₹<AmountDisplay amount={project.estimated_cost} /> Cr
        </span>
      ),
    },
    {
      key: "approved_cost",
      header: "Sanctioned Cost",
      align: "right",
      render: (project) => (
        <span className="font-medium">
          {project.approved_cost ? (
            <span className="text-emerald-600">
              ₹<AmountDisplay amount={project.approved_cost} /> Cr
            </span>
          ) : (
            <span className="text-slate-300">-</span>
          )}
        </span>
      ),
    },
    {
      key: "lifecycle_stage",
      header: "Lifecycle Stage",
      render: (project) => (
        <StatusPill type="lifecycle" status={project.lifecycle_stage} size="sm" />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (project) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            onClick={() => handleEditOpen(project)}
            title="Edit Project"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
            onClick={() => setProjectToDelete(project)}
            title="Deactivate Project"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Configuration & Lifecycle"
        subtitle="Manage base port-led infrastructure project profiles, category classification, funding models, and lifecycle progression."
        breadcrumbs={[{ label: "Projects" }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-slate-200 hover:bg-slate-50 cursor-pointer"
              onClick={fetchProjects}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button className="cursor-pointer" onClick={handleCreateOpen}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPIItem
          title="Total Projects"
          value={totalProjects.toString()}
          subtitle="Registered in portal"
        />
        <KPIItem
          title="Appraisal Stage"
          value={projects.filter((p) => p.lifecycle_stage === "APPRAISAL").length.toString()}
          subtitle="Under review"
        />
        <KPIItem
          title="Sanctioned"
          value={projects.filter((p) => p.lifecycle_stage === "SANCTIONED").length.toString()}
          subtitle="Approved for release"
        />
        <KPIItem
          title="Under Execution"
          value={projects.filter((p) => p.lifecycle_stage === "UNDER_EXECUTION").length.toString()}
          subtitle="Construction phase"
        />
      </div>

      <div className="flex flex-col gap-4">
        {/* Tabs for Stage Filtering */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <Tabs
            value={activeStageTab}
            onValueChange={(val) => {
              setActiveStageTab(val);
              setPage(1);
            }}
            className="w-full max-w-2xl overflow-x-auto"
          >
            <TabsList className="bg-slate-100/60 p-1 flex gap-1 rounded-xl">
              <TabsTrigger value="ALL" className="cursor-pointer text-xs font-semibold">
                All Projects
              </TabsTrigger>
              <TabsTrigger value="INITIATION" className="cursor-pointer text-xs font-semibold">
                Initiation
              </TabsTrigger>
              <TabsTrigger value="APPRAISAL" className="cursor-pointer text-xs font-semibold">
                Appraisal
              </TabsTrigger>
              <TabsTrigger value="SANCTIONED" className="cursor-pointer text-xs font-semibold">
                Sanctioned
              </TabsTrigger>
              <TabsTrigger value="UNDER_EXECUTION" className="cursor-pointer text-xs font-semibold">
                Execution
              </TabsTrigger>
              <TabsTrigger value="COMPLETED" className="cursor-pointer text-xs font-semibold">
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Category Filter */}
          <select
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer shrink-0"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="Port Modernization">Port Modernization</option>
            <option value="Connectivity Infrastructure">Connectivity Infrastructure</option>
            <option value="Coastal Shipping">Coastal Shipping</option>
            <option value="Port-led Industrialization">Port-led Industrialization</option>
            <option value="Coastal Community Development">Coastal Community Development</option>
          </select>
        </div>

        {/* Filter / Search Bar */}
        <FilterBar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          searchPlaceholder="Search project code, name, category, state, port..."
          onClear={() => {
            setSearch("");
            setPage(1);
          }}
        />

        {/* Data Table */}
        <DataTable
          data={projects}
          columns={columns}
          getRowId={(project) => String(project.id)}
          isLoading={loading}
          error={error}
          onRetry={fetchProjects}
          emptyTitle="No projects found"
          emptySubtitle="No project records match the current filter or search criteria."
          onRowClick={(project) => setProjectToView(project)}
        />
      </div>

      {/* Guided Creation / Edit Dialog */}
      <ProjectFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        projectToEdit={projectToEdit}
        onSubmit={handleFormSubmit}
      />

      {/* Details View Dialog */}
      <ProjectDetailsDialog
        open={!!projectToView}
        onOpenChange={(open) => !open && setProjectToView(null)}
        project={projectToView}
        onEdit={(p) => handleEditOpen(p)}
        onDelete={(p) => setProjectToDelete(p)}
      />

      {/* Confirm Soft Deletion Dialog */}
      <ConfirmDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        title="Deactivate Project Record"
        description={`Are you sure you want to deactivate project "${projectToDelete?.name}" (${projectToDelete?.project_code})? This will soft-delete the project record.`}
        confirmLabel="Deactivate Project"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />

    </div>
  );
}

function KPIItem({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card className="bg-white border-0 shadow-sm rounded-xl">
      <CardContent className="p-4">
        <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <span className="text-2xl font-bold text-slate-800 mt-1 block">{value}</span>
        <span className="text-[11px] text-slate-400 mt-0.5 block">{subtitle}</span>
      </CardContent>
    </Card>
  );
}
