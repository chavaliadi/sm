import { useEffect, useState, useCallback, type FormEvent } from "react";
import {
  getDprs,
  createDpr,
  submitDpr,
  smfclReviewDpr,
  ministryReviewDpr,
  smfclRequeueDpr,
  releaseDprFunds,
  getDprAuditTrail,
} from "@/api/dpr";
import { getProjects } from "@/api/projects";
import type { DPRRead, DPRAuditLogRead, ProjectRead } from "@/types";

export function DprsPage() {
  const [dprs, setDprs] = useState<DPRRead[]>([]);
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New DPR modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review modal
  const [reviewModalDpr, setReviewModalDpr] = useState<DPRRead | null>(null);
  const [reviewType, setReviewType] = useState<"SMFCL" | "MINISTRY">("SMFCL");
  const [reviewDecision, setReviewDecision] = useState<"approve" | "reject">("approve");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Audit trail modal
  const [auditModalDpr, setAuditModalDpr] = useState<DPRRead | null>(null);
  const [auditLogs, setAuditLogs] = useState<DPRAuditLogRead[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dprRes, projRes] = await Promise.all([getDprs(), getProjects({ page_size: 100 })]);
      setDprs(dprRes.data || []);
      setProjects(projRes.data || []);
    } catch (err: any) {
      console.error("Failed to load DPRs:", err);
      setError(
        err.response?.data?.error?.message ||
          (err instanceof Error ? err.message : "Failed to load DPR workspace data.")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setCreateError("Please select a project.");
      return;
    }
    setIsSubmitting(true);
    setCreateError(null);
    try {
      await createDpr(Number(selectedProjectId));
      setIsCreateOpen(false);
      setSelectedProjectId("");
      await loadData();
    } catch (err: any) {
      setCreateError(
        err.response?.data?.error?.message ||
          (err instanceof Error ? err.message : "Failed to create DPR.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDpr = async (dprId: number) => {
    try {
      await submitDpr(dprId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to submit DPR.");
    }
  };

  const handleOpenReviewModal = (dpr: DPRRead, type: "SMFCL" | "MINISTRY") => {
    setReviewModalDpr(dpr);
    setReviewType(type);
    setReviewDecision("approve");
    setReviewComment("");
    setReviewError(null);
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewModalDpr) return;
    if (reviewDecision === "reject" && !reviewComment.trim()) {
      setReviewError("A rejection comment is required.");
      return;
    }
    setIsSubmitting(true);
    setReviewError(null);
    try {
      if (reviewType === "SMFCL") {
        await smfclReviewDpr(reviewModalDpr.id, reviewDecision, reviewComment.trim() || undefined);
      } else {
        await ministryReviewDpr(reviewModalDpr.id, reviewDecision, reviewComment.trim() || undefined);
      }
      setReviewModalDpr(null);
      await loadData();
    } catch (err: any) {
      setReviewError(
        err.response?.data?.error?.message || "Failed to process DPR review decision."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequeue = async (dprId: number) => {
    try {
      await smfclRequeueDpr(dprId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to re-queue DPR.");
    }
  };

  const handleReleaseFunds = async (dprId: number) => {
    if (!window.confirm(`Are you sure you want to release funds for DPR #${dprId}?`)) {
      return;
    }
    try {
      await releaseDprFunds(dprId);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to release funds.");
    }
  };

  const handleOpenAudit = async (dpr: DPRRead) => {
    setAuditModalDpr(dpr);
    setLoadingAudit(true);
    try {
      const res = await getDprAuditTrail(dpr.id);
      setAuditLogs(res.data || []);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || "Failed to load audit trail.");
    } finally {
      setLoadingAudit(false);
    }
  };

  const getProjectCode = (projectId: number) => {
    const proj = projects.find((p) => p.id === projectId);
    return proj ? `${proj.project_code} - ${proj.name}` : `Project #${projectId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            DPR Submission & Approval Workflow
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage Detailed Project Reports (DPRs), multi-level appraisals, reject resubmit loops, and fund disbursements.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsCreateOpen(true);
            setCreateError(null);
          }}
          className="rounded-md bg-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-800"
        >
          + New DPR
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <h3 className="font-semibold text-red-800">Error Loading DPR Workspace</h3>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => void loadData()}
            className="mt-2 rounded bg-red-700 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* DPRs Data Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-xs text-gray-500">
            Loading DPR records…
          </div>
        ) : dprs.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center p-6 text-center text-xs text-gray-500">
            <p className="font-semibold text-gray-700">No DPRs Registered</p>
            <p className="mt-1">Click "+ New DPR" to initiate a DPR submission for an active project.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    DPR ID
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Project Reference
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Version
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Current Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {dprs.map((dpr) => (
                  <tr key={dpr.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-sky-800">
                      DPR-{dpr.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {getProjectCode(dpr.project_id)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">
                      v{dpr.version}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          dpr.status === "DRAFT"
                            ? "bg-gray-100 text-gray-800"
                            : dpr.status === "SUBMITTED" || dpr.status === "SMFCL_REVIEW"
                            ? "bg-amber-100 text-amber-800"
                            : dpr.status.includes("REJECTED")
                            ? "bg-red-100 text-red-800"
                            : dpr.status === "FORWARDED_TO_MINISTRY"
                            ? "bg-blue-100 text-blue-800"
                            : dpr.status === "APPROVED"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {dpr.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => void handleOpenAudit(dpr)}
                        className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                      >
                        Audit Trail
                      </button>

                      {dpr.status === "DRAFT" && (
                        <button
                          type="button"
                          onClick={() => void handleSubmitDpr(dpr.id)}
                          className="rounded bg-sky-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-800"
                        >
                          Submit
                        </button>
                      )}

                      {dpr.status === "REJECTED_BY_SMFCL" && (
                        <button
                          type="button"
                          onClick={() => void handleSubmitDpr(dpr.id)}
                          className="rounded bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-700"
                        >
                          Resubmit (v{dpr.version + 1})
                        </button>
                      )}

                      {dpr.status === "SMFCL_REVIEW" && (
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(dpr, "SMFCL")}
                          className="rounded bg-amber-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-800"
                        >
                          SMFCL Review
                        </button>
                      )}

                      {dpr.status === "FORWARDED_TO_MINISTRY" && (
                        <button
                          type="button"
                          onClick={() => handleOpenReviewModal(dpr, "MINISTRY")}
                          className="rounded bg-indigo-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-800"
                        >
                          Ministry Review
                        </button>
                      )}

                      {dpr.status === "REJECTED_BY_MINISTRY" && (
                        <button
                          type="button"
                          onClick={() => void handleRequeue(dpr.id)}
                          className="rounded bg-orange-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-orange-700"
                        >
                          Re-queue SMFCL
                        </button>
                      )}

                      {dpr.status === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() => void handleReleaseFunds(dpr.id)}
                          className="rounded bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800"
                        >
                          Release Funds
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create DPR Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Create New DPR</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Initiate a DPR submission in DRAFT status for a valid project.
            </p>

            {createError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700">
                  Select Project *
                </label>
                <select
                  required
                  value={selectedProjectId}
                  onChange={(e) =>
                    setSelectedProjectId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">-- Choose Active Project --</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.project_code} - {proj.name} ({proj.lifecycle_stage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-sky-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating…" : "Create DPR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalDpr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              {reviewType === "SMFCL" ? "SMFCL Appraisal Review" : "Ministry Final Review"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              DPR #{reviewModalDpr.id} — Version v{reviewModalDpr.version}
            </p>

            {reviewError && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700">
                  Decision *
                </label>
                <div className="mt-1 flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 font-medium text-emerald-700">
                    <input
                      type="radio"
                      name="decision"
                      value="approve"
                      checked={reviewDecision === "approve"}
                      onChange={() => setReviewDecision("approve")}
                    />
                    Approve & Forward
                  </label>
                  <label className="flex items-center gap-1.5 font-medium text-red-700">
                    <input
                      type="radio"
                      name="decision"
                      value="reject"
                      checked={reviewDecision === "reject"}
                      onChange={() => setReviewDecision("reject")}
                    />
                    Reject
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-700">
                  Observations / Comments {reviewDecision === "reject" && "*"}
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    reviewDecision === "reject"
                      ? "Mandatory reason for rejection..."
                      : "Optional review notes..."
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalDpr(null)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`rounded-md px-4 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-50 ${
                    reviewDecision === "approve"
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : "bg-red-700 hover:bg-red-800"
                  }`}
                >
                  {isSubmitting ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {auditModalDpr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  DPR #{auditModalDpr.id} Audit Trail
                </h2>
                <p className="text-xs text-gray-500">
                  Complete transition log from initial creation to current status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuditModalDpr(null)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-3 border-t border-gray-100 pt-3">
              {loadingAudit ? (
                <div className="text-xs text-gray-500 p-4 text-center">Loading audit log entries…</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-xs text-gray-500 p-4 text-center">No audit entries found.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="rounded-md border border-gray-100 bg-gray-50 p-3 text-xs">
                    <div className="flex items-center justify-between font-semibold text-gray-900">
                      <span>Action: {log.action}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-600">
                      <span>From: {log.old_status || "—"}</span>
                      <span>→</span>
                      <span className="font-semibold text-sky-800">{log.new_status || "—"}</span>
                    </div>
                    {log.comment && (
                      <p className="mt-1.5 text-[11px] italic text-gray-700 bg-white p-2 rounded border border-gray-200">
                        "{log.comment}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
