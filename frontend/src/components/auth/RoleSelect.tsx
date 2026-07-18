import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RoleSelectProps {
  label?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
  placeholder?: string;
}

// Ministry & Port specific roles matching Sagarmala schema requirements
const availableRoles = [
  { value: "port_authority", label: "Port Authority Representative" },
  { value: "smfcl_reviewer", label: "SMFCL Appraisal Lead" },
  { value: "ministry_approver", label: "Ministry Sanction Officer" },
  { value: "third_party_auditor", label: "Empanelled Third-Party Auditor" },
];

export const RoleSelect = React.forwardRef<HTMLButtonElement, RoleSelectProps>(
  ({ label, value, onValueChange, error, placeholder = "Select role..." }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {label}
          </label>
        )}
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger
            ref={ref}
            className="border-slate-200 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm bg-white/70 text-left cursor-pointer"
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200 rounded-lg shadow-md">
            {availableRoles.map((role) => (
              <SelectItem
                key={role.value}
                value={role.value}
                className="cursor-pointer hover:bg-slate-50 text-slate-700 text-sm"
              >
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      </div>
    );
  }
);

RoleSelect.displayName = "RoleSelect";
