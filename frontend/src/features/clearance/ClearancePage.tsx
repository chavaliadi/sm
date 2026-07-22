import { useEffect, useState, useCallback } from "react";
import { Plus, ShieldAlert, CheckCircle, Clock, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClearances, getClearanceSummary, deleteClearance } from "./api";
import { ClearanceFormDialog } from "./ClearanceFormDialog";
import type { Clearance, ClearanceExpirySummary } from "./types";

export function ClearancePage() {
  const [clearances, setClearances] = useState<Clearance[]>([]);
  const [summary, setSummary] = useState<ClearanceExpirySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, summaryRes] = await Promise.all([
        getClearances({ page: 1, page_size: 50, clearance_type: typeFilter || undefined }),
        getClearanceSummary(),
      ]);
      setClearances(listRes.data || []);
      setSummary(summaryRes.data);
    } catch (err: any) {
      setError(err.message || "Failed to load statutory clearance records");
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to soft-delete this clearance record?")) return;
    try {
      await deleteClearance(id);
      void fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to delete clearance");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Land Acquisition & Statutory Clearances
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track statutory approvals, environmental clearances, and expiry monitoring.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Clearance
        </Button>
      </div>

      {/* Expiry Monitoring KPI Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase">Total Tracked</span>
              <FileCheck className="h-4 w-4 text-blue-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{summary.total_clearances}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase">Approved</span>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{summary.approved_count}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase">Expiring (30 Days)</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600">{summary.expiring_soon_30_days}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase">Expired / Pending</span>
              <ShieldAlert className="h-4 w-4 text-rose-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-600">{summary.expired_count + summary.pending_count}</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase text-slate-500">Type Filter:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
          >
            <option value="">All Clearance Types</option>
            <option value="LAND_ACQUISITION">Land Acquisition</option>
            <option value="CRZ">CRZ Clearance</option>
            <option value="EC">Environmental Clearance (EC)</option>
            <option value="FOREST">Forest Clearance</option>
            <option value="CTO">Consent to Operate (CTO)</option>
            <option value="UTILITY_SHIFTING">Utility Shifting</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-slate-500">
          Loading clearance records...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : clearances.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No statutory clearances found matching filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Title & Authority</th>
                <th className="px-4 py-3">Project ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {clearances.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{item.clearance_type}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.authority_name}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">Project #{item.project_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-rose-600 hover:text-rose-700"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Dialog */}
      <ClearanceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
export default ClearancePage;
