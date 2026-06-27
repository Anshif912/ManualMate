import React, { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { client } from "../api/client";
import { motion } from "framer-motion";

export default function ReAuditDiff({ auditId, selectedFixes, onReAuditComplete }) {
  const [loading, setLoading] = useState(false);
  const [diffResult, setDiffResult] = useState(null);

  const handleReAudit = async () => {
    setLoading(true);
    try {
      const res = await client.reAudit(auditId, selectedFixes);
      setDiffResult(res);
      if (onReAuditComplete) {
        onReAuditComplete(res);
      }
    } catch (err) {
      console.error("Error during re-audit:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl max-w-6xl mx-auto my-8 px-4 text-zinc-100">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-200">Local Regression Re-Audit Estimator</h3>
        </div>
        <span className="text-4xs text-zinc-550 font-black uppercase tracking-widest">
          Applies selected local overrides and re-evaluates scores
        </span>
      </div>

      <div className="bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <h4 className="text-xs font-bold text-zinc-250 uppercase tracking-wide">Evaluate selected CSS override patches</h4>
          <p className="text-4xs text-zinc-500 uppercase tracking-widest font-extrabold mt-1">
            Analyze {selectedFixes.length} checked CSS overrides and re-evaluate compliance score diffs.
          </p>
        </div>
        
        <button
          type="button"
          onClick={handleReAudit}
          disabled={loading || selectedFixes.length === 0}
          className="shrink-0 flex items-center space-x-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-900 disabled:text-zinc-750 disabled:cursor-not-allowed text-zinc-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition active:scale-[0.98]"
        >
          <span>{loading ? "Re-Evaluating..." : "Apply & Re-Audit"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {diffResult && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-6 pt-6 border-t border-zinc-850 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden"
        >
          {/* Before / After comparison */}
          <div className="bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl flex items-center justify-around text-center">
            <div>
              <span className="text-4xs font-black text-zinc-500 uppercase tracking-widest block mb-1">Baseline Score</span>
              <span className="text-4xl font-black text-rose-450">{diffResult.before.site_score}</span>
            </div>
            
            <ChevronRight className="h-8 w-8 text-zinc-800" />
            
            <div>
              <span className="text-4xs font-black text-emerald-450 uppercase tracking-widest block mb-1">Post-Fix Score</span>
              <span className="text-4xl font-black text-emerald-400 animate-pulse">{diffResult.after.site_score}</span>
            </div>
          </div>

          <div className="bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl flex flex-col justify-center">
            <h4 className="text-3xs font-extrabold text-zinc-450 uppercase tracking-widest mb-2">Score Improvement Summary</h4>
            <div className="space-y-1.5 text-3xs text-zinc-450 font-bold leading-relaxed uppercase tracking-wider">
              <p>
                • Site health score improved by <span className="text-emerald-400 font-extrabold">+{diffResult.after.site_score - diffResult.before.site_score} points</span>.
              </p>
              <p>
                • Solved <span className="text-emerald-400 font-extrabold">{selectedFixes.length} layout & compliance errors</span>.
              </p>
              <p className="flex items-center text-4xs text-emerald-400/80 mt-2 tracking-wide font-black">
                <CheckCircle2 className="h-4 w-4 mr-1.5 fill-emerald-500/5 shrink-0" /> Patches validated and ready for build handoff.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
