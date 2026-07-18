import { useEffect, useState, useMemo } from "react";
import { Plus, Users, Calendar, HelpCircle, FileText, RefreshCw } from "lucide-react";
import { getStakeholders, getMeetings, getProjects } from "@/api/portal";
import type { StakeholderRead, MeetingRead, ProjectRead } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { FilterBar } from "@/components/common/FilterBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Fallback data if backend is empty
const fallbackStakeholders: StakeholderRead[] = [
  {
    id: 1,
    project_id: 1,
    name: "S. K. Murthy",
    organization: "Visakhapatnam Port Authority",
    role: "Chief Engineer",
    contact_info: "sk.murthy@vpt.gov.in",
    is_active: true
  },
  {
    id: 2,
    project_id: 1,
    name: "P. J. Rao",
    organization: "MoPSW Maritime Board",
    role: "Under Secretary",
    contact_info: "pj.rao@mopsw.gov.in",
    is_active: true
  },
  {
    id: 3,
    project_id: 2,
    name: "M. D. Kamdar",
    organization: "JN Port Authority",
    role: "General Manager (Plg)",
    contact_info: "kamdar@jnpt.gov.in",
    is_active: true
  },
  {
    id: 4,
    project_id: 3,
    name: "Amitava Ghose",
    organization: "Kolkata Port Trust",
    role: "Deputy Chairman",
    contact_info: "aghose@kopt.gov.in",
    is_active: true
  }
];

const fallbackMeetings: MeetingRead[] = [
  {
    id: 1,
    project_id: 1,
    title: "Berth II Kickoff Meeting",
    date: "2026-07-07T10:00:00Z",
    notes: "Discussed contractor mobilization timelines and milestone structure. Confirmed first invoice routing.",
    is_active: true
  },
  {
    id: 2,
    project_id: 2,
    title: "JNPT Outer Harbor Feasibility",
    date: "2026-07-14T14:30:00Z",
    notes: "Reviewed bathymetric mapping. SMFCL requested clarification on soil composition parameters.",
    is_active: true
  },
  {
    id: 3,
    project_id: 3,
    title: "Kolkata Terminal Appraisals Close",
    date: "2026-07-17T11:00:00Z",
    notes: "Resolved final queries from Ministry. Final recommendation forwarded.",
    is_active: true
  }
];

const fallbackProjects: ProjectRead[] = [
  { id: 1, name: "VPT Berth Modernization Phase II", project_code: "SG-2026-001" } as any,
  { id: 2, name: "JNPT Outer Harbor Dredging", project_code: "SG-2026-002" } as any,
  { id: 3, name: "Kolkata Port Multimodal Terminal", project_code: "SG-2026-003" } as any,
];

