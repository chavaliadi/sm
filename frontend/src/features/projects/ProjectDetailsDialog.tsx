import type { ProjectRead } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/common/StatusPill";
import { AmountDisplay } from "@/components/common/AmountDisplay";
import { Edit2, Trash2, Calendar, Building, DollarSign, MapPin, Tag } from "lucide-react";

interface ProjectDetailsDialogProps {
  project: ProjectRead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (project: ProjectRead) => void;
  onDelete?: (project: ProjectRead) => void;
}

export function ProjectDetailsDialog({
  project,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ProjectDetailsDialogProps) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 shadow-xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                {project.project_code}
              </span>
              <StatusPill type="lifecycle" status={project.lifecycle_stage} size="sm" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-800 leading-tight">
            {project.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Consolidated project configuration, classification metrics, and lifecycle stage details.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4 text-sm">
          {/* Classification & Agency Info */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <div className="flex items-start gap-2.5">
              <Tag className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Category
                </span>
                <span className="font-semibold text-slate-800">{project.category}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <DollarSign className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Funding Model / Instrument
                </span>
                <span className="font-semibold text-slate-800">{project.funding_model}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Building className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Implementing Agency / Port
                </span>
                <span className="font-semibold text-slate-800">{project.port_name}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Geography / State
                </span>
                <span className="font-semibold text-slate-800">{project.state}</span>
              </div>
            </div>
          </div>

          {/* Investment & Sanction Metrics */}
          <div className="grid grid-cols-2 gap-4 p-4 border border-slate-200 rounded-xl bg-white">
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Estimated Investment
              </span>
              <span className="text-lg font-bold text-slate-800 mt-0.5 block">
                ₹<AmountDisplay amount={project.estimated_cost} /> Cr
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Approved Sanction Cost
              </span>
              {project.approved_cost ? (
                <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
                  ₹<AmountDisplay amount={project.approved_cost} /> Cr
                </span>
              ) : (
                <span className="text-sm font-medium text-amber-600 mt-1 block">
                  Pending Sanction
                </span>
              )}
            </div>
          </div>

          {/* Stakeholders */}
          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Key Stakeholders & Contacts
            </span>
            <span className="font-medium text-slate-700">
              {project.stakeholder_info || "No specific stakeholder contact logged."}
            </span>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Created: {new Date(project.created_at).toLocaleDateString("en-IN")}
            </span>
            <span>
              Updated: {new Date(project.updated_at).toLocaleDateString("en-IN")}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between">
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(project);
                  }}
                >
                  <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                  Edit Configuration
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                  onClick={() => {
                    onOpenChange(false);
                    onDelete(project);
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Deactivate Project
                </Button>
              )}
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
