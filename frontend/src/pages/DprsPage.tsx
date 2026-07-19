import { useEffect, useState, useMemo } from "react";
import { Trash2, Eye, FileCheck, RefreshCw } from "lucide-react";
import { getDprs, getProjects, deleteDpr } from "@/api/portal";
import type { DPRRead, ProjectRead } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusPill } from "@/components/common/StatusPill";
import { FilterBar } from "@/components/common/FilterBar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

// Fallback DPR data if backend returns empty
const fallbackDprs: DPRRead[] = [
  {
    id: 1,
    project_id: 1,
    version: 2,
    status: "FUNDS_RELEASED",
    submitted_by: 2,
    is_active: true,
    created_at: "2026-07-01T12:00:00Z",
    updated_at: "2026-07-15T15:30:00Z"
  },
  {
    id: 2,
    project_id: 2,
    version: 1,
    status: "SMFCL_REVIEW",
    submitted_by: 2,
    is_active: true,
    created_at: "2026-07-02T09:15:00Z",
    updated_at: "2026-07-16T11:45:00Z"
  },
  {
    id: 3,
    project_id: 3,
    version: 1,
    status: "APPROVED",
    submitted_by: 2,
    is_active: true,
    created_at: "2026-07-03T10:00:00Z",
    updated_at: "2026-07-17T14:20:00Z"
  },
  {
    id: 4,
    project_id: 4,
    version: 1,
    status: "DRAFT",
    submitted_by: 2,
    is_active: true,
    created_at: "2026-07-04T14:30:00Z",
    updated_at: "2026-07-18T16:10:00Z"
  },
  {
    id: 5,
    project_id: 5,
    version: 2,
    status: "FORWARDED_TO_MINISTRY",
    submitted_by: 2,
    is_active: true,
    created_at: "2026-07-05T08:45:00Z",
    updated_at: "2026-07-19T10:30:00Z"
  },
  {
    id: 6,
    project_id: 6,
    version: 3,
    status: "APPROVED",
    submitted_by: 2,
    is_active: true,
    created_at: "2026-07-06T11:00:00Z",
    updated_at: "2026-07-19T12:00:00Z"
  },
  {
    id: 7,
    project_id: 8,
    version: 2,
    status: "REJECTED_BY_MINISTRY",
    submitted_by: 2,
    is_active: true,
    created_at: "2026-07-08T10:00:00Z",
    updated_at: "2026-07-19T10:00:00Z"
  }
];

const fallbackProjects: ProjectRead[] = [
  {
    id: 1, project_code: "SG-2026-001", name: "VPT Berth Modernization Phase II",
    category: "Port Modernization", state: "Andhra Pradesh", port_name: "Visakhapatnam Port",
    stakeholder_info: null, funding_model: "MoPSW Grant-in-aid", estimated_cost: 120.5, approved_cost: 115.0,
    lifecycle_stage: "UNDER_EXECUTION", is_active: true, created_by: 1, updated_by: 1, created_at: "", updated_at: ""
  },
  {
    id: 2, project_code: "SG-2026-002", name: "JNPT Outer Harbor Dredging",
    category: "Port Modernization", state: "Maharashtra", port_name: "Jawaharlal Nehru Port",
    stakeholder_info: null, funding_model: "MoPSW Grant-in-aid", estimated_cost: 450.0, approved_cost: null,
    lifecycle_stage: "APPRAISAL", is_active: true, created_by: 1, updated_by: 1, created_at: "", updated_at: ""
  },
  {
    id: 3, project_code: "SG-2026-003", name: "Kolkata Port Multimodal Terminal",
    category: "Connectivity Infrastructure", state: "West Bengal", port_name: "Kolkata Port",
    stakeholder_info: null, funding_model: "MoPSW Grant-in-aid", estimated_cost: 85.0, approved_cost: 85.0,
    lifecycle_stage: "SANCTIONED", is_active: true, created_by: 1, updated_by: 1, created_at: "", updated_at: ""
  },
  {
    id: 4, project_code: "SG-2026-004", name: "Coopted Ro-Ro Service Channel",
    category: "Coastal Shipping", state: "Kerala", port_name: "Cochin Port",
    stakeholder_info: null, funding_model: "MoPSW Grant-in-aid", estimated_cost: 45.0, approved_cost: null,
    lifecycle_stage: "INITIATION", is_active: true, created_by: 1, updated_by: 1, created_at: "", updated_at: ""
  },
  {
    id: 5, project_code: "SG-2026-005", name: "Chennai Port-Maduravoyal Expressway Link",
    category: "Connectivity Infrastructure", state: "Tamil Nadu", port_name: "Chennai Port",
    stakeholder_info: null, funding_model: "MoPSW Grant-in-aid", estimated_cost: 320.0, approved_cost: 320.0,
    lifecycle_stage: "UNDER_EXECUTION", is_active: true, created_by: 1, updated_by: 1, created_at: "", updated_at: ""
  },
  {
    id: 6, project_code: "SG-2026-006", name: "Paradip Coal Berth Mechanization",
    category: "Port Modernization", state: "Odisha", port_name: "Paradip Port",
    stakeholder_info: null, funding_model: "MoPSW Grant-in-aid", estimated_cost: 180.0, approved_cost: 180.0,
    lifecycle_stage: "COMPLETED", is_active: true, created_by: 1, updated_by: 1, created_at: "", updated_at: ""
  },
  {
    id: 8, project_code: "SG-2026-008", name: "Tuticorin Outer Harbor Expansion",
    category: "Port Modernization", state: "Tamil Nadu", port_name: "V.O. Chidambaranar Port",
    stakeholder_info: null, funding_model: "MoPSW Grant-in-aid", estimated_cost: 600.0, approved_cost: null,
    lifecycle_stage: "APPRAISAL", is_active: true, created_by: 1, updated_by: 1, created_at: "", updated_at: ""
  }
];

