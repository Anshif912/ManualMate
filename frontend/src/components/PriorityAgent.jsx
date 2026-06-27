import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { client } from "../api/client";
import {
  Trophy, AlertTriangle, CheckSquare, Square, Code, TrendingUp, Loader2, Zap
} from "lucide-react";

const SEV_CONFIG = {
  critical: { text: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/25" },
  serious:  { text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/25" },
  moderate: { text: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/25" },
  minor:    { text: "text-zinc-400",  bg: "bg-zinc-800 border-zinc-700" },
};

export default function PriorityAgent({ auditId, selectedFixes, onToggleFix }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auditId) return;
    setLoading(true);
    client.getPriorityAgent(auditId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [auditId]);

  if (loading) return (
    <div className="flex items-center justify-center py-8 text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
      <span className="text-sm">Priority Agent calculating top fixes...</span>
    </div>
  );

  if (!data?.top_issues?.length) return (
    <div className="text-center py-8 text-zinc-500 text-sm">
      <Trophy className="h-6 w-6 mx-auto mb-2 opacity-30" />
      No priority issues found — the site is in great shape!
    </div>
  );

  const topIssues = data.top_issues;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Priority Agent — Top Fixes</h3>
            <p className="text-xs text-zinc-500">{data.message}</p>
          </div>
        </div>
        <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-3xs font-black text-amber-400 uppercase tracking-wider">
          {topIssues.length} Highest Impact
        </div>
      </div>

      {/* Issue cards */}
      {topIssues.map((issue, i) => {
        const sev = issue.severity || "moderate";
        const cfg = SEV_CONFIG[sev] || SEV_CONFIG.moderate;
        const isSelected = selectedFixes?.has?.(issue.id);

        return (
          <motion.div
            key={issue.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`rounded-xl border p-4 ${isSelected ? "border-emerald-500/40 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/50"}`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-xs shrink-0">
                  #{i + 1}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 mb-0.5">
                    <span className={`px-2 py-0.5 border rounded-md text-3xs font-black uppercase ${cfg.bg} ${cfg.text}`}>
                      {sev}
                    </span>
                    <span className="text-3xs text-zinc-500 capitalize font-semibold">{issue.category?.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-xs font-semibold text-white leading-tight truncate">{issue.description}</p>
                </div>
              </div>

              {/* Priority score */}
              <div className="ml-3 text-right shrink-0">
                <p className="text-3xs text-zinc-500 uppercase tracking-wider font-extrabold">Priority</p>
                <p className="text-lg font-black text-amber-400">{issue.priority_score}</p>
              </div>
            </div>

            {/* Page URL */}
            {issue.page_url && (
              <p className="text-3xs text-zinc-600 mb-3 truncate">{issue.page_url}</p>
            )}

            {/* Fix details */}
            {issue.fix?.explanation_text && (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 mb-3">
                <p className="text-3xs text-zinc-300 leading-relaxed">{issue.fix.explanation_text}</p>
              </div>
            )}

            {/* CSS rule */}
            {issue.fix?.css_rule_text && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 mb-3">
                <div className="flex items-center space-x-1.5 mb-1">
                  <Code className="h-3 w-3 text-zinc-600" />
                  <span className="text-3xs text-zinc-600 uppercase tracking-wider font-extrabold">Generated Fix</span>
                </div>
                <pre className="text-3xs text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">
                  {issue.fix.css_rule_text}
                </pre>
              </div>
            )}

            {/* Apply toggle */}
            {onToggleFix && (
              <button
                onClick={() => onToggleFix(issue.id)}
                className={`flex items-center space-x-2 text-xs font-semibold transition ${
                  isSelected ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {isSelected
                  ? <CheckSquare className="h-4 w-4" />
                  : <Square className="h-4 w-4" />}
                <span>{isSelected ? "Fix selected for re-audit" : "Select fix for re-audit"}</span>
              </button>
            )}
          </motion.div>
        );
      })}

      {/* Expected improvement callout */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center space-x-3">
        <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
        <p className="text-xs text-zinc-300">
          Applying all {topIssues.length} fixes is estimated to improve your site score by
          <span className="text-emerald-400 font-black"> +{topIssues.reduce((s, i) => s + (i.priority_score || 0), 0)} points</span>.
        </p>
      </div>
    </div>
  );
}
