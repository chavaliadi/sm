import { useEffect, useState } from "react";
import type { ContractCreate, ContractRead, ContractStatus, ContractUpdate } from "./types";

interface ContractFormProps {
  contract: ContractRead | null;
  tenders: Array<{ id: number; tender_code: string; title: string; project_id: number }>;
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
  issued_date: string;
  milestone_terms: string;
  status: ContractStatus;
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
  issued_date: "",
  milestone_terms: "",
  status: "DRAFT",
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
    issued_date: contract.issued_date ?? "",
    milestone_terms: contract.milestone_terms ?? "",
    status: contract.status,
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

export function ContractFormDialog({
  contract,
  tenders,
  projects,
  isSaving,
  onCancel,
  onSubmit,
}: ContractFormProps) {
  const [values, setValues] = useState<FormValues>(() => toFormValues(contract));

  useEffect(() => {
    setValues(toFormValues(contract));
  }, [contract]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (contract === null) {
      // Create — send full ContractCreate
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
      // Update — send ContractUpdate (no tender_id / project_id / contract_number changes)
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
      };
      await onSubmit(payload);
    }
  }

  const allowedNextStatuses = contract
    ? STATUS_TRANSITIONS[contract.status]
    : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Tender + Project row */}
      {contract === null && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-gray-700">
            Awarded Tender <span className="text-red-500">*</span>
            <select
              required
              value={values.tender_id}
              onChange={(e) => set("tender_id", e.target.value)}
              className={inputCls}
            >
              <option value="">Select an awarded tender</option>
              {tenders.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tender_code} — {t.title}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-gray-700">
            Project <span className="text-red-500">*</span>
            <select
              required
              value={values.project_id}
              onChange={(e) => set("project_id", e.target.value)}
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
        </div>
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
          <input
            value={values.loa_reference}
            onChange={(e) => set("loa_reference", e.target.value)}
            placeholder="Letter of Award number"
            className={inputCls}
          />
        </label>
      </div>

      {/* Title */}
      <label className="grid gap-1.5 text-sm font-medium text-gray-700">
        Contract Title <span className="text-red-500">*</span>
        <input
          required
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          className={inputCls}
        />
      </label>

      {/* Description */}
      <label className="grid gap-1.5 text-sm font-medium text-gray-700">
        Description
        <textarea
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className={`${inputCls} resize-y`}
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
            placeholder="e.g. 50000000"
            className={inputCls}
          />
        </label>

        {contract !== null && (
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
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Start Date
          <input
            type="date"
            value={values.start_date}
            onChange={(e) => set("start_date", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          End Date
          <input
            type="date"
            value={values.end_date}
            onChange={(e) => set("end_date", e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Issued Date
          <input
            type="date"
            value={values.issued_date}
            onChange={(e) => set("issued_date", e.target.value)}
            className={inputCls}
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
          placeholder="Define the contract milestones and payment terms here..."
          className={`${inputCls} resize-y`}
        />
        <span className="text-xs text-gray-500">
          Phase 2 — milestone terms definition only. Progress tracking is Phase 3.
        </span>
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : contract === null ? "Create contract" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
