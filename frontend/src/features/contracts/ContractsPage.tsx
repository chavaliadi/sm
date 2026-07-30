import { useCallback, useEffect, useState } from "react";
import { getProjects } from "@/api/projects";
import { getTenders } from "@/api/tender";
import type { ProjectRead, TenderRead } from "@/types";
import { ContractFormDialog } from "./ContractFormDialog";
import {
  createContract,
  deleteContract,
  getContracts,
  getWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  updateContract,
} from "./api";
import type {
  CancellationReason,
  ContractCreate,
  ContractListFilters,
  ContractRead,
  ContractStatus,
  ContractUpdate,
  WorkOrderCreate,
  WorkOrderRead,
  WorkOrderStatus,
  WorkOrderUpdate,
} from "./types";

// ── Helpers ───────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

function fmt(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function fmtCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getErr(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

const STATUS_COLOR: Record<ContractStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ISSUED: "bg-sky-50 text-sky-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

const WO_STATUS_COLOR: Record<WorkOrderStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ISSUED: "bg-sky-50 text-sky-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-500",
};

// ── Main Page ─────────────────────────────────────────────────────────
export function ContractsPage() {
  // Contracts list state
  const [contracts, setContracts] = useState<ContractRead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ContractListFilters>({});
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  // Projects + awarded tenders for filter + form dropdown
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [awardedTenders, setAwardedTenders] = useState<TenderRead[]>([]);

  // Loading / error
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractRead | null>(null);

  // Expanded work orders panel
  const [expandedContractId, setExpandedContractId] = useState<number | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrderRead[]>([]);
  const [isWoLoading, setIsWoLoading] = useState(false);
  const [isWoFormOpen, setIsWoFormOpen] = useState(false);
  const [woFormValues, setWoFormValues] = useState<WorkOrderCreate>({
    contract_id: 0,
    work_order_number: "",
    title: "",
    description: null,
    scope_of_work: null,
    work_order_value: null,
    start_date: null,
    end_date: null,
  });

  // WO Transition Modal state
  const [woModal, setWoModal] = useState<{
    wo: WorkOrderRead;
    targetStatus: WorkOrderStatus;
  } | null>(null);
  const [woModalRemarks, setWoModalRemarks] = useState("");
  const [woModalReason, setWoModalReason] = useState<CancellationReason | "">("");
  const [isWoModalSaving, setIsWoModalSaving] = useState(false);
  const [woModalError, setWoModalError] = useState<string | null>(null);

  // ── Data loading ────────────────────────────────────────────────────
  const loadContracts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await getContracts(page, PAGE_SIZE, filters);
      setContracts(resp.data);
      setTotal(resp.meta.total);
    } catch (e) {
      setError(getErr(e));
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { void loadContracts(); }, [loadContracts]);

  useEffect(() => {
    async function loadFormData() {
      try {
        const [projResp, tenderResp] = await Promise.all([
          getProjects({ page_size: 100 }),
          getTenders(1, 100),
        ]);
        setProjects(projResp.data);
        // Only AWARDED tenders can be linked to a new contract (D14 rule)
        setAwardedTenders(tenderResp.data.filter((t) => t.status === "AWARDED"));
      } catch (e) {
        setError(getErr(e));
      }
    }
    void loadFormData();
  }, []);

  // ── Contract actions ────────────────────────────────────────────────
  function openCreate() { setEditingContract(null); setIsFormOpen(true); }
  function openEdit(c: ContractRead) { setEditingContract(c); setIsFormOpen(true); }
  function closeForm() { setIsFormOpen(false); setEditingContract(null); }

  async function saveContract(data: ContractCreate | ContractUpdate) {
    setIsSaving(true);
    setError(null);
    try {
      if (editingContract === null) {
        await createContract(data as ContractCreate);
      } else {
        await updateContract(editingContract.id, data as ContractUpdate);
      }
      closeForm();
      await loadContracts();
    } catch (e) {
      setError(getErr(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function removeContract(contractId: number) {
    if (!window.confirm("Delete this contract? Only DRAFT contracts can be removed.")) return;
    setError(null);
    try {
      await deleteContract(contractId);
      if (expandedContractId === contractId) setExpandedContractId(null);
      await loadContracts();
    } catch (e) {
      setError(getErr(e));
    }
  }

  function handleStatusFilter(s: string) {
    setStatusFilter(s);
    setProjectFilter("");   // reset project when status changes
    setPage(1);
    setFilters({
      status: s ? (s as ContractStatus) : undefined,
      project_id: undefined,
    });
  }

  function handleProjectFilter(pid: string) {
    setProjectFilter(pid);
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      project_id: pid ? Number(pid) : undefined,
    }));
  }

  function resetFilters() {
    setProjectFilter("");
    setStatusFilter("");
    setFilters({});
    setPage(1);
  }

  // ── Work order panel ────────────────────────────────────────────────
  async function toggleWorkOrders(contractId: number) {
    if (expandedContractId === contractId) {
      setExpandedContractId(null);
      setWorkOrders([]);
      return;
    }
    setExpandedContractId(contractId);
    setIsWoLoading(true);
    try {
      const resp = await getWorkOrders(contractId);
      setWorkOrders(resp.data);
    } catch (e) {
      setError(getErr(e));
    } finally {
      setIsWoLoading(false);
    }
  }

  function openWoForm(contractId: number) {
    setWoFormValues({
      contract_id: contractId,
      work_order_number: "",
      title: "",
      description: null,
      scope_of_work: null,
      work_order_value: null,
      start_date: null,
      end_date: null,
    });
    setIsWoFormOpen(true);
  }

  async function saveWorkOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await createWorkOrder(woFormValues.contract_id, woFormValues);
      setIsWoFormOpen(false);
      const resp = await getWorkOrders(woFormValues.contract_id);
      setWorkOrders(resp.data);
    } catch (err) {
      setError(getErr(err));
    }
  }

  function openWoTransitionModal(wo: WorkOrderRead, targetStatus: WorkOrderStatus) {
    setWoModal({ wo, targetStatus });
    setWoModalRemarks("");
    setWoModalReason("");
    setWoModalError(null);
  }

  function closeWoModal() {
    setWoModal(null);
    setWoModalRemarks("");
    setWoModalReason("");
    setWoModalError(null);
  }

  async function confirmWoTransition() {
    if (!woModal) return;
    const { wo, targetStatus } = woModal;

    const payload: WorkOrderUpdate = { status: targetStatus };
    if (targetStatus === "COMPLETED") {
      payload.completion_remarks = woModalRemarks.trim();
    }
    if (targetStatus === "CANCELLED") {
      payload.cancellation_reason = woModalReason ? (woModalReason as CancellationReason) : null;
      payload.cancellation_remarks = woModalRemarks.trim();
    }

    setIsWoModalSaving(true);
    setWoModalError(null);
    try {
      await updateWorkOrder(wo.contract_id, wo.id, payload);
      const resp = await getWorkOrders(wo.contract_id);
      setWorkOrders(resp.data);
      closeWoModal();
    } catch (err) {
      setWoModalError(getErr(err));
    } finally {
      setIsWoModalSaving(false);
    }
  }

  async function removeWorkOrder(wo: WorkOrderRead) {
    if (!window.confirm("Delete this work order?")) return;
    setError(null);
    try {
      await deleteWorkOrder(wo.contract_id, wo.id);
      const resp = await getWorkOrders(wo.contract_id);
      setWorkOrders(resp.data);
    } catch (err) {
      setError(getErr(err));
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <section className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-white p-6 shadow-sm sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Pre-Construction · Phase 2
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            Contract & Work Order Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Issue contracts after tender award, define milestone terms, and manage work orders.
          </p>
        </div>
        <button
          id="create-contract-btn"
          onClick={openCreate}
          className="rounded-md bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-800"
        >
          + New Contract
        </button>
      </div>

      {/* Error banner */}
      {error !== null && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Inline form */}
      {isFormOpen && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
          {editingContract === null
            ? "Create a contract"
            : editingContract.status === "CLOSED"
              ? "View contract (Read-Only)"
              : "Edit contract"}
          </h2>
          <ContractFormDialog
            contract={editingContract}
            tenders={awardedTenders as Array<{
              id: number;
              tender_code: string;
              title: string;
              project_id: number;
              contract_value: number | null;
              loa_reference: string | null;
              contract_start_date: string | null;
              contract_end_date: string | null;
            }>}
            projects={projects}
            isSaving={isSaving}
            onCancel={closeForm}
            onSubmit={saveContract}
          />
        </div>
      )}

      {/* ── Filters: Status tabs → Project dropdown ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">

        {/* Row 1: Status tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 mr-1">Status:</span>
          {(["" , "DRAFT", "ISSUED", "ACTIVE", "CLOSED"] as const).map((s) => {
            const label = s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase();
            const isActive = statusFilter === s;
            const tabColor: Record<string, string> = {
              "": isActive ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              DRAFT: isActive ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              ISSUED: isActive ? "bg-sky-700 text-white" : "bg-sky-50 text-sky-700 hover:bg-sky-100",
              ACTIVE: isActive ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
              CLOSED: isActive ? "bg-red-700 text-white" : "bg-red-50 text-red-700 hover:bg-red-100",
            };
            return (
              <button
                key={s}
                id={`status-tab-${s || "all"}`}
                onClick={() => handleStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${tabColor[s]}`}
              >
                {label}
              </button>
            );
          })}

          {/* Active filter pills + reset */}
          {(statusFilter || projectFilter) && (
            <button
              onClick={resetFilters}
              className="ml-auto rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
            >
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* Row 2: Project dropdown — filtered by selected status */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Project:</span>
          <select
            id="filter-project"
            value={projectFilter}
            onChange={(e) => handleProjectFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          >
            <option value="">All projects</option>
            {projects
              .filter((p) =>
                // When a status tab is active, only show projects that have
                // contracts with that status (from current filtered result)
                // When no status filter, show all projects
                statusFilter
                  ? contracts.some((c) => c.project_id === p.id)
                  : true
              )
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_code} — {p.name}
                </option>
              ))}
          </select>
          <span className="text-xs text-gray-400">
            {total} contract{total !== 1 ? "s" : ""} found
          </span>
        </div>
      </div>

      {/* Contracts table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Contracts</h2>
          <span className="text-sm text-gray-500">{total} total</span>
        </div>

        {isLoading ? (
          <p className="p-8 text-center text-sm text-gray-500">Loading contracts...</p>
        ) : contracts.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            No contracts found. Create one after a tender is awarded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Contract</th>
                  <th className="px-5 py-3">Value</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Start</th>
                  <th className="px-5 py-3">End</th>
                  <th className="px-5 py-3">Work Orders</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map((contract) => (
                  <>
                    <tr key={contract.id} className="hover:bg-sky-50/40">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{contract.contract_number}</p>
                        <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">{contract.title}</p>
                        {contract.loa_reference && (
                          <p className="text-xs text-gray-400">LOA: {contract.loa_reference}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-700">{fmtCurrency(contract.contract_value)}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[contract.status]}`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{fmt(contract.start_date)}</td>
                      <td className="px-5 py-4 text-gray-600">{fmt(contract.end_date)}</td>
                      <td className="px-5 py-4">
                        <button
                          id={`work-orders-btn-${contract.id}`}
                          onClick={() => void toggleWorkOrders(contract.id)}
                          className="text-sm font-medium text-sky-700 hover:text-sky-900"
                        >
                          {expandedContractId === contract.id ? "▲ Hide" : "▼ Show"}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <button
                            id={`edit-contract-${contract.id}`}
                            onClick={() => openEdit(contract)}
                            className={`text-sm font-medium ${contract.status === "CLOSED" ? "text-gray-500 hover:text-gray-700" : "text-sky-700 hover:text-sky-900"}`}
                          >
                            {contract.status === "CLOSED" ? "View" : "Edit"}
                          </button>
                          {contract.status === "DRAFT" && (
                            <button
                              id={`delete-contract-${contract.id}`}
                              onClick={() => void removeContract(contract.id)}
                              className="text-sm font-medium text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Work orders panel */}
                    {expandedContractId === contract.id && (
                      <tr key={`wo-${contract.id}`}>
                        <td colSpan={7} className="bg-sky-50/30 px-8 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-gray-700">
                                Work Orders — {contract.contract_number}
                              </h3>
                              {/* Only ISSUED or ACTIVE contracts can have new work orders */}
                              {(contract.status === "ISSUED" || contract.status === "ACTIVE") ? (
                                <button
                                  id={`add-work-order-${contract.id}`}
                                  onClick={() => openWoForm(contract.id)}
                                  className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800"
                                >
                                  + Add Work Order
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400 italic">
                                  {contract.status === "CLOSED" ? "Contract closed — no new work orders" : "Issue contract first"}
                                </span>
                              )}
                            </div>

                            {/* Inline work order create form */}
                            {isWoFormOpen && woFormValues.contract_id === contract.id && (
                              <form
                                onSubmit={saveWorkOrder}
                                className="rounded-lg border border-sky-200 bg-white p-4 shadow-sm space-y-3"
                              >
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <label className="grid gap-1 text-xs font-medium text-gray-700">
                                    Work Order Number *
                                    <input
                                      required
                                      value={woFormValues.work_order_number}
                                      onChange={(e) =>
                                        setWoFormValues((v) => ({ ...v, work_order_number: e.target.value }))
                                      }
                                      placeholder="e.g. WO-001"
                                      className="rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
                                    />
                                  </label>
                                  <label className="grid gap-1 text-xs font-medium text-gray-700">
                                    Title *
                                    <input
                                      required
                                      value={woFormValues.title}
                                      onChange={(e) =>
                                        setWoFormValues((v) => ({ ...v, title: e.target.value }))
                                      }
                                      className="rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
                                    />
                                  </label>
                                </div>
                                <label className="grid gap-1 text-xs font-medium text-gray-700">
                                  Scope of Work
                                  <textarea
                                    rows={2}
                                    value={woFormValues.scope_of_work ?? ""}
                                    onChange={(e) =>
                                      setWoFormValues((v) => ({ ...v, scope_of_work: e.target.value || null }))
                                    }
                                    className="resize-y rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
                                  />
                                </label>
                                <div className="grid gap-3 sm:grid-cols-3">
                                  <label className="grid gap-1 text-xs font-medium text-gray-700">
                                    Value (₹)
                                    <input
                                      type="number"
                                      min={0}
                                      max={contract.contract_value ?? undefined}
                                      value={woFormValues.work_order_value ?? ""}
                                      onChange={(e) =>
                                        setWoFormValues((v) => ({
                                          ...v,
                                          work_order_value: e.target.value ? Number(e.target.value) : null,
                                        }))
                                      }
                                      className="rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
                                    />
                                    {contract.contract_value != null && (
                                      <span className="text-xs text-gray-400">
                                        Contract budget: ₹{contract.contract_value.toLocaleString("en-IN")}
                                      </span>
                                    )}
                                  </label>
                                  <label className="grid gap-1 text-xs font-medium text-gray-700">
                                    Start Date
                                    <input
                                      type="date"
                                      min={contract.start_date ?? undefined}
                                      max={contract.end_date ?? undefined}
                                      value={woFormValues.start_date ?? ""}
                                      onChange={(e) =>
                                        setWoFormValues((v) => ({ ...v, start_date: e.target.value || null }))
                                      }
                                      className="rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
                                    />
                                  </label>
                                  <label className="grid gap-1 text-xs font-medium text-gray-700">
                                    End Date
                                    <input
                                      type="date"
                                      min={woFormValues.start_date ?? contract.start_date ?? undefined}
                                      max={contract.end_date ?? undefined}
                                      value={woFormValues.end_date ?? ""}
                                      onChange={(e) =>
                                        setWoFormValues((v) => ({ ...v, end_date: e.target.value || null }))
                                      }
                                      className="rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-sky-500"
                                    />
                                  </label>
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setIsWoFormOpen(false)}
                                    className="rounded px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="rounded bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800"
                                  >
                                    Create
                                  </button>
                                </div>
                              </form>
                            )}

                            {/* Work orders list */}
                            {isWoLoading ? (
                              <p className="text-xs text-gray-400">Loading work orders...</p>
                            ) : workOrders.length === 0 ? (
                              <p className="text-xs text-gray-400">No work orders yet.</p>
                            ) : (
                              <table className="min-w-full text-xs divide-y divide-gray-200">
                                <thead className="bg-gray-100 text-gray-500 uppercase tracking-wide">
                                  <tr>
                                    <th className="px-4 py-2 text-left">WO Number</th>
                                    <th className="px-4 py-2 text-left">Title</th>
                                    <th className="px-4 py-2 text-left">Value</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-left">Start</th>
                                    <th className="px-4 py-2 text-left">End</th>
                                    <th className="px-4 py-2 text-left">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                  {workOrders.map((wo) => (
                                    <tr key={wo.id} className="hover:bg-sky-50/30">
                                      <td className="px-4 py-2 font-medium text-gray-900">{wo.work_order_number}</td>
                                      <td className="px-4 py-2 text-gray-700 max-w-xs truncate">{wo.title}</td>
                                      <td className="px-4 py-2 text-gray-600">{fmtCurrency(wo.work_order_value)}</td>
                                      <td className="px-4 py-2">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${WO_STATUS_COLOR[wo.status]}`}>
                                          {wo.status.replace("_", " ")}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 text-gray-500">{fmt(wo.start_date)}</td>
                                      <td className="px-4 py-2 text-gray-500">{fmt(wo.end_date)}</td>
                                      <td className="px-4 py-2">
                                        <div className="flex flex-wrap gap-2">
                                          {wo.status === "DRAFT" && (
                                            <button
                                              onClick={() => openWoTransitionModal(wo, "ISSUED")}
                                              className="font-medium text-sky-700 hover:text-sky-900"
                                            >
                                              Issue
                                            </button>
                                          )}
                                          {wo.status === "ISSUED" && (
                                            <>
                                              <button
                                                onClick={() => openWoTransitionModal(wo, "IN_PROGRESS")}
                                                className="font-medium text-amber-700 hover:text-amber-900"
                                              >
                                                Start
                                              </button>
                                              <button
                                                onClick={() => openWoTransitionModal(wo, "CANCELLED")}
                                                className="font-medium text-red-600 hover:text-red-800"
                                              >
                                                Cancel
                                              </button>
                                            </>
                                          )}
                                          {wo.status === "IN_PROGRESS" && (
                                            <>
                                              <button
                                                onClick={() => openWoTransitionModal(wo, "COMPLETED")}
                                                className="font-medium text-emerald-700 hover:text-emerald-900"
                                              >
                                                Complete
                                              </button>
                                              <button
                                                onClick={() => openWoTransitionModal(wo, "CANCELLED")}
                                                className="font-medium text-red-600 hover:text-red-800"
                                              >
                                                Cancel
                                              </button>
                                            </>
                                          )}
                                          {(wo.status === "DRAFT" || wo.status === "CANCELLED") && (
                                            <button
                                              onClick={() => void removeWorkOrder(wo)}
                                              className="font-medium text-red-600 hover:text-red-800"
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 text-sm">
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {/* ── WO Transition Confirmation Modal ── */}
      {woModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">

            {/* Header */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Work Order — {woModal.wo.work_order_number}
              </p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">
                {woModal.targetStatus === "ISSUED" && "Issue this Work Order?"}
                {woModal.targetStatus === "IN_PROGRESS" && "Start this Work Order?"}
                {woModal.targetStatus === "COMPLETED" && "Mark as Completed"}
                {woModal.targetStatus === "CANCELLED" && "Cancel this Work Order"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{woModal.wo.title}</p>
            </div>

            {/* Simple confirmation message for ISSUED / IN_PROGRESS */}
            {(woModal.targetStatus === "ISSUED" || woModal.targetStatus === "IN_PROGRESS") && (
              <p className="rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-800">
                {woModal.targetStatus === "ISSUED"
                  ? "This will formally issue the work order. The contractor will be notified."
                  : "This will mark the work order as in progress. Work has commenced."}
              </p>
            )}

            {/* COMPLETED: require completion remarks */}
            {woModal.targetStatus === "COMPLETED" && (
              <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                Completion Remarks <span className="text-red-500">*</span> (min 10 characters)
                <textarea
                  rows={4}
                  value={woModalRemarks}
                  onChange={(e) => setWoModalRemarks(e.target.value)}
                  placeholder="Describe what was completed, any deliverables received, inspection notes..."
                  className="resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
                {woModalRemarks.length > 0 && woModalRemarks.length < 10 && (
                  <span className="text-xs text-red-600">
                    {woModalRemarks.length}/10 characters minimum.
                  </span>
                )}
              </label>
            )}

            {/* CANCELLED: require reason + remarks */}
            {woModal.targetStatus === "CANCELLED" && (
              <div className="space-y-3">
                <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                  Cancellation Reason <span className="text-red-500">*</span>
                  <select
                    value={woModalReason}
                    onChange={(e) => setWoModalReason(e.target.value as CancellationReason)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="">Select a reason</option>
                    <option value="SCOPE_CHANGE">Scope Change</option>
                    <option value="CONTRACTOR_DEFAULT">Contractor Default</option>
                    <option value="MUTUAL_AGREEMENT">Mutual Agreement</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                  Cancellation Remarks <span className="text-red-500">*</span> (min 10 characters)
                  <textarea
                    rows={3}
                    value={woModalRemarks}
                    onChange={(e) => setWoModalRemarks(e.target.value)}
                    placeholder="Explain why this work order is being cancelled..."
                    className="resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                  {woModalRemarks.length > 0 && woModalRemarks.length < 10 && (
                    <span className="text-xs text-red-600">
                      {woModalRemarks.length}/10 characters minimum.
                    </span>
                  )}
                </label>
              </div>
            )}

            {/* Error from API */}
            {woModalError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{woModalError}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={closeWoModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={() => void confirmWoTransition()}
                disabled={
                  isWoModalSaving
                  || (woModal.targetStatus === "COMPLETED" && woModalRemarks.trim().length < 10)
                  || (woModal.targetStatus === "CANCELLED" && (!woModalReason || woModalRemarks.trim().length < 10))
                }
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                  woModal.targetStatus === "CANCELLED"
                    ? "bg-red-700 hover:bg-red-800"
                    : woModal.targetStatus === "COMPLETED"
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : "bg-sky-700 hover:bg-sky-800"
                }`}
              >
                {isWoModalSaving ? "Saving..."
                  : woModal.targetStatus === "CANCELLED" ? "Confirm Cancellation"
                  : woModal.targetStatus === "COMPLETED" ? "Mark Completed"
                  : woModal.targetStatus === "IN_PROGRESS" ? "Start Work Order"
                  : "Issue Work Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
