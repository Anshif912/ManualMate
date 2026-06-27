import React from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Activity } from "lucide-react";

const PIPELINE = [
  { id: "crawler",      emoji: "🔍", label: "Explorer",     sub: "Discovery" },
  { id: "vision",       emoji: "👁️",  label: "Vision",       sub: "Screenshots" },
  { id: "wcag",         emoji: "♿",  label: "UX Eval",      sub: "WCAG Rules" },
  { id: "navigation",   emoji: "🗺️",  label: "Navigator",    sub: "Journey" },
  { id: "consistency",  emoji: "🎨",  label: "Consistency",  sub: "Styling" },
  { id: "severity",     emoji: "📊",  label: "Priority",     sub: "Ranking" },
  { id: "recommendation",emoji:"🤖", label: "AI Consult",   sub: "Ollama" },
];

function getNodeStatus(nodeId, activeAgent, status, index, activeIndex) {
  if (status === "completed") return "completed";
  if (status === "failed")    return "failed";
  if (index < activeIndex)    return "completed";
  if (index === activeIndex)  return "active";
  return "pending";
}

export default function CrawlProgress({ statusLog, currentProgress }) {
  if (!currentProgress) return null;

  const { status, page_number, max_pages, current_url, message, active_agent, progress } = currentProgress;
  const progressPercent = progress !== undefined ? progress : (max_pages ? (page_number / max_pages) * 100 : 0);
  const activeIndex = PIPELINE.findIndex(n => n.id === active_agent);

  return (
    <div className="glass-card p-6 shadow-2xl max-w-4xl mx-auto my-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/2 to-transparent pointer-events-none" />
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2.5">
          <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
          <h3 className="font-extrabold text-xs uppercase tracking-widest text-zinc-200">
            7-Agent Execution Pipeline
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-3xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black rounded-full animate-pulse tracking-widest">
            {Math.round(progressPercent)}%
          </span>
          {status === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {status === "failed"    && <XCircle className="h-4 w-4 text-rose-400" />}
        </div>
      </div>

      {/* Agent pipeline grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {PIPELINE.map((node, i) => {
          const nodeStatus = getNodeStatus(node.id, active_agent, status, i, activeIndex);
          const isActive    = nodeStatus === "active";
          const isDone      = nodeStatus === "completed";
          const isFailed    = nodeStatus === "failed";

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`relative flex flex-col items-center p-2.5 border rounded-xl text-center transition-all
                ${isDone    ? "bg-emerald-950/10 border-emerald-500/20" :
                  isActive  ? "bg-zinc-900 border-emerald-500/50 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/25" :
                  isFailed  ? "bg-rose-950/10 border-rose-500/20" :
                              "bg-zinc-950/30 border-white/5"}`}
            >
              {/* Connector line (right side) */}
              {i < PIPELINE.length - 1 && (
                <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-2 h-px z-10
                  ${isDone ? "bg-emerald-500/35" : "bg-white/5"}`}
                />
              )}

              {/* Status icon / emoji */}
              <div className="mb-1.5">
                {isActive  ? <Loader2 className="h-4 w-4 text-emerald-400 animate-spin mx-auto" /> :
                 isDone    ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" /> :
                 isFailed  ? <XCircle className="h-4 w-4 text-rose-400 mx-auto" /> :
                             <span className="text-base">{node.emoji}</span>}
              </div>

              <span className={`text-3xs font-black leading-tight block uppercase tracking-wider
                ${isDone   ? "text-emerald-400" :
                  isActive  ? "text-white" :
                  isFailed  ? "text-rose-400" :
                              "text-zinc-500"}`}>
                {node.label}
              </span>
              <span className={`text-5xs mt-0.5 block font-semibold uppercase tracking-widest
                ${isDone ? "text-emerald-600/85" : isActive ? "text-zinc-400" : "text-zinc-650"}`}>
                {node.sub}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-zinc-950/60 h-1.5 rounded-full overflow-hidden mb-5 border border-white/5">
        <motion.div
          className={`h-full rounded-full ${status === "failed" ? "bg-rose-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Status message */}
      <div className={`rounded-xl px-4 py-3 flex items-start space-x-3 mb-5 border
        ${status === "failed" ? "bg-rose-950/10 border-rose-500/20" : "bg-zinc-950/60 border-white/5"}`}>
        {status === "failed"
          ? <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          : status === "completed"
          ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          : <Loader2 className="h-4 w-4 text-emerald-400 animate-spin shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-zinc-200">{message || "Crawling in progress..."}</p>
          {current_url && (
            <p className="text-4xs text-zinc-500 truncate mt-0.5 font-mono">{current_url}</p>
          )}
          {page_number && max_pages && (
            <p className="text-4xs text-zinc-400 font-extrabold uppercase tracking-widest mt-1">
              Page {page_number} / {max_pages}
            </p>
          )}
        </div>
      </div>

      {/* Log console */}
      {statusLog?.length > 0 && (
        <div>
          <h4 className="text-3xs font-extrabold text-zinc-500 uppercase tracking-widest mb-2.5">Pipeline Logs</h4>
          <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-3.5 h-32 overflow-y-auto font-mono text-4xs space-y-1.5 shadow-inner">
            {statusLog.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className="text-zinc-650 shrink-0">[{String(idx).padStart(3, "0")}]</span>
                <span className={
                  log.includes("Failed") || log.includes("Error")
                    ? "text-rose-400"
                    : log.includes("Discover") || log.includes("Crawl")
                    ? "text-cyan-400"
                    : log.includes("complete") || log.includes("✓")
                    ? "text-emerald-400"
                    : "text-zinc-300"
                }>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
