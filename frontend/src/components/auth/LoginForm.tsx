import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "./PasswordInput";

export function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Front-end UI only: simulated success redirect
    console.log("Logging in with:", { email, password, rememberMe });
    navigate("/");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          Email Address
        </label>
        <Input
          type="email"
          placeholder="e.g. administrator@mopsw.gov.in"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg text-sm bg-white/70"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            Password
          </label>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("Password recovery link has been simulated to your registered email.");
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Forgot?
          </a>
        </div>
        <PasswordInput
          placeholder="Enter account security key"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2 cursor-pointer">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(!!checked)}
            className="border-slate-300 rounded cursor-pointer data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <label
            htmlFor="remember"
            className="text-slate-500 font-medium select-none cursor-pointer text-xs"
          >
            Remember session keys
          </label>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold text-sm transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-1.5"
      >
        Sign In to Portal
        <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 px-2.5 text-slate-400 font-semibold tracking-wider">
            Appraisal Access
          </span>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 font-medium">
        Need credential assignment?{" "}
        <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700">
          Request Registration
        </Link>
      </p>
    </form>
  );
}
