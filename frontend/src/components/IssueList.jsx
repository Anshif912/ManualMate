import React, { useState } from "react";
import { CheckSquare, Square, AlertCircle, Sparkles, Filter, ShieldCheck, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function IssueList({ issues, activeIssueId, onIssueSelect, selectedFixes, onToggleFix }) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const categories = ["all", "contrast", "touch_target", "consistency", "error_prevention", "status_visibility", "recognition_recall", "performance", "responsiveness"];
  const severities = ["all", "critical", "serious", "moderate", "minor"];

  const getCleanCategory = (cat) => {
    return cat.replace("_", " ").toUpperCase();
  };

  const getWcagReference = (ruleId, cat) => {
    if (cat === "contrast") return "WCAG 1.4.3 (Contrast)";
    if (cat === "touch_target") return "WCAG 2.5.5 (Target Size)";
    if (cat === "error_prevention") return "WCAG 3.3.4 (Error Prevention)";
    if (cat === "status_visibility") return "WCAG 4.1.3 (Status Messages)";
    if (cat === "recognition_recall") return "WCAG 2.4.4 (Link Purpose)";
    if (cat === "performance") return "Web Vitals (LCP/CLS)";
    if (cat === "responsiveness") return "WCAG 1.4.10 (Reflow)";
    return "WCAG 2.0 AA Guideline";
  };

  const filteredIssues = issues.filter((i) => {
    const catMatch = filterCategory === "all" || i.category === filterCategory;
    const sevMatch = filterSeverity === "all" || i.severity === filterSeverity;
    return catMatch && sevMatch;
  });

  const getSeverityBadge = (sev) => {
    if (sev === "critical") return "bg-rose-500/10 text-rose-450 border-rose-500/25";
    if (sev === "serious") return "bg-orange-500/10 text-orange-450 border-orange-500/25";
    if (sev === "moderate") return "bg-yellow-500/10 text-yellow-450 border-yellow-500/25";
    return "bg-zinc-550/10 text-zinc-400 border-zinc-800";
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl max-w-6xl mx-auto my-8 px-4 text-zinc-100">
      
      {/* Category filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4.5 border-b border-zinc-800/60">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-emerald-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-200">UX Audit Issues & Patches ({filteredIssues.length})</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-3xs font-extrabold uppercase text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : getCleanCategory(cat)}
              </option>
            ))}
          </select>
          
          {/* Severity Dropdown */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-3xs font-extrabold uppercase text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            {severities.map((sev) => (
              <option key={sev} value={sev}>
                {sev === "all" ? "All Severities" : sev.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards list container */}
      <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
        <AnimatePresence>
          {filteredIssues.map((issue) => {
            const isSelected = issue.id === activeIssueId;
            const isFixApplied = selectedFixes.includes(issue.id);
            const hasFix = issue.fix && issue.fix.css_rule_text;

            return (
              <motion.div
                key={issue.id}
                onClick={() => onIssueSelect(issue.id)}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`border rounded-xl p-4.5 transition select-none cursor-pointer ${
                  isSelected
                    ? "bg-zinc-900 border-emerald-500/80 shadow-md shadow-emerald-500/5"
                    : "bg-zinc-950/60 border-zinc-900 hover:border-zinc-800"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <div className="mt-1">
                      {isFixApplied ? (
                        <CheckSquare
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFix(issue.id);
                          }}
                          className="h-5 w-5 text-emerald-400 hover:text-emerald-500 transition"
                        />
                      ) : (
                        <Square
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFix(issue.id);
                          }}
                          className="h-5 w-5 text-zinc-700 hover:text-zinc-550 transition"
                        />
                      )}
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 border text-4xs font-black rounded uppercase tracking-wider ${getSeverityBadge(issue.severity)}`}>
                          {issue.severity}
                        </span>
                        <span className="text-4xs text-zinc-550 font-black uppercase tracking-wider">
                          {getCleanCategory(issue.category)}
                        </span>
                        <span className="text-4xs text-zinc-600 font-extrabold">
                          • {getWcagReference(issue.rule_id, issue.category)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-200">{issue.description}</p>
                      <p className="text-4xs font-mono text-zinc-550 truncate mt-1">Selector: {issue.selector}</p>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <span className="text-rose-400 text-xs font-black">-{issue.score_impact} Priority Score</span>
                  </div>
                </div>

                {/* Card override code expansion */}
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-4 pt-4 border-t border-zinc-850 space-y-3 text-zinc-300 overflow-hidden"
                  >
                    <div className="flex items-center space-x-1.5 text-3xs font-extrabold text-zinc-250 uppercase tracking-widest">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      <span>Deterministic Patch Logic</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{issue.fix.explanation_text}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-4xs border-t border-b border-zinc-900 py-3">
                      <div>
                        <span className="text-zinc-550 block uppercase font-bold mb-1">Before Patch</span>
                        <code className="text-zinc-400 bg-zinc-950 border border-zinc-900 px-2 py-1 rounded truncate block">
                          {issue.fix.old_value || "none"}
                        </code>
                      </div>
                      <div>
                        <span className="text-zinc-550 block uppercase font-bold mb-1">After Patch</span>
                        <code className="text-emerald-400 bg-zinc-950 border border-zinc-900 px-2 py-1 rounded truncate block">
                          {issue.fix.new_value || "n/a"}
                        </code>
                      </div>
                    </div>

                    {hasFix && (
                      <div className="space-y-1">
                        <span className="text-4xs uppercase text-zinc-500 font-bold">Injectable Stylesheet Rule</span>
                        <pre className="text-3xs bg-zinc-950 border border-zinc-900 p-3 rounded-md font-mono text-zinc-400 overflow-x-auto">
                          {issue.fix.css_rule_text}
                        </pre>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {filteredIssues.length === 0 && (
          <div className="py-14 text-center text-zinc-500 font-medium text-xs">
            No UX audit issues match the active filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
