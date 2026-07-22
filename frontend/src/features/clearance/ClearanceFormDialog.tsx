import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createClearance } from "./api";
import type { ClearanceType, ClearanceStatus } from "./types";

interface ClearanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ClearanceFormDialog({ open, onOpenChange, onSuccess }: ClearanceFormDialogProps) {
  const [projectId, setProjectId] = useState<string>("1");
  const [clearanceType, setClearanceType] = useState<ClearanceType>("LAND_ACQUISITION");
  const [title, setTitle] = useState<string>("");
  const [authorityName, setAuthorityName] = useState<string>("");
  const [status, setStatus] = useState<ClearanceStatus>("PENDING");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      await createClearance({
        project_id: parseInt(projectId, 10),
        clearance_type: clearanceType,
        title,
        authority_name: authorityName,
        status,
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        remarks: remarks || undefined,
      });
      onSuccess();
      onOpenChange(false);
      setTitle("");
      setAuthorityName("");
      setRemarks("");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Failed to create clearance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Register Statutory Clearance</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Project ID</label>
            <Input
              type="number"
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Clearance Type</label>
            <select
              value={clearanceType}
              onChange={(e) => setClearanceType(e.target.value as ClearanceType)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm"
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
            <label className="text-xs font-semibold uppercase text-slate-500">Clearance Title</label>
            <Input
              required
              placeholder="e.g. CRZ Stage 1 NOC"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Authority Name</label>
            <Input
              required
              placeholder="e.g. MoEFCC / State Pollution Board"
              value={authorityName}
              onChange={(e) => setAuthorityName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ClearanceStatus)}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-sm"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Expiry Date</label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Remarks / Condition</label>
            <Input
              placeholder="Optional notes or conditions..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="mt-1"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-blue-600 text-white">
              {submitting ? "Saving..." : "Register Clearance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
