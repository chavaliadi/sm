import { ExternalLink, CheckCircle, ShieldCheck, Clock } from "lucide-react";
import type { Contractor, ContractorStatus } from "./types";

interface ContractorTableProps {
  contractors: Contractor[];
  loading: boolean;
  onEdit?: (contractor: Contractor) => void;
  onStatusTransition?: (id: number, nextStatus: ContractorStatus) => void;
  onDelete?: (id: number) => void;
}

export function ContractorTable({
  contractors,
  loading,
  onEdit,
  onStatusTransition,
  onDelete,
}: ContractorTableProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-500">
        Loading contractor directory...
      </div>
    );
  }

  if (contractors.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 bg-white">
        <p className="font-semibold text-slate-700">No Contractors Found</p>
        <p className="mt-1 text-xs text-slate-400">
          No registered contractors match your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                Contractor & Reg. No
              </th>
              <th scope="col" className="px-4 py-3">
                Contact Person
              </th>
              <th scope="col" className="px-4 py-3">
                Org Type & Address
              </th>
              <th scope="col" className="px-4 py-3">
                Verification Doc
              </th>
              <th scope="col" className="px-4 py-3">
                Empanelment Status
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {contractors.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  <div className="mt-0.5 inline-block font-mono text-[11px] font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded">
                    {c.registration_number}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{c.contact_person}</div>
                  <div className="text-[11px] text-slate-500">{c.email}</div>
                  <div className="text-[11px] text-slate-400">{c.phone}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800">
                    {c.organization_type || "Standard"}
                  </span>
                  {c.address && (
                    <div className="mt-1 text-[11px] text-slate-500 truncate max-w-[200px]">
                      {c.address}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {c.verification_document_url ? (
                    <a
                      href={c.verification_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-medium text-sky-700 hover:text-sky-900 underline"
                    >
                      <span>View Doc</span>
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      c.status === "Registered"
                        ? "bg-amber-100 text-amber-800"
                        : c.status === "Verified"
                        ? "bg-sky-100 text-sky-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {c.status === "Registered" && <Clock className="h-3 w-3 text-amber-600" />}
                    {c.status === "Verified" && <ShieldCheck className="h-3 w-3 text-sky-600" />}
                    {c.status === "Empanelled" && <CheckCircle className="h-3 w-3 text-emerald-600" />}
                    {c.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Sequential Status Transition Action */}
                    {onStatusTransition && c.status === "Registered" && (
                      <button
                        type="button"
                        onClick={() => onStatusTransition(c.id, "Verified")}
                        className="rounded bg-sky-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-800 shadow-sm"
                      >
                        Verify Doc
                      </button>
                    )}
                    {onStatusTransition && c.status === "Verified" && (
                      <button
                        type="button"
                        onClick={() => onStatusTransition(c.id, "Empanelled")}
                        className="rounded bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800 shadow-sm"
                      >
                        Empanell
                      </button>
                    )}

                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-800"
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
      </div>
    </div>
  );
}
