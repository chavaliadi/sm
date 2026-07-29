import { useEffect, useState } from "react";
import type { ClosureReason, ContractCreate, ContractRead, ContractStatus, ContractUpdate } from "./types";

// ── Full tender shape needed for LOA auto-fill ────────────────────────
interface TenderOption {
  id: number;
  tender_code: string;
  title: string;
  project_id: number;
  contract_value: number | null;
  loa_reference: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
}

interface ContractFormProps {
  contract: ContractRead | null;
  tenders: TenderOption[];
  projects: Array<{ id: number; project_code: string; name: string }>;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (data: ContractCreate | ContractUpdate) => Promise<void>;
}

interface FormValues {
  tender_id: string;
  project_id: string;
  contract_number: string;
  title: string;
  description: string;
  contract_value: string;
  loa_reference: string;
  start_date: string;
  end_date: string;
  /** The LOA end date — used as the minimum boundary for end_date validation */
  loa_end_date: string;
  issued_date: string;
  milestone_terms: string;
  status: ContractStatus;
  closure_reason: ClosureReason | "";
  closure_remarks: string;
}

const emptyValues: FormValues = {
  tender_id: "",
  project_id: "",
  contract_number: "",
  title: "",
  description: "",
  contract_value: "",
  loa_reference: "",
  start_date: "",
  end_date: "",
  loa_end_date: "",
  issued_date: "",
  milestone_terms: "",
  status: "DRAFT",
  closure_reason: "",
  closure_remarks: "",
};

function toFormValues(contract: ContractRead | null): FormValues {
  if (contract === null) return emptyValues;
  return {
    tender_id: String(contract.tender_id),
    project_id: String(contract.project_id),
    contract_number: contract.contract_number,
    title: contract.title,
    description: contract.description ?? "",
    contract_value: contract.contract_value !== null ? String(contract.contract_value) : "",
    loa_reference: contract.loa_reference ?? "",
    start_date: contract.start_date ?? "",
    end_date: contract.end_date ?? "",
    loa_end_date: contract.end_date ?? "", // for edit: use saved end_date as minimum
    issued_date: contract.issued_date ?? "",
    milestone_terms: contract.milestone_terms ?? "",
    status: contract.status,
    closure_reason: contract.closure_reason ?? "",
    closure_remarks: contract.closure_remarks ?? "",
  };
}

const STATUS_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  DRAFT:  ["ISSUED"],
  ISSUED: ["ACTIVE", "CLOSED"],
  ACTIVE: ["CLOSED"],
  CLOSED: [],
};

const inputCls =
  "rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 w-full";

const readonlyCls =
  "rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600 shadow-sm w-full cursor-not-allowed";