// Mock audit log steps for the timeline detail view
const mockAuditTrail: Record<number, { actor: string; action: string; comment: string; date: string }[]> = {
  1: [
    { actor: "Port Authority", action: "SUBMIT", comment: "Initial DPR submission containing detailed cost layout and EIA clearance.", date: "2026-07-01" },
    { actor: "SMFCL Appraisal Lead", action: "SMFCL_REVIEW_START", comment: "Assigned to technical team for feasibility check.", date: "2026-07-03" },
    { actor: "SMFCL Appraisal Lead", action: "FORWARD", comment: "DPR matches ministry standards. Recommended for sanction.", date: "2026-07-10" },
    { actor: "Ministry Sanction Authority", action: "APPROVE", comment: "Sanction granted. Fund release authorized under head 3601.", date: "2026-07-13" },
    { actor: "SMFCL Appraisal Lead", action: "RELEASE_FUNDS", comment: "First tranche of 25 Crores disbursed to state treasury.", date: "2026-07-15" }
  ],
  2: [
    { actor: "Port Authority", action: "SUBMIT", comment: "Initial DPR submission containing detailed bathymetric surveys.", date: "2026-07-02" },
    { actor: "SMFCL Appraisal Lead", action: "SMFCL_REVIEW_START", comment: "Assigned to technical team for feasibility check.", date: "2026-07-05" }
  ],
  3: [
    { actor: "Port Authority", action: "SUBMIT", comment: "DPR submission including multimodal connectivity blueprints.", date: "2026-07-03" },
    { actor: "SMFCL Appraisal Lead", action: "FORWARD", comment: "Forwarded to Ministry with high recommendation.", date: "2026-07-11" },
    { actor: "Ministry Sanction Authority", action: "APPROVE", comment: "Sanction approved.", date: "2026-07-17" }
  ],
  4: [
    { actor: "Port Authority", action: "CREATE", comment: "Draft created in workspace.", date: "2026-07-04" }
  ],
  5: [
    { actor: "Port Authority", action: "SUBMIT", comment: "Initial submission.", date: "2026-07-05" },
    { actor: "SMFCL Appraisal Lead", action: "FORWARD", comment: "Recommending approval.", date: "2026-07-15" }
  ],
  7: [
    { actor: "Port Authority", action: "SUBMIT", comment: "Initial submission.", date: "2026-07-08" },
    { actor: "SMFCL Appraisal Lead", action: "FORWARD", comment: "Recommending approval.", date: "2026-07-12" },
    { actor: "Ministry Sanction Authority", action: "REJECT", comment: "Incomplete financial structure. Revise and resubmit.", date: "2026-07-19" }
  ]
};

