import { useEffect, useState, useMemo } from "react";
import { Plus, CheckSquare, Calendar, Tag, RefreshCw } from "lucide-react";
import { getTasks, getProjects } from "@/api/portal";
import type { TaskRead, ProjectRead } from "@/types";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusPill } from "@/components/common/StatusPill";
import { FilterBar } from "@/components/common/FilterBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Fallback tasks data if backend is empty
const fallbackTasks: TaskRead[] = [
  {
    id: 1,
    project_id: 1,
    title: "Site Mobilization",
    description: "Complete mobilization of construction site and temporary offices.",
    priority: "HIGH",
    status: "DONE",
    assigned_to: 1,
    due_date: "2026-07-10T18:30:00Z",
    is_active: true,
    created_at: "2026-07-01T12:00:00Z"
  },
  {
    id: 2,
    project_id: 1,
    title: "Foundation Excavation",
    description: "Excavation for berth pile foundations.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assigned_to: 2,
    due_date: "2026-08-05T18:30:00Z",
    is_active: true,
    created_at: "2026-07-02T09:15:00Z"
  },
  {
    id: 3,
    project_id: 1,
    title: "EIA Clearance Review",
    description: "Verify ecological parameters of Visakhapatnam berth.",
    priority: "MEDIUM",
    status: "TODO",
    assigned_to: 3,
    due_date: "2026-08-15T18:30:00Z",
    is_active: true,
    created_at: "2026-07-03T10:00:00Z"
  },
  {
    id: 4,
    project_id: 2,
    title: "Dredging Quantity Estimation",
    description: "Review bathymetric surveys and verify dredging volume estimations.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assigned_to: 3,
    due_date: "2026-08-12T18:30:00Z",
    is_active: true,
    created_at: "2026-07-04T14:30:00Z"
  },
  {
    id: 5,
    project_id: 2,
    title: "Lender Consortium Meet",
    description: "Schedule meeting with lender representatives to align financing.",
    priority: "MEDIUM",
    status: "TODO",
    assigned_to: 1,
    due_date: "2026-08-20T18:30:00Z",
    is_active: true,
    created_at: "2026-07-05T08:45:00Z"
  },
  {
    id: 6,
    project_id: 3,
    title: "Appraisal Approval Dispatch",
    description: "Generate sanction letter and dispatch to Kolkata Port Trust.",
    priority: "MEDIUM",
    status: "DONE",
    assigned_to: 4,
    due_date: "2026-07-16T18:30:00Z",
    is_active: true,
    created_at: "2026-07-06T11:00:00Z"
  },
  {
    id: 7,
    project_id: 4,
    title: "Prepare Preliminary Design",
    description: "Draft the coastal Ro-Ro terminal layout and passenger jetty details.",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    assigned_to: 2,
    due_date: "2026-08-25T18:30:00Z",
    is_active: true,
    created_at: "2026-07-07T09:00:00Z"
  },
  {
    id: 8,
    project_id: 5,
    title: "Expressway Land Acquisition",
    description: "Resolve forest clearance issues and coordinate land acquisition.",
    priority: "HIGH",
    status: "TODO",
    assigned_to: 2,
    due_date: "2026-09-01T18:30:00Z",
    is_active: true,
    created_at: "2026-07-08T10:00:00Z"
  }
];

const fallbackProjects: ProjectRead[] = [
  { id: 1, name: "VPT Berth Modernization Phase II", project_code: "SG-2026-001" } as any,
  { id: 2, name: "JNPT Outer Harbor Dredging", project_code: "SG-2026-002" } as any,
  { id: 3, name: "Kolkata Port Multimodal Terminal", project_code: "SG-2026-003" } as any,
  { id: 4, name: "Coopted Ro-Ro Service Channel", project_code: "SG-2026-004" } as any,
  { id: 5, name: "Chennai Port-Maduravoyal Expressway Link", project_code: "SG-2026-005" } as any,
];

