import { useState, useEffect, type FormEvent } from "react";
import { X } from "lucide-react";
import type { ContractorCreatePayload, OrganizationType } from "./types";

interface ContractorFormDialogProps {
  open: boolean;
  initialValues?: Partial<ContractorCreatePayload> | null;
  onClose: () => void;
  onSubmit: (payload: ContractorCreatePayload) => Promise<void>;
}

const ORG_TYPES: OrganizationType[] = [
  "Private Limited",
  "Partnership",
  "Sole Proprietorship",
  "Joint Venture",
  "PSU",
];

export function ContractorFormDialog({
  open,
  initialValues,
  onClose,
  onSubmit,
}: ContractorFormDialogProps) {
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [orgType, setOrgType] = useState<string>("Private Limited");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      setName(initialValues.name || "");
      setRegNo(initialValues.registration_number || "");
      setOrgType(initialValues.organization_type || "Private Limited");
      setContactPerson(initialValues.contact_person || "");
      setEmail(initialValues.email || "");
      setPhone(initialValues.phone || "");
      setAddress(initialValues.address || "");
      setDocumentUrl(initialValues.verification_document_url || "");
    } else {
      setName("");
      setRegNo(`REG-${Math.floor(1000 + Math.random() * 9000)}`);
      setOrgType("Private Limited");
      setContactPerson("");
      setEmail("");
      setPhone("");
      setAddress("");
      setDocumentUrl("");
    }
    setError(null);
  }, [initialValues, open]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !regNo.trim() || !contactPerson.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: ContractorCreatePayload = {
      name: name.trim(),
      registration_number: regNo.trim(),
      organization_type: orgType,
      contact_person: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      verification_document_url: documentUrl.trim() || undefined,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const resErr = (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error;
        setError(resErr?.message || "Failed to save contractor record.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to save contractor record.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md hover:bg-slate-100"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-bold text-slate-900">
          {initialValues ? "Edit Contractor Profile" : "Register New Contractor"}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Enter contractor registration details, nodal contact info, and verification URL.
        </p>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="contractor_name" className="block text-xs font-medium text-slate-700">
                Company / Contractor Name *
              </label>
              <input
                id="contractor_name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. L&T Infrastructure Development Ltd"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="reg_no" className="block text-xs font-medium text-slate-700">
                Registration Number *
              </label>
              <input
                id="reg_no"
                type="text"
                required
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. GSTIN / REG-8921"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="org_type" className="block text-xs font-medium text-slate-700">
                Organization Type *
              </label>
              <select
                id="org_type"
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="contact_person" className="block text-xs font-medium text-slate-700">
                Contact Person *
              </label>
              <input
                id="contact_person"
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Vikramaditya Roy"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-700">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. contact@ltinfra.com"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-slate-700">
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-xs font-medium text-slate-700">
              Registered Office Address
            </label>
            <textarea
              id="address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. L&T House, Ballard Estate, Mumbai 400001"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label htmlFor="document_url" className="block text-xs font-medium text-slate-700">
              Verification Document Link (URL)
            </label>
            <input
              id="document_url"
              type="url"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="e.g. https://sagarmala.gov.in/docs/vpa-contractor-reg.pdf"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-sky-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Contractor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