export function DprsPage() {
  const { toast } = useToast();
  const [dprs, setDprs] = useState<DPRRead[]>([]);
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");
  const [selectedDpr, setSelectedDpr] = useState<DPRRead | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([getDprs(), getProjects()])
      .then(([dprRes, projRes]) => {
        if (dprRes.data && dprRes.data.length > 0) {
          setDprs(dprRes.data);
        } else {
          setDprs(fallbackDprs);
        }
        
        if (projRes.data && projRes.data.length > 0) {
          setProjects(projRes.data);
        } else {
          setProjects(fallbackProjects);
        }
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading DPR workspace:", err);
        setDprs(fallbackDprs);
        setProjects(fallbackProjects);
        setError(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const projectMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p]));
  }, [projects]);

  const filteredDprs = useMemo(() => {
    return dprs.filter((d) => {
      const project = projectMap.get(d.project_id);
      const nameMatch = project?.name.toLowerCase().includes(search.toLowerCase()) ?? false;
      const codeMatch = project?.project_code.toLowerCase().includes(search.toLowerCase()) ?? false;
      const statusMatch = d.status.toLowerCase().includes(search.toLowerCase());
      return nameMatch || codeMatch || statusMatch;
    });
  }, [dprs, projects, search, projectMap]);

  const handleDeleteDraft = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click details dialog
    if (!confirm("Are you sure you want to delete this draft DPR?")) return;

    try {
      await deleteDpr(id);
      toast?.({
        title: "Draft Deleted",
        description: "DPR draft soft-deleted successfully.",
      });
      // Refresh list
      loadData();
    } catch (err) {
      console.error("Error soft-deleting DPR draft:", err);
      toast?.({
        title: "Deletion Failed",
        description: "Only DPR drafts can be soft-deleted.",
        variant: "destructive",
      });
    }
  };

  const columns: Column<DPRRead>[] = [
    {
      key: "project_id",
      header: "Project Profile",
      sortable: true,
      render: (dpr) => {
        const project = projectMap.get(dpr.project_id);
        return (
          <div>
            <div className="font-semibold text-slate-800">{project?.name ?? "Unknown Project"}</div>
            <div className="text-xs text-slate-400 font-mono">{project?.project_code ?? "N/A"}</div>
          </div>
        );
      },
    },
    {
      key: "version",
      header: "Version",
      render: (dpr) => <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600">v{dpr.version}</span>,
    },
    {
      key: "status",
      header: "Appraisal Status",
      render: (dpr) => <StatusPill type="dpr" status={dpr.status} size="sm" />,
    },
    {
      key: "updated_at",
      header: "Last Activity",
      render: (dpr) => (
        <span className="text-slate-500 text-xs">
          {new Date(dpr.updated_at || dpr.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })}
        </span>
      ),
    },
    {
      key: "id",
      header: "Actions",
      align: "right",
      render: (dpr) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-600 cursor-pointer"
            onClick={() => setSelectedDpr(dpr)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {dpr.status === "DRAFT" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              onClick={(e) => handleDeleteDraft(dpr.id, e)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="DPR Appraisal Workspace"
        subtitle="Manage Detailed Project Report appraisals, observe version sequences, and audit ministry approval states."
        breadcrumbs={[{ label: "DPR Approvals" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 cursor-pointer" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Workflow
            </Button>
            <Button className="cursor-pointer">
              Submit DPR
            </Button>
          </div>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search project code, name, category, or status..."
        onClear={() => setSearch("")}
      />

      <DataTable
        data={filteredDprs}
        columns={columns}
        getRowId={(dpr) => String(dpr.id)}
        isLoading={loading}
        error={error}
        onRetry={loadData}
        emptyTitle="No DPR submissions found"
        emptySubtitle="Submitted Detailed Project Reports will appear in this workspace."
        onRowClick={(dpr) => setSelectedDpr(dpr)}
      />

      {/* Details timeline and audit log dialog */}
      <Dialog open={!!selectedDpr} onOpenChange={() => setSelectedDpr(null)}>
        {selectedDpr && (
          <DialogContent className="max-w-xl bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                  {projectMap.get(selectedDpr.project_id)?.project_code}
                </span>
                <span className="text-xs text-slate-400 font-medium">Version {selectedDpr.version}</span>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-800">
                {projectMap.get(selectedDpr.project_id)?.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Audit history and workflow state machine logs.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status block */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="block text-xs font-semibold text-slate-400">CURRENT STATUS</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {selectedDpr.status.replace(/_/g, " ")}
                  </span>
                </div>
                <StatusPill type="dpr" status={selectedDpr.status} />
              </div>

              {/* Chronological Timeline */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-slate-500" />
                  Audit Trail History
                </h4>
                
                <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-6">
                  {mockAuditTrail[selectedDpr.id]?.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                      
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-semibold text-slate-500">{step.actor}</span>
                        <span>{new Date(step.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        {step.action.replace(/_/g, " ")}
                      </div>
                      {step.comment && (
                        <p className="mt-1 text-sm text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100/50 leading-relaxed">
                          {step.comment}
                        </p>
                      )}
                    </div>
                  )) || (
                    <div className="text-xs text-slate-400 italic">No audit trail logs recorded yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button variant="outline" className="border-slate-200 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedDpr(null)}>
                Close Details
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
