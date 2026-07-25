import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getProjectDetail } from "@/api/projects";
import type {
  DPRRead,
  TenderRead,
  TaskRead,
  StakeholderRead,
  MeetingRead,
} from "@/types";
import type { Clearance } from "@/features/clearance/types";
import type { ContractRead } from "@/features/contracts/types";

/* ── Helpers ───────────────────────────────────────────────────────── */

function stageBadge(stage: string) {
  const cls =
    stage === "INITIATION"
      ? "bg-sky-100 text-sky-800"
      : stage.includes("APPRAISAL")
      ? "bg-amber-100 text-amber-800"
      : stage === "SANCTIONED"
      ? "bg-purple-100 text-purple-800"
      : stage === "UNDER_EXECUTION"
      ? "bg-emerald-100 text-emerald-800"
      : stage === "COMPLETED"
      ? "bg-green-100 text-green-800"
      : "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cls}`}
    >
      {stage}
    </span>
  );
}

function statusBadge(status: string) {
  const color =
    status === "APPROVED" || status === "DONE" || status === "ACTIVE" || status === "AWARDED" || status === "EMPANELLED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "PENDING" || status === "DRAFT" || status === "TODO" || status === "SUBMITTED"
      ? "bg-amber-100 text-amber-800"
      : status === "REJECTED" || status === "CLOSED" || status === "BLACKLISTED"
      ? "bg-red-100 text-red-800"
      : status === "IN_PROGRESS" || status === "PUBLISHED" || status === "ISSUED"
      ? "bg-sky-100 text-sky-800"
      : "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}
    >
      {status}
    </span>
  );
}

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
            {count}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-xs text-gray-400 italic">{message}</p>
  );
}

/* ── Typed shapes for the aggregated response ──────────────────────── */

interface TenderWithBids extends TenderRead {
  bid_summary: {
    total_bids: number;
    winning_bid: {
      id: number;
      bidder_name: string;
      financial_amount: number | null;
    } | null;
  };
}

interface ContractWithWO extends ContractRead {
  work_order_count: number;
}

interface ProjectDetail {
  id: number;
  project_code: string;
  name: string;
  category: string;
  state: string;
  port_name: string;
  stakeholder_info: string | null;
  objectives: string | null;
  milestones: string | null;
  funding_model: string;
  estimated_cost: number;
  approved_cost: number | null;
  lifecycle_stage: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  dpr: DPRRead | null;
  clearances: Clearance[];
  tenders: TenderWithBids[];
  contracts: ContractWithWO[];
  tasks: TaskRead[];
  stakeholders: StakeholderRead[];
  meetings: MeetingRead[];
}

