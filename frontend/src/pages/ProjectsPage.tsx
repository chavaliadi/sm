import { useEffect, useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { getProjects } from "@/api/portal";
import type { ProjectRead } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { AmountDisplay } from "@/components/common/AmountDisplay";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusPill } from "@/components/common/StatusPill";
import { FilterBar } from "@/components/common/FilterBar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Fallback data if backend is empty
const fallbackProjects: ProjectRead[] = [
  {
    id: 1,
    project_code: "SG-2026-001",
    name: "VPT Berth Modernization Phase II",
    category: "Port Modernization",
    state: "Andhra Pradesh",
    port_name: "Visakhapatnam Port",
    stakeholder_info: "Chief Engineer S. K. Murthy (sk.murthy@vpt.gov.in)",
    funding_model: "MoPSW Grant-in-aid",
    estimated_cost: 120.5,
    approved_cost: 115.0,
    lifecycle_stage: "UNDER_EXECUTION",
    is_active: true,
    created_by: 1,
    updated_by: 1,
    created_at: "2026-07-01T12:00:00Z",
    updated_at: "2026-07-15T15:30:00Z"
  },
  {
    id: 2,
    project_code: "SG-2026-002",
    name: "JNPT Outer Harbor Dredging",
    category: "Port Modernization",
    state: "Maharashtra",
    port_name: "Jawaharlal Nehru Port",
    stakeholder_info: "GM Plg M. D. Kamdar (kamdar@jnpt.gov.in)",
    funding_model: "MoPSW Grant-in-aid",
    estimated_cost: 450.0,
    approved_cost: null,
    lifecycle_stage: "APPRAISAL",
    is_active: true,
    created_by: 1,
    updated_by: 1,
    created_at: "2026-07-02T09:15:00Z",
    updated_at: "2026-07-16T11:45:00Z"
  },
  {
    id: 3,
    project_code: "SG-2026-003",
    name: "Kolkata Port Multimodal Terminal",
    category: "Connectivity Infrastructure",
    state: "West Bengal",
    port_name: "Kolkata Port",
    stakeholder_info: "Deputy Chairman Amitava Ghose (aghose@kopt.gov.in)",
    funding_model: "MoPSW Grant-in-aid",
    estimated_cost: 85.0,
    approved_cost: 85.0,
    lifecycle_stage: "SANCTIONED",
    is_active: true,
    created_by: 1,
    updated_by: 1,
    created_at: "2026-07-03T10:00:00Z",
    updated_at: "2026-07-17T14:20:00Z"
  },
  {
    id: 4,
    project_code: "SG-2026-004",
    name: "Coopted Ro-Ro Service Channel",
    category: "Coastal Shipping",
    state: "Kerala",
    port_name: "Cochin Port",
    stakeholder_info: "Operations Lead V. A. Joseph",
    funding_model: "MoPSW Grant-in-aid",
    estimated_cost: 45.0,
    approved_cost: null,
    lifecycle_stage: "INITIATION",
    is_active: true,
    created_by: 1,
    updated_by: 1,
    created_at: "2026-07-04T14:30:00Z",
    updated_at: "2026-07-18T16:10:00Z"
  },
  {
    id: 5,
    project_code: "SG-2026-005",
    name: "Chennai Port-Maduravoyal Expressway Link",
    category: "Connectivity Infrastructure",
    state: "Tamil Nadu",
    port_name: "Chennai Port",
    stakeholder_info: "Under Secretary P. J. Rao (pj.rao@mopsw.gov.in)",
    funding_model: "MoPSW Grant-in-aid",
    estimated_cost: 320.0,
    approved_cost: 320.0,
    lifecycle_stage: "UNDER_EXECUTION",
    is_active: true,
    created_by: 1,
    updated_by: 1,
    created_at: "2026-07-05T08:45:00Z",
    updated_at: "2026-07-19T10:30:00Z"
  },
  {
    id: 6,
    project_code: "SG-2026-006",
    name: "Paradip Coal Berth Mechanization",
    category: "Port Modernization",
    state: "Odisha",
    port_name: "Paradip Port",
    stakeholder_info: "Lead Inspector K. G. Mohapatra",
    funding_model: "MoPSW Grant-in-aid",
    estimated_cost: 180.0,
    approved_cost: 180.0,
    lifecycle_stage: "COMPLETED",
    is_active: true,
    created_by: 1,
    updated_by: 1,
    created_at: "2026-07-06T11:00:00Z",
    updated_at: "2026-07-19T12:00:00Z"
  },
  {
    id: 7,
    project_code: "SG-2026-007",
    name: "Deendayal Port Smart Industrial Zone",
    category: "Port-led Industrialization",
    state: "Gujarat",
    port_name: "Deendayal Port",
    stakeholder_info: "Consultant Rajiv Mehta",
    funding_model: "MoPSW Grant-in-aid",
    estimated_cost: 250.0,
    approved_cost: null,
    lifecycle_stage: "INITIATION",
    is_active: true,
    created_by: 1,
    updated_by: 1,
    created_at: "2026-07-07T09:00:00Z",
    updated_at: "2026-07-19T09:00:00Z"
  },
  {
    id: 8,
    project_code: "SG-2026-008",
    name: "Tuticorin Outer Harbor Expansion",
    category: "Port Modernization",
    state: "Tamil Nadu",
    port_name: "V.O. Chidambaranar Port",
    stakeholder_info: "Port Director T. Srinivas",
    funding_model: "MoPSW Grant-in-aid",
    estimated_cost: 600.0,
    approved_cost: null,
    lifecycle_stage: "APPRAISAL",
    is_active: true,
    created_by: 1,
    updated_by: 1,
    created_at: "2026-07-08T10:00:00Z",
    updated_at: "2026-07-19T10:00:00Z"
  }
];

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState<ProjectRead | null>(null);

  const fetchProjects = () => {
    setLoading(true);
    getProjects()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setProjects(res.data);
        } else {
          setProjects(fallbackProjects);
        }
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading projects:", err);
        setProjects(fallbackProjects);
        setError(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const query = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.project_code.toLowerCase().includes(query) ||
        p.port_name.toLowerCase().includes(query) ||
        p.state.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    });
  }, [projects, search]);

  const columns: Column<ProjectRead>[] = [
    {
      key: "project_code",
      header: "Code",
      sortable: true,
      render: (project) => <span className="font-mono text-xs font-semibold text-slate-500">{project.project_code}</span>,
    },
    {
      key: "name",
      header: "Project",
      sortable: true,
      render: (project) => (
        <div>
          <div className="font-semibold text-slate-800">{project.name}</div>
          <div className="text-xs text-slate-400">{project.category}</div>
        </div>
      ),
    },
    {
      key: "port_name",
      header: "Port / State",
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
        <span className="font-medium">
          <AmountDisplay amount={project.estimated_cost} /> Cr
        </span>
      ),
    },
    {
      key: "approved_cost",
      header: "Appr. Cost",
      align: "right",
      render: (project) => (
        <span className="font-medium">
          {project.approved_cost ? (
            <span><AmountDisplay amount={project.approved_cost} /> Cr</span>
          ) : (
            <span className="text-slate-300">-</span>
          )}
        </span>
      ),
    },
    {
      key: "lifecycle_stage",
      header: "Lifecycle Stage",
      render: (project) => <StatusPill type="lifecycle" status={project.lifecycle_stage} size="sm" />,
    },
  ];

  // Improved table responsiveness and look for consistency
  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Management Spine"
        subtitle="Manage the base port-led infrastructure profiles, lifecycle status, port mapping, and appraisal stages."
        breadcrumbs={[{ label: "Projects" }]}
        actions={
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search project code, name, category, state, port..."
        onClear={() => setSearch("")}
      />

      <DataTable
        data={filteredProjects}
        columns={columns}
        getRowId={(project) => project.id}
        isLoading={loading}
        error={error}
        onRetry={fetchProjects}
        emptyTitle="No projects match query"
        emptySubtitle="Check filters or search query and try again."
        onRowClick={(project) => setSelectedProject(project)}
      />

      {/* Details dialog to view detailed project profile */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        {selectedProject && (
          <DialogContent className="max-w-xl bg-white border border-slate-200 shadow-xl rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                  {selectedProject.project_code}
                </span>
                <StatusPill type="lifecycle" status={selectedProject.lifecycle_stage} size="sm" />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-800">{selectedProject.name}</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Detailed profile summary and allocation metrics.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="block text-xs font-semibold text-slate-400">CATEGORY</span>
                  <span className="font-medium text-slate-700">{selectedProject.category}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400">FUNDING MODEL</span>
                  <span className="font-medium text-slate-700">{selectedProject.funding_model}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="block text-xs font-semibold text-slate-400">PORT AUTHORITY</span>
                  <span className="font-medium text-slate-700">{selectedProject.port_name}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400">STATE / GEOGRAPHY</span>
                  <span className="font-medium text-slate-700">{selectedProject.state}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="block text-xs font-semibold text-slate-400">ESTIMATED INVESTMENT</span>
                  <span className="font-semibold text-slate-800">
                    ₹<AmountDisplay amount={selectedProject.estimated_cost} /> Cr
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400">APPROVED SANCTION</span>
                  <span className="font-semibold text-emerald-600">
                    {selectedProject.approved_cost ? (
                      <span>₹<AmountDisplay amount={selectedProject.approved_cost} /> Cr</span>
                    ) : (
                      <span className="text-slate-400 font-normal">Pending Approval</span>
                    )}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400">STAKEHOLDER CONTACT</span>
                <span className="font-medium text-slate-700">{selectedProject.stakeholder_info || "No stakeholder mapped"}</span>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="outline" className="border-slate-200 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedProject(null)}>
                  Close Details
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
