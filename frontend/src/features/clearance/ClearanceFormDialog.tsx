import React, { useState } from "react";
import type { ProjectRead } from "@/types";
import { createClearance } from "./api";
import type { ClearanceType, ClearanceStatus } from "./types";

interface ClearanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projects: ProjectRead[];
}

export function ClearanceFormDialog({ open, onOpenChange, onSuccess, projects }: ClearanceFormDialogProps) {
  const [projectId, setProjectId] = useState<string>("");
  const [clearanceType, setClearanceType] = useState<ClearanceType>("LAND_ACQUISITION");
  const [title, setTitle] = useState<string>("");
  const [authorityName, setAuthorityName] = useState<string>("");
  const [status, setStatus] = useState<ClearanceStatus>("PENDING");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [documentUrl, setDocumentUrl] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      await createClearance({
        project_id: parseInt(projectId, 10),
        clearance_type: clearanceType,
        title: title.trim(),
        authority_name: authorityName.trim(),
        status,
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        document_url: documentUrl.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      onSuccess();
      onOpenChange(false);
      setProjectId("");
      setTitle("");
      setAuthorityName("");
      setDocumentUrl("");
      setRemarks("");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message
          : err instanceof Error
          ? err.message
          : "Failed to create clearance";
      setErrorMsg(msg || "Failed to create clearance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900">Register Statutory Clearance</h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {errorMsg && (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label htmlFor="clearance_project_id" className="block text-xs font-semibold uppercase text-slate-500">
              Project *
            </label>
            <select
              id="clearance_project_id"
              required
              value={projectId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProjectId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_code} - {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="clearance_type" className="block text-xs font-semibold uppercase text-slate-500">
              Clearance Type
            </label>
            <select
              id="clearance_type"
              value={clearanceType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setClearanceType(e.target.value as ClearanceType)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="LAND_ACQUISITION">Land Acquisition</option>
              <option value="CRZ">CRZ Clearance</option>
              <option value="EC">Environmental Clearance (EC)</option>
              <option value="FOREST">Forest Clearance</option>
              <option value="CTO">Consent to Operate (CTO)</option>
              <option value="UTILITY_SHIFTING">Utility Shifting</option>
            </select>
          </div>

          <div>
            <label htmlFor="clearance_title" className="block text-xs font-semibold uppercase text-slate-500">
              Clearance Title
            </label>
            <input
              id="clearance_title"
              required
              placeholder="e.g. CRZ Stage 1 NOC"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="clearance_authority" className="block text-xs font-semibold uppercase text-slate-500">
              Authority Name
            </label>
            <input
              id="clearance_authority"
              required
              placeholder="e.g. MoEFCC / State Pollution Board"
              value={authorityName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthorityName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="clearance_status" className="block text-xs font-semibold uppercase text-slate-500">
                Status
              </label>
              <select
                id="clearance_status"
                value={status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as ClearanceStatus)}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div>
              <label htmlFor="clearance_expiry_date" className="block text-xs font-semibold uppercase text-slate-500">
                Expiry Date
              </label>
              <input
                id="clearance_expiry_date"
                type="date"
                value={expiryDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpiryDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="clearance_document_url" className="block text-xs font-semibold uppercase text-slate-500">
              Document URL / Attachment Link
            </label>
            <input
              id="clearance_document_url"
              type="url"
              placeholder="https://example.com/clearance-doc.pdf"
              value={documentUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocumentUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-[10px] font-normal text-slate-500">
              Direct link to approval certificate, NOC, or sanction document.
            </span>
          </div>

          <div>
            <label htmlFor="clearance_remarks" className="block text-xs font-semibold uppercase text-slate-500">
              Remarks / Condition
            </label>
            <input
              id="clearance_remarks"
              placeholder="Optional notes or conditions..."
              value={remarks}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemarks(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Register Clearance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

