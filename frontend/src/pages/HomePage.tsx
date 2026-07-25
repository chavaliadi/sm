import { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getProjects } from "@/api/projects";
import { getTasks } from "@/api/tasks";
import { getClearances } from "@/features/clearance/api";
import { getTenders } from "@/api/tender";
import { getContracts } from "@/features/contracts/api";
import { getContractors } from "@/features/contractors/api";
import type { ProjectRead } from "@/types";
import type { TaskRead } from "@/types/task";

const PIE_COLORS = {
  TODO: "#64748b",
  IN_PROGRESS: "#0284c7",
  DONE: "#10b981",
};

export function HomePage() {
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [tasks, setTasks] = useState<TaskRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phase 2 KPI state
  const [pendingClearances, setPendingClearances] = useState<number | null>(null);
  const [pendingClearancesError, setPendingClearancesError] = useState(false);

  const [activeTenders, setActiveTenders] = useState<number | null>(null);
  const [activeTendersError, setActiveTendersError] = useState(false);

  const [contractsInProgress, setContractsInProgress] = useState<number | null>(null);
  const [contractsInProgressError, setContractsInProgressError] = useState(false);

  const [empanelledContractors, setEmpanelledContractors] = useState<number | null>(null);
  const [empanelledContractorsError, setEmpanelledContractorsError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        getProjects({ page: 1, page_size: 100 }),
        getTasks(1, 100),
      ]);
      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data. Ensure backend is running and you are logged in."
      );
    } finally {
      setLoading(false);
    }

    // Fetch Phase 2 KPI Cards independently with per-card error handling
    // 1. Pending Clearances
    try {
      const clrRes = await getClearances({ status: "PENDING", page: 1, page_size: 100 });
      setPendingClearances(clrRes.meta.total);
      setPendingClearancesError(false);
    } catch (err) {
      console.error("Pending clearances fetch error:", err);
      setPendingClearancesError(true);
    }

    // 2. Active Tenders (status != AWARDED and status != CLOSED)
    try {
      const tndRes = await getTenders(1, 100);
      const activeCount = (tndRes.data || []).filter(
        (t) => t.status !== "AWARDED" && t.status !== "CLOSED"
      ).length;
      setActiveTenders(activeCount);
      setActiveTendersError(false);
    } catch (err) {
      console.error("Active tenders fetch error:", err);
      setActiveTendersError(true);
    }

    // 3. Contracts In Progress (status ACTIVE or ISSUED)
    try {
      const cntRes = await getContracts(1, 100, {});
      const inProgressCount = (cntRes.data || []).filter(
        (c) => c.status === "ACTIVE" || c.status === "ISSUED"
      ).length;
      setContractsInProgress(inProgressCount);
      setContractsInProgressError(false);
    } catch (err) {
      console.error("Contracts in progress fetch error:", err);
      setContractsInProgressError(true);
    }

    // 4. Empanelled Contractors (status Empanelled)
    try {
      const crRes = await getContractors({ status: "Empanelled", page: 1, page_size: 100 });
      setEmpanelledContractors(crRes.meta.total);
      setEmpanelledContractorsError(false);
    } catch (err) {
      console.error("Empanelled contractors fetch error:", err);
      setEmpanelledContractorsError(true);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // KPI Calculations
  const kpiData = useMemo(() => {
    const totalProjects = projects.length;
    const activeTasks = tasks.filter(
      (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
    ).length;
    const completedTasks = tasks.filter((t) => t.status === "DONE").length;

    return {
      totalProjects,
      activeTasks,
      completedTasks,
    };
  }, [projects, tasks]);

  // Bar Chart: Project Count by Lifecycle Stage
  const projectStageData = useMemo(() => {
    const stages = [
      { key: "INITIATION", label: "Initiation" },
      { key: "APPRAISAL", label: "Appraisal" },
      { key: "SANCTIONED", label: "Sanctioned" },
      { key: "UNDER_EXECUTION", label: "Under Execution" },
      { key: "COMPLETED", label: "Completed" },
    ];

    return stages.map((stage) => ({
      stage: stage.label,
      count: projects.filter((p) => {
        const stageUpper = p.lifecycle_stage?.toUpperCase() || "";
        if (stage.key === "APPRAISAL") {
          return stageUpper.includes("APPRAISAL") || stageUpper.includes("SANCTION");
        }
        return stageUpper === stage.key || p.lifecycle_stage === stage.label;
      }).length,
    }));
  }, [projects]);

  // Pie Chart: Task Status Breakdown
  const taskStatusData = useMemo(() => {
    const statuses = [
      { key: "TODO", label: "To Do", color: PIE_COLORS.TODO },
      { key: "IN_PROGRESS", label: "In Progress", color: PIE_COLORS.IN_PROGRESS },
      { key: "DONE", label: "Done", color: PIE_COLORS.DONE },
    ];

    return statuses.map((st) => ({
      name: st.label,
      status: st.key,
      count: tasks.filter((t) => t.status === st.key).length,
      color: st.color,
    }));
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-gray-500">
        Loading dashboard metrics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <h2 className="font-semibold text-red-800">Error Loading Dashboard</h2>
        <p className="mt-1">{error}</p>
        <button
          onClick={() => void fetchData()}
          className="mt-4 rounded-md bg-red-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Dashboard / MIS
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Executive portfolio metrics and breakdown for Sagarmala 2.0.
        </p>
      </div>

      {/* Phase 1 Portfolio KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Total Projects */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Total Projects
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {kpiData.totalProjects}
          </p>
          <p className="mt-1 text-xs text-gray-500">Monitored port projects</p>
        </div>

        {/* Card 2: Active Tasks */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Active Tasks
          </p>
          <p className="mt-2 text-3xl font-bold text-sky-700">
            {kpiData.activeTasks}
          </p>
          <p className="mt-1 text-xs text-gray-500">To do & in progress</p>
        </div>

        {/* Card 3: Completed Tasks */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Completed Tasks
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {kpiData.completedTasks}
          </p>
          <p className="mt-1 text-xs text-gray-500">Tasks marked as done</p>
        </div>
      </div>

      {/* Phase 2 Pre-Construction KPI Cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase text-gray-500">
          Pre-Construction & Procurement Metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Pending Clearances */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Pending Clearances
            </p>
            {pendingClearancesError ? (
              <p className="mt-2 text-xs font-medium text-red-600">Error loading metric</p>
            ) : (
              <p className="mt-2 text-3xl font-bold text-amber-600">
                {pendingClearances !== null ? pendingClearances : "—"}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">Statutory clearances pending approval</p>
          </div>

          {/* Card 2: Active Tenders */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Active Tenders
            </p>
            {activeTendersError ? (
              <p className="mt-2 text-xs font-medium text-red-600">Error loading metric</p>
            ) : (
              <p className="mt-2 text-3xl font-bold text-indigo-600">
                {activeTenders !== null ? activeTenders : "—"}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">Tenders in active workflow stages</p>
          </div>

          {/* Card 3: Contracts In Progress */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Contracts In Progress
            </p>
            {contractsInProgressError ? (
              <p className="mt-2 text-xs font-medium text-red-600">Error loading metric</p>
            ) : (
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {contractsInProgress !== null ? contractsInProgress : "—"}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">Contracts active or issued</p>
          </div>

          {/* Card 4: Empanelled Contractors */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Empanelled Contractors
            </p>
            {empanelledContractorsError ? (
              <p className="mt-2 text-xs font-medium text-red-600">Error loading metric</p>
            ) : (
              <p className="mt-2 text-3xl font-bold text-purple-600">
                {empanelledContractors !== null ? empanelledContractors : "—"}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">Verified & empanelled partners</p>
          </div>
        </div>
      </div>

      {/* Charts Section: Exactly 1 Bar Chart + 1 Pie Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart: Projects by Lifecycle Stage */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">
            Project Count by Lifecycle Stage
          </h2>
          <p className="text-xs text-gray-500">
            Distribution of projects across appraisal and execution stages
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectStageData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                  }}
                />
                <Bar
                  dataKey="count"
                  name="Projects"
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Task Status Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">
            Task Status Breakdown
          </h2>
          <p className="text-xs text-gray-500">
            Current status distribution across active project tasks
          </p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  label={({ name, value }) =>
                    typeof value === "number" && value > 0
                      ? `${name}: ${value}`
                      : ""
                  }
                >
                  {taskStatusData.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                />
                </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
