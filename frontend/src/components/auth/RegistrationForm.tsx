import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, User, Mail, Building, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "./PasswordInput";
import { RoleSelect } from "./RoleSelect";

export function RegistrationForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // Front-end UI only: simulated success redirect
    console.log("Registering user:", { fullName, email, orgName, role, password });
    alert("Appraisal access request submitted. Redirecting to login page.");
    navigate("/login");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          Full Name
        </label>
        <Input
          placeholder="e.g. Shri Rajesh Kumar"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm bg-white/70"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          Official Email
        </label>
        <Input
          type="email"
          placeholder="e.g. r.kumar@nic.in"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm bg-white/70"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5" />
          Organization
        </label>
        <Input
          placeholder="e.g. Mumbai Port Authority"
          required
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          className="border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm bg-white/70"
        />
      </div>

      <RoleSelect
        label="Designated Role"
        value={role}
        onValueChange={setRole}
        placeholder="Select maritime jurisdiction..."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PasswordInput
          label="Secure Key"
          placeholder="New password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordInput
          label="Verify Key"
          placeholder="Confirm password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold text-sm transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5 mt-2"
      >
        Submit Registration Request
        <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 px-2.5 text-slate-400 font-semibold tracking-wider">
            Verification required
          </span>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 font-medium">
        Already registered?{" "}
        <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">
          Sign In Here
        </Link>
      </p>
    </form>
  );
}