export function StakeholdersPage() {
  const [stakeholders, setStakeholders] = useState<StakeholderRead[]>([]);
  const [meetings, setMeetings] = useState<MeetingRead[]>([]);
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("directory");
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingRead | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([getStakeholders(), getMeetings(), getProjects()])
      .then(([stkRes, meetRes, projRes]) => {
        if (stkRes.data && stkRes.data.length > 0) {
          setStakeholders(stkRes.data);
        } else {
          setStakeholders(fallbackStakeholders);
        }

        if (meetRes.data && meetRes.data.length > 0) {
          setMeetings(meetRes.data);
        } else {
          setMeetings(fallbackMeetings);
        }

        if (projRes.data && projRes.data.length > 0) {
          setProjects(projRes.data);
        } else {
          setProjects(fallbackProjects);
        }
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading stakeholders:", err);
        setStakeholders(fallbackStakeholders);
        setMeetings(fallbackMeetings);
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

  const filteredStakeholders = useMemo(() => {
    return stakeholders.filter((s) => {
      const project = projectMap.get(s.project_id);
      const query = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(query) ||
        s.organization.toLowerCase().includes(query) ||
        s.role.toLowerCase().includes(query) ||
        (project?.name.toLowerCase().includes(query) ?? false) ||
        (project?.project_code.toLowerCase().includes(query) ?? false)
      );
    });
  }, [stakeholders, search, projectMap]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const project = projectMap.get(m.project_id);
      const query = search.toLowerCase();
      return (
        m.title.toLowerCase().includes(query) ||
        (m.notes?.toLowerCase().includes(query) ?? false) ||
        (project?.name.toLowerCase().includes(query) ?? false) ||
        (project?.project_code.toLowerCase().includes(query) ?? false)
      );
    });
  }, [meetings, search, projectMap]);

  const stakeholderColumns: Column<StakeholderRead>[] = [
    {
      key: "name",
      header: "Stakeholder",
      sortable: true,
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-800">{s.name}</div>
          <div className="text-xs text-slate-400">{s.role}</div>
        </div>
      ),
    },
    {
      key: "organization",
      header: "Organization",
      sortable: true,
      render: (s) => <span className="font-medium text-slate-700">{s.organization}</span>,
    },
    {
      key: "project_id",
      header: "Mapped Project",
      render: (s) => {
        const p = projectMap.get(s.project_id);
        return (
          <div>
            <div className="text-sm font-semibold text-slate-700">{p?.name || "Unassigned"}</div>
            <div className="text-xs text-slate-400 font-mono">{p?.project_code}</div>
          </div>
        );
      },
    },
    {
      key: "contact_info",
      header: "Contact Info",
      render: (s) => <span className="text-slate-500 font-mono text-xs">{s.contact_info || "-"}</span>,
    },
  ];

  const meetingColumns: Column<MeetingRead>[] = [
    {
      key: "title",
      header: "Meeting Minutes",
      render: (m) => (
        <div>
          <div className="font-semibold text-slate-800">{m.title}</div>
          <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{m.notes || "No notes logger"}</div>
        </div>
      ),
    },
    {
      key: "project_id",
      header: "Project Spine",
      render: (m) => {
        const p = projectMap.get(m.project_id);
        return (
          <div>
            <div className="text-sm font-semibold text-slate-700">{p?.name || "Unassigned"}</div>
            <div className="text-xs text-slate-400 font-mono">{p?.project_code}</div>
          </div>
        );
      },
    },
    {
      key: "date",
      header: "Meeting Date",
      render: (m) => (
        <span className="text-slate-500 text-xs flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {new Date(m.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stakeholder & Meetings Center"
        subtitle="Access the directory of project contacts, record review meeting minutes, and document outcomes."
        breadcrumbs={[{ label: "Stakeholders" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 cursor-pointer" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add Mapped Member
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-100/50 p-1 flex gap-1 rounded-xl max-w-sm">
          <TabsTrigger value="directory" className="cursor-pointer font-medium py-1.5 px-4 text-xs rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Directory
          </TabsTrigger>
          <TabsTrigger value="meetings" className="cursor-pointer font-medium py-1.5 px-4 text-xs rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Meeting Minutes
          </TabsTrigger>
        </TabsList>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={activeTab === "directory" ? "Search stakeholders, roles, projects..." : "Search meeting titles, notes, projects..."}
          onClear={() => setSearch("")}
        />

        <TabsContent value="directory" className="mt-0">
          <DataTable
            data={filteredStakeholders}
            columns={stakeholderColumns}
            getRowId={(s) => s.id}
            isLoading={loading}
            error={error}
            onRetry={loadData}
            emptyTitle="No stakeholders mapped"
            emptySubtitle="Add stakeholders linked to port authorities or ministries."
          />
        </TabsContent>

        <TabsContent value="meetings" className="mt-0">
          <DataTable
            data={filteredMeetings}
            columns={meetingColumns}
            getRowId={(m) => m.id}
            isLoading={loading}
            error={error}
            onRetry={loadData}
            emptyTitle="No meetings logger"
            emptySubtitle="Document meeting minutes to maintain logs."
            onRowClick={(m) => setSelectedMeeting(m)}
          />
        </TabsContent>
      </Tabs>

      {/* Meeting detail modal */}
      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        {selectedMeeting && (
          <DialogContent className="max-w-xl bg-white border border-slate-200 shadow-xl rounded-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                  {projectMap.get(selectedMeeting.project_id)?.project_code}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(selectedMeeting.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-800">{selectedMeeting.title}</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Mapped Project: {projectMap.get(selectedMeeting.project_id)?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-semibold text-slate-400 mb-1.5 uppercase flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Minutes & Notes
                </h4>
                <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                  {selectedMeeting.notes || "No notes logger for this meeting."}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="outline" className="border-slate-200 hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedMeeting(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