/* ── Page Component ────────────────────────────────────────────────── */

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await getProjectDetail(Number(id));
      setData(raw as unknown as ProjectDetail);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load project detail";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-gray-500">
        Loading project detail…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 p-6">
        <Link
          to="/projects"
          className="text-xs font-semibold text-sky-700 hover:text-sky-900"
        >
          ← Back to Projects
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <h3 className="font-semibold text-red-800">
            Error Loading Project Detail
          </h3>
          <p className="mt-1">{error || "Unknown error"}</p>
          <button
            onClick={() => void load()}
            className="mt-2 rounded bg-red-700 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/projects"
        className="text-xs font-semibold text-sky-700 hover:text-sky-900"
      >
        ← Back to Projects
      </Link>

      {/* Project Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="font-mono text-xs font-semibold text-sky-800">
              {data.project_code}
            </p>
            <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <span>{data.category}</span>
              <span>•</span>
              <span>{data.port_name}, {data.state}</span>
              <span>•</span>
              <span>{data.funding_model}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {stageBadge(data.lifecycle_stage)}
            <p className="text-xs text-gray-500">
              Est. ₹{data.estimated_cost.toLocaleString("en-IN")} Cr
              {data.approved_cost !== null &&
                ` / Approved ₹${data.approved_cost.toLocaleString("en-IN")} Cr`}
            </p>
          </div>
        </div>
        {(data.objectives || data.milestones) && (
          <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
            {data.objectives && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Objectives
                </p>
                <p className="mt-1 text-xs text-gray-700">{data.objectives}</p>
              </div>
            )}
            {data.milestones && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Milestones
                </p>
                <p className="mt-1 text-xs text-gray-700">{data.milestones}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Module Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* DPR */}
        <SectionCard title="Detailed Project Report (DPR)">
          {data.dpr ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Status:</span>
                {statusBadge(data.dpr.status)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Version:</span>{" "}
                  <span className="font-medium text-gray-900">
                    v{data.dpr.version}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">ID:</span>{" "}
                  <span className="font-medium text-gray-900">
                    {data.dpr.id}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState message="No DPR submitted yet for this project." />
          )}
        </SectionCard>

        {/* Clearances */}
        <SectionCard
          title="Statutory Clearances"
          count={data.clearances.length}
        >
          {data.clearances.length === 0 ? (
            <EmptyState message="No clearances registered for this project." />
          ) : (
            <div className="space-y-2">
              {data.clearances.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      {c.title}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {c.clearance_type} — {c.authority_name}
                    </p>
                  </div>
                  {statusBadge(c.status)}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Tenders */}
        <SectionCard title="Tenders" count={data.tenders.length}>
          {data.tenders.length === 0 ? (
            <EmptyState message="No tenders created for this project." />
          ) : (
            <div className="space-y-2">
              {data.tenders.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-900">
                        {t.title}
                      </p>
                      <p className="font-mono text-[10px] text-gray-500">
                        {t.tender_code}
                      </p>
                    </div>
                    {statusBadge(t.status)}
                  </div>
                  <div className="mt-1 flex gap-3 text-[10px] text-gray-500">
                    <span>
                      {t.bid_summary.total_bids} bid
                      {t.bid_summary.total_bids !== 1 ? "s" : ""}
                    </span>
                    {t.bid_summary.winning_bid && (
                      <span className="font-medium text-emerald-700">
                        Winner: {t.bid_summary.winning_bid.bidder_name}
                        {t.bid_summary.winning_bid.financial_amount !== null &&
                          ` (₹${t.bid_summary.winning_bid.financial_amount.toLocaleString("en-IN")})`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Contracts */}
        <SectionCard title="Contracts" count={data.contracts.length}>
          {data.contracts.length === 0 ? (
            <EmptyState message="No contracts created for this project." />
          ) : (
            <div className="space-y-2">
              {data.contracts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-900">
                      {c.title}
                    </p>
                    <p className="font-mono text-[10px] text-gray-500">
                      {c.contract_number}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {c.work_order_count} work order
                      {c.work_order_count !== 1 ? "s" : ""}
                      {c.contract_value !== null &&
                        ` • ₹${c.contract_value.toLocaleString("en-IN")}`}
                    </p>
                  </div>
                  {statusBadge(c.status)}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Tasks */}
        <SectionCard title="Tasks" count={data.tasks.length}>
          {data.tasks.length === 0 ? (
            <EmptyState message="No tasks assigned to this project." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="border-b border-gray-200 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="pb-2 pr-3">Title</th>
                    <th className="pb-2 pr-3">Priority</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.tasks.map((t) => (
                    <tr key={t.id}>
                      <td className="py-1.5 pr-3 font-medium text-gray-900">
                        {t.title}
                      </td>
                      <td className="py-1.5 pr-3">
                        <span
                          className={`text-[10px] font-semibold ${
                            t.priority === "HIGH"
                              ? "text-red-600"
                              : t.priority === "MEDIUM"
                              ? "text-amber-600"
                              : "text-gray-500"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-1.5 pr-3">{statusBadge(t.status)}</td>
                      <td className="py-1.5 text-[10px] text-gray-500">
                        {t.due_date
                          ? new Date(t.due_date).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Stakeholders & Meetings */}
        <SectionCard
          title="Stakeholders & Meetings"
          count={data.stakeholders.length + data.meetings.length}
        >
          {data.stakeholders.length === 0 && data.meetings.length === 0 ? (
            <EmptyState message="No stakeholders or meetings recorded for this project." />
          ) : (
            <div className="space-y-3">
              {data.stakeholders.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Stakeholders
                  </p>
                  {data.stakeholders.map((s) => (
                    <div
                      key={s.id}
                      className="mb-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs"
                    >
                      <span className="font-medium text-gray-900">
                        {s.name}
                      </span>{" "}
                      <span className="text-gray-500">
                        — {s.organization} ({s.role})
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {data.meetings.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Meetings
                  </p>
                  {data.meetings.map((m) => (
                    <div
                      key={m.id}
                      className="mb-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs"
                    >
                      <span className="font-medium text-gray-900">
                        {m.title}
                      </span>{" "}
                      <span className="text-gray-500">
                        — {new Date(m.date).toLocaleDateString("en-IN")}
                      </span>
                      {m.notes && (
                        <p className="mt-0.5 text-[10px] text-gray-500">
                          {m.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
