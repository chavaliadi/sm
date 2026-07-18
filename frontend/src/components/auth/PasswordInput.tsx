import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <Input
            type={showPassword ? "text" : "password"}
            className="pr-10 border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm bg-white/70"
            ref={ref}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-transparent cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
