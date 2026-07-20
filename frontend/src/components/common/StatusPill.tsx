import { cn } from "@/lib/utils";

interface StatusPillProps {
  status: string;
  type?: "dpr" | "project" | "task" | "lifecycle";
  size?: "sm" | "md";
  className?: string;
}

export function StatusPill({ status, size = "md", className }: StatusPillProps) {
  let bgColor = "bg-slate-100";
  let textColor = "text-slate-600";
  let dotColor = "bg-slate-400";

  switch (status.toUpperCase()) {
    case "DRAFT":
    case "INITIATION":
      bgColor = "bg-slate-100";
      textColor = "text-slate-600";
      dotColor = "bg-slate-400";
      break;
    case "SUBMITTED":
    case "UNDER_REVIEW":
    case "APPRAISAL":
      bgColor = "bg-blue-50";
      textColor = "text-blue-700";
      dotColor = "bg-blue-500";
      break;
    case "SMFCL_REVIEW":
    case "FORWARDED_TO_MINISTRY":
      bgColor = "bg-purple-50";
      textColor = "text-purple-700";
      dotColor = "bg-purple-500";
      break;
    case "APPROVED":
    case "COMPLETED":
    case "SANCTIONED":
      bgColor = "bg-green-50";
      textColor = "text-green-700";
      dotColor = "bg-green-500";
      break;
    case "FUNDS_RELEASED":
    case "UNDER_EXECUTION":
      bgColor = "bg-emerald-50";
      textColor = "text-emerald-700";
      dotColor = "bg-emerald-500";
      break;
    case "REJECTED":
    case "REJECTED_BY_SMFCL":
    case "REJECTED_BY_MINISTRY":
      bgColor = "bg-red-50";
      textColor = "text-red-700";
      dotColor = "bg-red-500";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        bgColor,
        textColor,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
      {status.replace(/_/g, " ")}
    </span>
  );
}
