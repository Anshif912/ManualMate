import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { client } from "../api/client";
import {
  Briefcase, AlertCircle, CheckCircle2, TrendingUp, Clock,
  Shield, Zap, ChevronRight, Printer, Loader2
} from "lucide-react";

function GradeRing({ score, grade }) {
  if (score == null) {
    return (
      <div className="relative inline-flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-xs font-black text-zinc-500 uppercase tracking-widest leading-normal">Not evaluated</div>
        </div>
      </div>
    );
  }
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const fill = Math.max(0, Math.min(100, score));
  const strokeDash = (fill / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={130} height={130} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={65} cy={65} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={10} />
        <circle
          cx={65} cy={65} r={radius} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={`${strokeDash} ${circ - strokeDash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-black text-white">{score}</div>
        <div className="text-xs font-black" style={{ color }}>{grade}</div>
      </div>
    </div>
  );
}

const RISK_STYLES = {
  High:   "text-rose-400 bg-rose-500/10 border-rose-500/30",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  Low:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
};

export default function ExecutiveDashboard({ auditId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auditId) return;
    setLoading(true);
    client.getExecutiveSummary(auditId)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [auditId]);

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-zinc-500">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm">Loading executive summary...</span>
    </div>
  );

  if (!summary) return (
    <div className="text-center py-10 text-zinc-500 text-sm glass-card">
      Executive summary unavailable for this audit.
    </div>
  );

  const agentsOk = summary.agents_completed || [];
  const agentsFail = summary.agents_failed || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto my-8 px-4 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
            <Briefcase className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Executive Dashboard</h3>
            <p className="text-xs text-zinc-500 font-mono truncate max-w-[300px]">{summary.url}</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-950/60 hover:bg-zinc-900 border border-white/5 rounded-xl text-3xs text-zinc-300 font-bold uppercase tracking-widest transition-all"
        >
          <Printer className="h-3 w-3" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Score + KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Score ring */}
        <div className="glass-card p-6 flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/2 to-transparent pointer-events-none" />
          <p className="text-3xs text-zinc-500 uppercase tracking-widest font-black mb-4">Site Health</p>
          <GradeRing score={summary.site_score} grade={summary.grade} />
          <div className={`mt-4 px-3 py-1 border rounded-full text-5xs font-black uppercase tracking-widest ${RISK_STYLES[summary.risk_level]}`}>
            {summary.risk_level} Risk
          </div>
        </div>

        {/* KPI grid */}
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Pages Analyzed", value: summary.pages_analyzed, icon: TrendingUp, color: "indigo" },
            { label: "Total Issues", value: summary.total_issues, icon: AlertCircle, color: "amber" },
            { label: "Critical Issues", value: summary.critical_issues, icon: Shield, color: "rose" },
            { label: "Serious Issues", value: summary.serious_issues, icon: Zap, color: "orange" },
            { label: "Industry", value: summary.industry?.charAt(0).toUpperCase() + summary.industry?.slice(1), icon: Briefcase, color: "violet" },
            { label: "Audit Date", value: summary.audit_date?.slice(0, 10), icon: Clock, color: "zinc" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/2 to-transparent pointer-events-none" />
              <div className="flex items-center space-x-1.5 mb-2">
                <Icon className={`h-3.5 w-3.5 text-${color}-400`} />
                <span className="text-4xs text-zinc-500 uppercase tracking-widest font-black">{label}</span>
              </div>
              <p className="text-lg font-black text-white tracking-tight">{value ?? "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Headline */}
      <div className="glass-card p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/2 to-transparent pointer-events-none" />
        <p className="text-3xs font-black text-zinc-400 uppercase tracking-widest mb-3">📋 Summary</p>
        <p className="text-xs text-zinc-300 leading-relaxed font-semibold">{summary.headline}</p>
        <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
          <span className="text-emerald-400 font-bold uppercase tracking-widest text-3xs mr-1">Recommendation: </span>
          {summary.recommendation}
        </p>
      </div>

      {/* Agent status */}
      {(agentsOk.length > 0 || agentsFail.length > 0) && (
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/2 to-transparent pointer-events-none" />
          <p className="text-3xs font-black text-zinc-400 uppercase tracking-widest mb-3">Agent Pipeline Status</p>
          <div className="flex flex-wrap gap-2">
            {agentsOk.map(a => (
              <span key={a} className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-5xs text-emerald-400 font-black uppercase tracking-widest">
                <CheckCircle2 className="h-3 w-3" />
                <span>{a}</span>
              </span>
            ))}
            {agentsFail.map(a => (
              <span key={a} className="flex items-center space-x-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-5xs text-rose-400 font-black uppercase tracking-widest animate-pulse">
                <AlertCircle className="h-3 w-3" />
                <span>{a}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
