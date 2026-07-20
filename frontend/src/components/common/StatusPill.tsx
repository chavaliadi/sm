import { Badge } from "@/components/ui/badge";

interface StatusPillProps {
  type?: "lifecycle" | "dpr" | "task" | "general" | string;
  status: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function StatusPill({
  type = "general",
  status,
  size = "sm",
  className = "",
}: StatusPillProps) {
  const normalized = status ? status.toUpperCase().replace(/\s+/g, "_") : "UNKNOWN";

  let label = status || "Unknown";
  let variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info" = "secondary";
  let customClasses = "";

  if (type === "lifecycle") {
    switch (normalized) {
      case "INITIATION":
        label = "Initiation";
        variant = "info";
        customClasses = "bg-blue-50 text-blue-700 border-blue-200";
        break;
      case "APPRAISAL":
        label = "Appraisal";
        variant = "warning";
        customClasses = "bg-amber-50 text-amber-700 border-amber-200";
        break;
      case "SANCTIONED":
        label = "Sanctioned";
        variant = "info";
        customClasses = "bg-indigo-50 text-indigo-700 border-indigo-200";
        break;
      case "UNDER_EXECUTION":
      case "EXECUTION":
        label = "Under Execution";
        variant = "info";
        customClasses = "bg-sky-50 text-sky-700 border-sky-200";
        break;
      case "COMPLETED":
        label = "Completed";
        variant = "success";
        customClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
        break;
      default:
        label = status;
        variant = "secondary";
    }
  } else if (type === "dpr") {
    switch (normalized) {
      case "DRAFT":
        label = "Draft";
        variant = "secondary";
        customClasses = "bg-slate-100 text-slate-700 border-slate-200";
        break;
      case "SUBMITTED_SMFCL":
      case "SUBMITTED":
        label = "SMFCL Review";
        variant = "warning";
        customClasses = "bg-amber-50 text-amber-700 border-amber-200";
        break;
      case "RECOMMENDED_MINISTRY":
      case "SUBMITTED_MINISTRY":
        label = "Ministry Review";
        variant = "info";
        customClasses = "bg-blue-50 text-blue-700 border-blue-200";
        break;
      case "APPROVED":
      case "SANCTIONED":
        label = "Approved";
        variant = "success";
        customClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
        break;
      case "REJECTED":
        label = "Rejected";
        variant = "destructive";
        customClasses = "bg-rose-50 text-rose-700 border-rose-200";
        break;
      default:
        label = status;
        variant = "secondary";
    }
  } else if (type === "task") {
    switch (normalized) {
      case "TODO":
        label = "Todo";
        variant = "secondary";
        customClasses = "bg-slate-100 text-slate-700 border-slate-200";
        break;
      case "IN_PROGRESS":
        label = "In Progress";
        variant = "info";
        customClasses = "bg-blue-50 text-blue-700 border-blue-200";
        break;
      case "DONE":
      case "COMPLETED":
        label = "Completed";
        variant = "success";
        customClasses = "bg-emerald-50 text-emerald-700 border-emerald-200";
        break;
      default:
        label = status;
        variant = "secondary";
    }
  } else {
    label = status;
  }

  return (
    <Badge
      variant={variant}
      size={size}
      className={`font-semibold rounded-md border ${customClasses} ${className}`}
    >
      {label}
    </Badge>
  );
}

export { StatusPill as StatusBadge };
