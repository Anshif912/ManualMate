import React from "react";
import { Link, FileText, CheckCircle2, ChevronRight, Activity, Network } from "lucide-react";
import { motion } from "framer-motion";

export default function SiteMap({ pages, activePageId, onPageSelect }) {
  
  const getScoreBg = (score) => {
    if (score == null || score < 0) return "text-zinc-500 border-zinc-800 bg-zinc-950/60";
    if (score >= 90) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
    if (score >= 70) return "text-yellow-400 border-yellow-500/20 bg-yellow-500/10";
    return "text-rose-400 border-rose-500/20 bg-rose-500/10";
  };

  const getCleanPath = (url) => {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname;
      return path === "/" ? "Index / Homepage" : path;
    } catch(e) {
      return url;
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-8 px-4 text-zinc-100">
      <h3 className="font-extrabold text-sm uppercase tracking-widest text-zinc-200 mb-6 flex items-center space-x-2">
        <Network className="h-5 w-5 text-emerald-400" />
        <span>Interactive Sitemap Node Explorer</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pages.map((p, index) => {
          const isActive = p.page_id === activePageId;
          const isFailed = p.crawl_status === "failed" || p.status === "failed";
          const scoreUnavailable = p.page_score == null || p.page_score < 0;
          
          return (
            <motion.div
              key={p.page_id}
              onClick={() => !isFailed && !scoreUnavailable && onPageSelect(p.page_id)}
              whileHover={!isFailed && !scoreUnavailable ? { scale: 1.012, y: -2 } : {}}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, ease: "easeOut" }}
              className={`glass-card p-5 border cursor-pointer select-none transition flex flex-col justify-between relative overflow-hidden ${
                isFailed || scoreUnavailable
                  ? "opacity-50 cursor-not-allowed border-zinc-900/60"
                  : isActive
                  ? "border-emerald-500/65 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20 bg-zinc-900/80"
                  : "hover:border-zinc-700"
              }`}
            >
              {/* Highlight Glow Accent */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
              )}
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-4xs uppercase tracking-widest font-extrabold text-zinc-500">
                    Node #{p.crawl_order}
                  </span>
                  {isActive && (
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-4xs font-black rounded-full uppercase tracking-widest">
                      Focus Target
                    </span>
                  )}
                  {(isFailed || scoreUnavailable) && (
                    <span className="px-2.5 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/20 text-4xs font-black rounded-full uppercase tracking-widest">
                      {isFailed ? "Failed" : "Unanalyzed"}
                    </span>
                  )}
                </div>
                
                <h4 className="text-xs font-bold truncate text-zinc-100" title={p.url}>
                  {getCleanPath(p.url)}
                </h4>
                <p className="text-5xs font-mono text-zinc-650 truncate mt-1">
                  {p.url}
                </p>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-4xs text-zinc-500 uppercase font-bold tracking-widest">Metric Score</span>
                  <span className="text-xs font-black text-white mt-1">
                    {isFailed || scoreUnavailable ? "—" : `${p.page_score}/100`}
                  </span>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-4xs text-zinc-500 uppercase font-bold tracking-widest">Deductions</span>
                  <span className={`text-4xs font-bold mt-1 px-2.5 py-0.5 border rounded-full uppercase tracking-widest ${getScoreBg(p.page_score)}`}>
                    {isFailed || scoreUnavailable ? (
                      "Crawl Err"
                    ) : p.total_occurrences > 0 ? (
                      `${p.unique_violations} Violations (${p.total_occurrences} Occurrences)`
                    ) : (
                      "Clean Page"
                    )}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