export function TasksPage() {
  const [tasks, setTasks] = useState<TaskRead[]>([]);
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const loadData = () => {
    setLoading(true);
    Promise.all([getTasks(), getProjects()])
      .then(([taskRes, projRes]) => {
        if (taskRes.data && taskRes.data.length > 0) {
          setTasks(taskRes.data);
        } else {
          setTasks(fallbackTasks);
        }
        
        if (projRes.data && projRes.data.length > 0) {
          setProjects(projRes.data);
        } else {
          setProjects(fallbackProjects);
        }
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading task data:", err);
        setTasks(fallbackTasks);
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

  const summary = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "DONE").length;
    const pending = total - completed;
    const highPriority = tasks.filter((t) => t.priority === "HIGH" && t.status !== "DONE").length;
    return { total, completed, pending, highPriority };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Tab filter
      if (activeTab !== "all" && t.status.toLowerCase() !== activeTab.toLowerCase()) {
        return false;
      }
      // Search query filter
      const project = projectMap.get(t.project_id);
      const query = search.toLowerCase();
      const titleMatch = t.title.toLowerCase().includes(query);
      const descMatch = t.description?.toLowerCase().includes(query) ?? false;
      const projMatch = project?.name.toLowerCase().includes(query) ?? false;
      const codeMatch = project?.project_code.toLowerCase().includes(query) ?? false;
      return titleMatch || descMatch || projMatch || codeMatch;
    });
  }, [tasks, activeTab, search, projectMap]);

  const columns: Column<TaskRead>[] = [
    {
      key: "title",
      header: "Task Details",
      render: (task) => {
        const project = projectMap.get(task.project_id);
        return (
          <div className="max-w-md">
            <div className="font-semibold text-slate-800">{task.title}</div>
            <div className="text-xs text-slate-400 mt-0.5">{task.description || "No description provided"}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-medium">
                {project?.name || "Unassigned Project"}
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-medium">
                {project?.project_code}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "priority",
      header: "Priority",
      render: (task) => {
        const p = task.priority;
        let color = "bg-slate-100 text-slate-700";
        if (p === "HIGH") color = "bg-rose-50 text-rose-700 border-rose-100";
        if (p === "MEDIUM") color = "bg-amber-50 text-amber-700 border-amber-100";
        return (
          <Badge variant="outline" className={`${color} px-2.5 py-0.5 rounded-lg border text-xs font-semibold`}>
            {p}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (task) => <StatusPill type="task" status={task.status} size="sm" />,
    },
    {
      key: "due_date",
      header: "Due Date",
      render: (task) => (
        <span className="text-slate-500 text-xs flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {task.due_date ? (
            new Date(task.due_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })
          ) : (
            <span className="text-slate-300">-</span>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controls & Tasks Monitor"
        subtitle="Manage collaborative tasks, review operational due-dates, and track work breakdown lists."
        breadcrumbs={[{ label: "Tasks" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-200 hover:bg-slate-50 cursor-pointer" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        }
      />

      {/* Task Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MiniCard title="Total Tasks" value={summary.total.toString()} icon={<CheckSquare className="text-blue-600" />} />
        <MiniCard title="Pending" value={summary.pending.toString()} icon={<Calendar className="text-amber-600" />} />
        <MiniCard title="Completed" value={summary.completed.toString()} icon={<CheckSquare className="text-emerald-600" />} />
        <MiniCard title="High Priority Pending" value={summary.highPriority.toString()} icon={<Tag className="text-rose-600" />} />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
            <TabsList className="bg-slate-100/50 p-1 flex gap-1 rounded-xl">
              <TabsTrigger value="all" className="cursor-pointer font-medium py-1.5 px-4 text-xs rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">All</TabsTrigger>
              <TabsTrigger value="todo" className="cursor-pointer font-medium py-1.5 px-4 text-xs rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">Todo</TabsTrigger>
              <TabsTrigger value="in_progress" className="cursor-pointer font-medium py-1.5 px-4 text-xs rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">In Progress</TabsTrigger>
              <TabsTrigger value="done" className="cursor-pointer font-medium py-1.5 px-4 text-xs rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">Done</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search task title, description, project..."
          onClear={() => setSearch("")}
        />

        <DataTable
          data={filteredTasks}
          columns={columns}
          getRowId={(task) => String(task.id)}
          isLoading={loading}
          error={error}
          onRetry={loadData}
          emptyTitle="No tasks match parameters"
          emptySubtitle="Tasks assigned under project monitoring plans will populate here."
        />
      </div>
    </div>
  );
}

function MiniCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-white border-0 shadow-sm rounded-xl">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">{value}</span>
        </div>
        <div className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shrink-0">{icon}</div>
      </CardContent>
    </Card>
  );
}
