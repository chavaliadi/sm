import { useState, useEffect } from "react";
import type { ProjectRead, ProjectCreate, ProjectUpdate } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectToEdit?: ProjectRead | null;
  onSubmit: (data: ProjectCreate | ProjectUpdate) => Promise<void>;
}

const CATEGORIES = [
  "Port Modernization",
  "Connectivity Infrastructure",
  "Coastal Shipping",
  "Port-led Industrialization",
  "Coastal Community Development",
];

const FUNDING_MODELS = [
  "MoPSW Grant-in-aid",
  "PPP (Public-Private Partnership)",
  "Internal Port Resources",
  "State Government Contribution",
  "Hybrid Annuity Model",
];

const LIFECYCLE_STAGES = [
  "INITIATION",
  "APPRAISAL",
  "SANCTIONED",
  "UNDER_EXECUTION",
  "COMPLETED",
];

export function ProjectFormDialog({
  open,
  onOpenChange,
  projectToEdit,
  onSubmit,
}: ProjectFormDialogProps) {
  const isEditing = !!projectToEdit;

  const [formData, setFormData] = useState({
    project_code: "",
    name: "",
    category: CATEGORIES[0],
    state: "",
    port_name: "",
    stakeholder_info: "",
    funding_model: FUNDING_MODELS[0],
    estimated_cost: "",
    approved_cost: "",
    lifecycle_stage: LIFECYCLE_STAGES[0],
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        project_code: projectToEdit.project_code || "",
        name: projectToEdit.name || "",
        category: projectToEdit.category || CATEGORIES[0],
        state: projectToEdit.state || "",
        port_name: projectToEdit.port_name || "",
        stakeholder_info: projectToEdit.stakeholder_info || "",
        funding_model: projectToEdit.funding_model || FUNDING_MODELS[0],
        estimated_cost: projectToEdit.estimated_cost?.toString() || "",
        approved_cost: projectToEdit.approved_cost?.toString() || "",
        lifecycle_stage: projectToEdit.lifecycle_stage || LIFECYCLE_STAGES[0],
      });
    } else {
      setFormData({
        project_code: `SG-2026-${Math.floor(100 + Math.random() * 900)}`,
        name: "",
        category: CATEGORIES[0],
        state: "",
        port_name: "",
        stakeholder_info: "",
        funding_model: FUNDING_MODELS[0],
        estimated_cost: "",
        approved_cost: "",
        lifecycle_stage: LIFECYCLE_STAGES[0],
      });
    }
    setErrorMsg(null);
  }, [projectToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.project_code.trim()) {
      setErrorMsg("Project Code is required.");
      return;
    }
    if (!formData.name.trim()) {
      setErrorMsg("Project Name is required.");
      return;
    }
    if (!formData.port_name.trim()) {
      setErrorMsg("Port Name / Implementing Agency is required.");
      return;
    }
    if (!formData.state.trim()) {
      setErrorMsg("State / Geography is required.");
      return;
    }
    const estCost = parseFloat(formData.estimated_cost);
    if (isNaN(estCost) || estCost <= 0) {
      setErrorMsg("Please enter a valid Estimated Cost (greater than 0).");
      return;
    }

    const appCost = formData.approved_cost.trim()
      ? parseFloat(formData.approved_cost)
      : null;

    setSubmitting(true);
    try {
      if (isEditing) {
        const payload: ProjectUpdate = {
          project_code: formData.project_code,
          name: formData.name,
          category: formData.category,
          state: formData.state,
          port_name: formData.port_name,
          stakeholder_info: formData.stakeholder_info || null,
          funding_model: formData.funding_model,
          estimated_cost: estCost,
          approved_cost: appCost,
          lifecycle_stage: formData.lifecycle_stage,
        };
        await onSubmit(payload);
      } else {
        const payload: ProjectCreate = {
          project_code: formData.project_code,
          name: formData.name,
          category: formData.category,
          state: formData.state,
          port_name: formData.port_name,
          stakeholder_info: formData.stakeholder_info || null,
          funding_model: formData.funding_model,
          estimated_cost: estCost,
          approved_cost: appCost,
          lifecycle_stage: formData.lifecycle_stage,
        };
        await onSubmit(payload);
      }
      onOpenChange(false);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || "Failed to save project.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 shadow-xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            {isEditing ? "Edit Project Configuration" : "Guided Project Creation"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {isEditing
              ? "Update project parameters, cost estimates, and lifecycle stage."
              : "Register a new port-led infrastructure project under Sagarmala 2.0."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive" className="my-2">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="project_code" className="font-semibold text-slate-700">
                Project Code <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="project_code"
                placeholder="e.g. SG-2026-001"
                value={formData.project_code}
                onChange={(e) =>
                  setFormData({ ...formData, project_code: e.target.value })
                }
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="font-semibold text-slate-700">
                Category <span className="text-rose-500">*</span>
              </Label>
              <select
                id="category"
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                disabled={submitting}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="font-semibold text-slate-700">
              Project Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. VPT Berth Modernization Phase II"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="port_name" className="font-semibold text-slate-700">
                Port Name / Implementing Agency <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="port_name"
                placeholder="e.g. Visakhapatnam Port Authority"
                value={formData.port_name}
                onChange={(e) =>
                  setFormData({ ...formData, port_name: e.target.value })
                }
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="state" className="font-semibold text-slate-700">
                State / Geography <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="state"
                placeholder="e.g. Andhra Pradesh"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="funding_model" className="font-semibold text-slate-700">
                Funding Model / Instrument <span className="text-rose-500">*</span>
              </Label>
              <select
                id="funding_model"
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950"
                value={formData.funding_model}
                onChange={(e) =>
                  setFormData({ ...formData, funding_model: e.target.value })
                }
                disabled={submitting}
              >
                {FUNDING_MODELS.map((fm) => (
                  <option key={fm} value={fm}>
                    {fm}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lifecycle_stage" className="font-semibold text-slate-700">
                Lifecycle Stage <span className="text-rose-500">*</span>
              </Label>
              <select
                id="lifecycle_stage"
                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950"
                value={formData.lifecycle_stage}
                onChange={(e) =>
                  setFormData({ ...formData, lifecycle_stage: e.target.value })
                }
                disabled={submitting}
              >
                {LIFECYCLE_STAGES.map((stg) => (
                  <option key={stg} value={stg}>
                    {stg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="estimated_cost" className="font-semibold text-slate-700">
                Estimated Cost (₹ Cr) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="estimated_cost"
                type="number"
                step="0.01"
                placeholder="e.g. 120.50"
                value={formData.estimated_cost}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_cost: e.target.value })
                }
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="approved_cost" className="font-semibold text-slate-700">
                Approved Sanction Cost (₹ Cr)
              </Label>
              <Input
                id="approved_cost"
                type="number"
                step="0.01"
                placeholder="Leave blank if pending"
                value={formData.approved_cost}
                onChange={(e) =>
                  setFormData({ ...formData, approved_cost: e.target.value })
                }
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stakeholder_info" className="font-semibold text-slate-700">
              Stakeholder Information & Contacts
            </Label>
            <Input
              id="stakeholder_info"
              placeholder="e.g. Chief Engineer S. K. Murthy (sk.murthy@vpt.gov.in)"
              value={formData.stakeholder_info}
              onChange={(e) =>
                setFormData({ ...formData, stakeholder_info: e.target.value })
              }
              disabled={submitting}
            />
          </div>

          <DialogFooter className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-[100px]">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Project"
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
