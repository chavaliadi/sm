import React from "react";
import { Anchor, Shield, Ship, Compass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#edf2f8] font-sans antialiased text-slate-800">
      {/* Left panel - Branding, Gradients, and Maritime Abstract Grids */}
      <div className="relative md:w-1/2 bg-[#0c1e36] text-white flex flex-col justify-between p-8 lg:p-12 overflow-hidden shrink-0 shadow-2xl">
        {/* Abstract animated glowing backdrop waves (CSS inline) */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute -left-1/4 -bottom-1/4 w-[150%] h-[150%] rounded-[40%] bg-gradient-to-tr from-[#1b3c66]/40 via-[#2a598c]/30 to-transparent animate-[spin_50s_linear_infinite]" />
          <div className="absolute -right-1/4 -top-1/4 w-[140%] h-[140%] rounded-[45%] bg-gradient-to-br from-[#122b4d]/40 via-[#214a7a]/25 to-transparent animate-[spin_40s_linear_infinite_reverse]" />
          {/* Subtle grid lines */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))]" />
        </div>

        {/* Top Header Section */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Anchor className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-bold tracking-widest text-blue-400 uppercase leading-none">
              Government of India
            </div>
            <div className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wide">
              Ministry of Ports, Shipping and Waterways
            </div>
          </div>
        </div>

        {/* Center Pitch Section */}
        <div className="relative z-10 my-auto py-12 max-w-lg space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight leading-tight font-serif bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              SAGARMALA 2.0 PORTAL
            </h1>
            <p className="text-blue-300 font-semibold tracking-wider text-xs uppercase lg:text-sm">
              National Blue Economy & Infrastructure Hub
            </p>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm lg:text-base">
            Executive workspace for managing DPR appraisals, clearance pipelines, project timelines, fund sanctions, and physical milestone evidence across all major Indian ports.
          </p>

          {/* Key Port pillars */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            <PillarCard icon={<Ship className="text-blue-400 h-4 w-4" />} title="Port Modernization" />
            <PillarCard icon={<Compass className="text-blue-400 h-4 w-4" />} title="Connectivity Links" />
            <PillarCard icon={<Shield className="text-blue-400 h-4 w-4" />} title="Appraisal Auditing" />
            <PillarCard icon={<Anchor className="text-blue-400 h-4 w-4" />} title="Maritime Sanctions" />
          </div>
        </div>

        {/* Bottom Footer Section */}
        <div className="relative z-10 text-[10px] text-slate-400 font-medium tracking-wide flex justify-between gap-4 border-t border-white/5 pt-6">
          <span>© 2026 MoPSW. All Rights Reserved.</span>
          <span>Technical Support Link</span>
        </div>
      </div>

      {/* Right panel - Centered Premium Card */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 app-main relative">
        {/* Soft radial glow */}
        <div className="absolute inset-0 bg-radial-gradient(circle at center, rgba(37,99,235,0.05) 0%, transparent 70%)" />
        
        <Card className="w-full max-w-[500px] border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden p-6 sm:p-8 animate-fade-in relative z-10">
          <CardContent className="p-0 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
              <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
            </div>
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PillarCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors">
      <div className="p-1 rounded bg-white/5">{icon}</div>
      <span className="text-xs font-semibold text-slate-200">{title}</span>
    </div>
  );
}
