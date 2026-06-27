import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { client } from "../api/client";
import {
  TrendingDown, Eye, Smartphone, AlertCircle, Layers, Zap, Monitor, Activity, Shield,
  MousePointer, ChevronDown, ChevronUp, Loader2
} from "lucide-react";

const ICON_MAP = {
  Eye, Smartphone, AlertCircle, Layers, Zap, Monitor, Activity, Shield, MousePointer, TrendingDown
};

const RISK_CONFIG = {
  High:   { bg: "bg-rose-500/10",   border: "border-rose-500/25",   text: "text-rose-400",   badge: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  Medium: { bg: "bg-amber-500/10",  border: "border-amber-500/25",  text: "text-amber-400",  badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  Low:    { bg: "bg-emerald-500/10",border: "border-emerald-500/25",text: "text-emerald-400",badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
};

const COLOR_MAP = {
  rose: "text-rose-400",
  amber: "text-amber-400",
  orange: "text-orange-400",
  yellow: "text-yellow-400",
  purple: "text-purple-400",
  blue: "text-blue-400",
  teal: "text-teal-400",
  cyan: "text-cyan-400",
  emerald: "text-emerald-400",
};

function RiskGauge({ risk }) {
  const widths = { High: "w-full", Medium: "w-2/3", Low: "w-1/3" };
  const colors = { High: "bg-rose-500", Medium: "bg-amber-500", Low: "bg-emerald-500" };
  return (
    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: undefined }}
        className={`h-full rounded-full ${widths[risk]} ${colors[risk]} transition-all duration-700`}
      />
    </div>
  );
}

function ImpactCard({ item, expanded, onToggle }) {
  const Icon = ICON_MAP[item.icon] || AlertCircle;
  const risk = RISK_CONFIG[item.risk_level] || RISK_CONFIG.Low;
  const textColor = COLOR_MAP[item.color] || "text-zinc-300";

  return (
    <motion.div
      layout
      className={`rounded-xl border overflow-hidden cursor-pointer ${risk.bg} ${risk.border}`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className={`p-1.5 rounded-lg bg-zinc-900/50`}>
            <Icon className={`h-4 w-4 ${textColor}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{item.metric}</p>
            <p className="text-3xs text-zinc-400 mt-0.5">{item.issue_count} issue{item.issue_count !== 1 ? "s" : ""} detected</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div>
            <span className={`px-2 py-0.5 border rounded-md text-3xs font-black uppercase tracking-wider ${risk.badge}`}>
              {item.risk_level}
            </span>
          </div>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-4 space-y-3"
          >
            <div className="border-t border-zinc-700/50 pt-3 space-y-2.5">
              <div>
                <p className="text-3xs text-zinc-500 uppercase tracking-wider font-extrabold mb-1">Estimated Impact</p>
                <p className={`text-sm font-black ${risk.text}`}>{item.loss_range}</p>
                <p className="text-xs text-zinc-400">{item.loss_metric}</p>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{item.description}</p>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2">
                <p className="text-3xs text-zinc-500 uppercase tracking-wider font-extrabold mb-1">Research Basis</p>
                <p className="text-3xs text-zinc-400 leading-relaxed italic">"{item.research_ref}"</p>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2">
                <p className="text-3xs text-emerald-400 font-extrabold uppercase tracking-wider mb-1">Fix Benefit</p>
                <p className="text-3xs text-zinc-300">{item.fix_benefit}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function BusinessImpactPanel({ auditId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!auditId) return;
    setLoading(true);
    client.getBusinessImpact(auditId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [auditId]);

  if (loading) return (
    <div className="flex items-center justify-center py-10 text-zinc-500">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm">Calculating business impact...</span>
    </div>
  );

  if (!data || !data.by_category?.length) return (
    <div className="text-center py-10 text-zinc-500 text-sm">No impact data available.</div>
  );

  const overallColor = RISK_CONFIG[data.overall_risk]?.text || "text-zinc-300";

  return (
    <div className="space-y-5">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border p-5 ${RISK_CONFIG[data.overall_risk]?.bg} ${RISK_CONFIG[data.overall_risk]?.border}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-3xs text-zinc-500 uppercase tracking-wider font-extrabold mb-1">Overall Business Risk</p>
            <p className={`text-2xl font-black ${overallColor}`}>{data.overall_risk} Risk</p>
          </div>
          <div className="text-right">
            <p className="text-3xs text-zinc-500 mb-1">Issues Detected</p>
            <p className="text-xl font-black text-white">{data.total_issues}</p>
          </div>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed mb-3">{data.risk_message}</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Critical", value: data.critical_count, color: "text-rose-400" },
            { label: "Serious", value: data.serious_count, color: "text-amber-400" },
            { label: "Est. Improvement", value: `+${data.estimated_improvement}%`, color: "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900/40 rounded-lg py-2">
              <p className={`text-base font-black ${color}`}>{value}</p>
              <p className="text-3xs text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Impact cards */}
      <div className="space-y-2">
        <p className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Impact by Category</p>
        {data.by_category.map((item) => (
          <ImpactCard
            key={item.category}
            item={item}
            expanded={expanded === item.category}
            onToggle={() => setExpanded(prev => prev === item.category ? null : item.category)}
          />
        ))}
      </div>
    </div>
  );
}