export function ContractFormDialog({
  contract,
  tenders,
  projects,
  isSaving,
  onCancel,
  onSubmit,
}: ContractFormProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(contract));
  const [endDateError, setEndDateError] = useState<string>("");

  useEffect(() => {
    setValues(toFormValues(contract));
    setEndDateError("");
  }, [contract]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // ── Step 1: When Project is selected, reset tender and auto-select if only one ──
  function handleProjectChange(projectId: string) {
    const filtered = tenders.filter((t) => String(t.project_id) === projectId);
    if (filtered.length === 1) {
      // Auto-select the single awarded tender and fill LOA data
      handleTenderChange(String(filtered[0].id), filtered, projectId);
    } else {
      setValues((prev) => ({
        ...prev,
        project_id: projectId,
        tender_id: "",
        title: "",
        contract_value: "",
        loa_reference: "",
        start_date: "",
        end_date: "",
        loa_end_date: "",
      }));
    }
  }

  // ── Step 2: When Tender is selected, auto-fill LOA payload ──
  function handleTenderChange(
    tenderId: string,
    pool: TenderOption[] = tenders,
    projectId?: string,
  ) {
    const tender = pool.find((t) => String(t.id) === tenderId);
    if (!tender) {
      setValues((prev) => ({ ...prev, tender_id: tenderId }));
      return;
    }
    setEndDateError("");
    setValues((prev) => ({
      ...prev,
      project_id: projectId ?? prev.project_id,
      tender_id: tenderId,
      title: tender.title,
      contract_value: tender.contract_value !== null ? String(tender.contract_value) : "",
      loa_reference: tender.loa_reference ?? "",
      start_date: tender.contract_start_date ?? "",          // LOCKED to LOA start
      end_date: tender.contract_end_date ?? "",              // Pre-filled, editable
      loa_end_date: tender.contract_end_date ?? "",          // Minimum boundary
    }));
  }

  // ── End date change — validate >= loa_end_date ──
  function handleEndDateChange(val: string) {
    set("end_date", val);
    if (values.loa_end_date && val && val < values.loa_end_date) {
      setEndDateError(
        `End date must be on or after the LOA completion date (${values.loa_end_date}).`,
      );
    } else {
      setEndDateError("");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Block submission if end date is invalid
    if (endDateError) return;

    // Block submission if closing manually without required fields
    if (values.status === "CLOSED" && contract?.status !== "CLOSED") {
      const isNaturalClosure = false; // server decides; we validate closure_reason UI-side
      if (!isNaturalClosure && !values.closure_reason) return;
    }

    if (contract === null) {
      const payload: ContractCreate = {
        tender_id: Number(values.tender_id),
        project_id: Number(values.project_id),
        contract_number: values.contract_number.trim(),
        title: values.title.trim(),
        description: values.description.trim() || null,
        contract_value: values.contract_value ? Number(values.contract_value) : null,
        loa_reference: values.loa_reference.trim() || null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        issued_date: values.issued_date || null,
        milestone_terms: values.milestone_terms.trim() || null,
      };
      await onSubmit(payload);
    } else {
      const payload: ContractUpdate = {
        title: values.title.trim(),
        description: values.description.trim() || null,
        status: values.status,
        contract_value: values.contract_value ? Number(values.contract_value) : null,
        loa_reference: values.loa_reference.trim() || null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        issued_date: values.issued_date || null,
        milestone_terms: values.milestone_terms.trim() || null,
        closure_reason: values.closure_reason ? (values.closure_reason as ClosureReason) : null,
        closure_remarks: values.closure_remarks.trim() || null,
      };
      await onSubmit(payload);
    }
  }

  const allowedNextStatuses = contract ? STATUS_TRANSITIONS[contract.status] : [];

  // Tenders filtered by selected project (for create mode)
  const filteredTenders = values.project_id
    ? tenders.filter((t) => String(t.project_id) === values.project_id)
    : tenders;

  // Is this edit form currently being closed manually by the officer?
  const isClosingNow = contract !== null
    && contract.status !== "CLOSED"
    && values.status === "CLOSED";

  // Is the contract already closed (read-only mode)?
  const isAlreadyClosed = contract?.status === "CLOSED";

  const canSave = !endDateError && (!isClosingNow || !!values.closure_reason);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── CREATE MODE: Project first, then Awarded Tender ── */}
      {contract === null && (
        <>
          {/* Step 1 — Project */}
          <label className="grid gap-1.5 text-sm font-medium text-gray-700">
            Project <span className="text-red-500">*</span>
            <select
              required
              value={values.project_id}
              onChange={(e) => handleProjectChange(e.target.value)}
              className={inputCls}
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_code} — {p.name}
                </option>
              ))}
            </select>
          </label>

          {/* Step 2 — Awarded Tender (filtered by project) */}
          <label className="grid gap-1.5 text-sm font-medium text-gray-700">
            Awarded Tender <span className="text-red-500">*</span>
            <select
              required
              value={values.tender_id}
              onChange={(e) => handleTenderChange(e.target.value)}
              disabled={!values.project_id}
              className={values.project_id ? inputCls : readonlyCls}
            >
              <option value="">
                {values.project_id
                  ? filteredTenders.length === 0
                    ? "No awarded tenders for this project"
                    : "Select an awarded tender"
                  : "Select a project first"}
              </option>
              {filteredTenders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tender_code} — {t.title}
                </option>
              ))}
            </select>
            {values.project_id && filteredTenders.length === 0 && (
              <span className="text-xs text-amber-600">
                ⚠ No awarded tenders found for this project.
              </span>
            )}
          </label>
        </>
      )}

      {/* Contract number + LOA reference */}
      <div className="grid gap-4 sm:grid-cols-2">
        {contract === null && (
          <label className="grid gap-1.5 text-sm font-medium text-gray-700">
            Contract Number <span className="text-red-500">*</span>
            <input
              required
              value={values.contract_number}
              onChange={(e) => set("contract_number", e.target.value)}
              placeholder="e.g. CNT-2025-001"
              className={inputCls}
            />
          </label>
        )}
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          LOA Reference
          {contract === null ? (
            // Auto-filled from tender — show as read-only badge
            <div className="flex items-center gap-2">
              <input
                value={values.loa_reference}
                readOnly
                placeholder="Auto-filled from selected tender"
                className={readonlyCls}
              />
              {values.loa_reference && (
                <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                  LOA
                </span>
              )}
            </div>
          ) : (
            <input
              value={values.loa_reference}
              onChange={(e) => set("loa_reference", e.target.value)}
              readOnly={isAlreadyClosed}
              placeholder="Letter of Award number"
              className={isAlreadyClosed ? readonlyCls : inputCls}
            />
          )}
        </label>
      </div>

      {/* Title */}
      <label className="grid gap-1.5 text-sm font-medium text-gray-700">
        Contract Title <span className="text-red-500">*</span>
        <input
          required
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          readOnly={isAlreadyClosed}
          className={isAlreadyClosed ? readonlyCls : inputCls}
        />
      </label>

      {/* Description */}
      <label className="grid gap-1.5 text-sm font-medium text-gray-700">
        Description
        <textarea
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          readOnly={isAlreadyClosed}
          className={`${isAlreadyClosed ? readonlyCls : inputCls} resize-y`}
        />
      </label>

      {/* Contract value + Status (edit only) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Contract Value (₹)
          <input
            type="number"
            min={0}
            step={0.01}
            value={values.contract_value}
            onChange={(e) => set("contract_value", e.target.value)}
            readOnly={isAlreadyClosed}
            placeholder="e.g. 50000000"
            className={isAlreadyClosed ? readonlyCls : inputCls}
          />
        </label>

        {contract !== null && !isAlreadyClosed && (
          <label className="grid gap-1.5 text-sm font-medium text-gray-700">
            Advance Status
            <select
              value={values.status}
              onChange={(e) => set("status", e.target.value as ContractStatus)}
              className={inputCls}
            >
              <option value={contract.status}>{contract.status} (current)</option>
              {allowedNextStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="text-xs text-gray-500">
              Only valid next states are shown.
            </span>
          </label>
        )}
      </div>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Start Date — LOCKED to LOA date in create mode, full lock when CLOSED */}
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Start Date
          {contract === null ? (
            <div className="relative">
              <input
                type="date"
                value={values.start_date}
                readOnly
                className={readonlyCls}
              />
              <span className="absolute right-2 top-2 text-xs text-gray-400">🔒 LOA</span>
            </div>
          ) : (
            <input
              type="date"
              value={values.start_date}
              onChange={(e) => set("start_date", e.target.value)}
              readOnly={isAlreadyClosed}
              className={isAlreadyClosed ? readonlyCls : inputCls}
            />
          )}
          {contract === null && (
            <span className="text-xs text-gray-500">Locked to LOA commencement date.</span>
          )}
        </label>

        {/* End Date */}
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          End Date
          <input
            type="date"
            value={values.end_date}
            min={values.loa_end_date || undefined}
            onChange={(e) => handleEndDateChange(e.target.value)}
            readOnly={isAlreadyClosed}
            className={isAlreadyClosed ? readonlyCls : endDateError ? `${inputCls} border-red-400 focus:border-red-500 focus:ring-red-100` : inputCls}
          />
          {endDateError ? (
            <span className="text-xs text-red-600">{endDateError}</span>
          ) : values.loa_end_date && contract === null ? (
            <span className="text-xs text-gray-500">
              Must be on or after LOA target date ({values.loa_end_date}).
            </span>
          ) : null}
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Issued Date
          <input
            type="date"
            value={values.issued_date}
            onChange={(e) => set("issued_date", e.target.value)}
            readOnly={isAlreadyClosed}
            className={isAlreadyClosed ? readonlyCls : inputCls}
          />
        </label>
      </div>

      {/* Milestone terms */}
      <label className="grid gap-1.5 text-sm font-medium text-gray-700">
        Milestone Terms
        <textarea
          rows={4}
          value={values.milestone_terms}
          onChange={(e) => set("milestone_terms", e.target.value)}
          readOnly={isAlreadyClosed}
          placeholder="Define the contract milestones and payment terms here..."
          className={`${isAlreadyClosed ? readonlyCls : inputCls} resize-y`}
        />
        <span className="text-xs text-gray-500">
          Phase 2 — milestone terms definition only. Progress tracking is Phase 3.
        </span>
      </label>

      {/* ── CLOSURE SECTION: shown when officer is about to close manually ── */}
      {isClosingNow && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-4">
          <p className="text-sm font-semibold text-red-700">
            ⚠️ Closing this contract early — please provide a reason
          </p>

          <label className="grid gap-1.5 text-sm font-medium text-gray-700">
            Closure Reason <span className="text-red-500">*</span>
            <select
              required
              value={values.closure_reason}
              onChange={(e) => set("closure_reason", e.target.value as ClosureReason)}
              className={inputCls}
            >
              <option value="">Select a closure reason</option>
              <option value="TERMINATED_DEFAULT">Terminated for Default</option>
              <option value="SHORT_CLOSED_MUTUAL">Short-Closed by Mutual Consent</option>
              <option value="FORCE_MAJEURE">Force Majeure</option>
            </select>
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-gray-700">
            Closure Remarks <span className="text-red-500">*</span> (min 10 characters)
            <textarea
              required
              rows={3}
              minLength={10}
              value={values.closure_remarks}
              onChange={(e) => set("closure_remarks", e.target.value)}
              placeholder="Describe the reason for early closure in detail..."
              className={`${inputCls} resize-y`}
            />
            {values.closure_remarks.length > 0 && values.closure_remarks.length < 10 && (
              <span className="text-xs text-red-600">
                Remarks must be at least 10 characters ({values.closure_remarks.length}/10).
              </span>
            )}
          </label>
        </div>
      )}

      {/* ── ALREADY CLOSED: show closure info read-only ── */}
      {isAlreadyClosed && contract.closure_reason && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Closure Record</p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Reason: </span>
            {contract.closure_reason.replace(/_/g, " ")}
          </p>
          {contract.closure_remarks && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Remarks: </span>
              {contract.closure_remarks}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          {isAlreadyClosed ? "Close" : "Cancel"}
        </button>
        {!isAlreadyClosed && (
          <button
            type="submit"
            disabled={isSaving || !canSave}
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : contract === null ? "Create contract" : "Save changes"}
          </button>
        )}
      </div>
    </form>
  );
}
