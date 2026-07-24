import { useEffect, useState, useCallback } from "react";
import { Plus, Users, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import {
  getContractors,
  getContractorSummary,
  createContractor,
  updateContractor,
  updateContractorStatus,
  deleteContractor,
} from "./api";
import { ContractorTable } from "./ContractorTable";
import { ContractorFormDialog } from "./ContractorFormDialog";
import type {
  Contractor,
  ContractorCreatePayload,
  ContractorStatus,
  ContractorSummary,
} from "./types";

export function ContractorPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [summary, setSummary] = useState<ContractorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orgTypeFilter, setOrgTypeFilter] = useState("");

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, summaryRes] = await Promise.all([
        getContractors({
          page: 1,
          page_size: 100,
          status: statusFilter || undefined,
          organization_type: orgTypeFilter || undefined,
          search: search.trim() || undefined,
        }),
        getContractorSummary(),
      ]);
      setContractors(listRes.data || []);
      setSummary(summaryRes.data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load contractor directory"
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, orgTypeFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleCreateOpen = () => {
    setEditingContractor(null);
    setDialogOpen(true);
  };

  const handleEditOpen = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setDialogOpen(true);
  };

  const handleFormSubmit = async (payload: ContractorCreatePayload) => {
    if (editingContractor) {
      await updateContractor(editingContractor.id, payload);
    } else {
      await createContractor(payload);
    }
    void fetchData();
  };

  const handleStatusTransition = async (
    id: number,
    nextStatus: ContractorStatus
  ) => {
    try {
      await updateContractorStatus(id, nextStatus);
      void fetchData();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const resErr = (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error;
        alert(resErr?.message || "Failed to update contractor status.");
      } else {
        alert(err instanceof Error ? err.message : "Failed to update contractor status");
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to soft-delete this contractor record?"
      )
    ) {
      return;
    }
    try {
      await deleteContractor(id);
      void fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete contractor");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Contractor Directory & Empanelment
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage contractor registration, document verification, and empanelment workflow.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateOpen}
          className="inline-flex items-center rounded-md bg-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-800 focus:outline-none"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Register Contractor
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Contractors
              </span>
              <Users className="h-4 w-4 text-sky-700" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {summary.total_contractors}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Registered
              </span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {summary.registered_count}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Verified
              </span>
              <ShieldCheck className="h-4 w-4 text-sky-700" />
            </div>
            <p className="mt-2 text-2xl font-bold text-sky-700">
              {summary.verified_count}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Empanelled
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600">
              {summary.empanelled_count}
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search contractor, reg no, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:w-64"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="Registered">Registered</option>
            <option value="Verified">Verified</option>
            <option value="Empanelled">Empanelled</option>
          </select>

          <select
            value={orgTypeFilter}
            onChange={(e) => setOrgTypeFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Organization Types</option>
            <option value="Private Limited">Private Limited</option>
            <option value="Partnership">Partnership</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Joint Venture">Joint Venture</option>
            <option value="PSU">PSU</option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatusFilter("");
            setOrgTypeFilter("");
          }}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          Reset Filters
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <p className="font-semibold">Error Loading Data</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* Table */}
      <ContractorTable
        contractors={contractors}
        loading={loading}
        onEdit={handleEditOpen}
        onStatusTransition={handleStatusTransition}
        onDelete={handleDelete}
      />

      {/* Form Dialog */}
      <ContractorFormDialog
        open={dialogOpen}
        initialValues={editingContractor}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
