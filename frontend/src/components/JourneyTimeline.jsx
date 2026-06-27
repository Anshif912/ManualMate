import React from "react";
import { Compass } from "lucide-react";
import { motion } from "framer-motion";

export default function JourneyTimeline({ steps, activeStepId, onStepSelect }) {
  if (!steps || steps.length === 0) return null;

  const getScoreBg = (score) => {
    if (score >= 90) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
    if (score >= 70) return "text-yellow-400 border-yellow-500/20 bg-yellow-500/10";
    return "text-rose-400 border-rose-500/20 bg-rose-500/10";
  };

  return (
    <div className="glass-card p-6 shadow-2xl max-w-6xl mx-auto my-8 px-4 text-zinc-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/2 to-transparent pointer-events-none" />
      <div className="flex items-center space-x-2.5 mb-6">
        <Compass className="h-5 w-5 text-emerald-400" />
        <h3 className="font-extrabold text-sm uppercase tracking-widest text-zinc-200">User Journey UX Degradation Timeline</h3>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
        {/* Connector line */}
        <div className="hidden md:block absolute left-12 right-12 top-10 h-px bg-white/5 -z-10" />

        {steps.map((step, index) => {
          const isActive = step.step_id === activeStepId;
          return (
            <motion.div
              key={step.step_id}
              onClick={() => onStepSelect(step.step_id)}
              whileHover={{ scale: 1.015 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex-1 w-full md:w-auto cursor-pointer rounded-xl p-4 border transition flex flex-row md:flex-col items-center gap-4 text-left md:text-center select-none ${
                isActive
                  ? "bg-zinc-900 border-emerald-500/60 shadow-lg shadow-emerald-500/5 scale-[1.01]"
                  : "bg-zinc-950/40 border-white/5 hover:border-zinc-800"
              }`}
            >
              <div className={`h-12 w-12 rounded-full border-2 flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                isActive ? "border-emerald-400 bg-emerald-500/15 text-emerald-400" : "border-white/10 bg-zinc-900 text-zinc-450"
              }`}>
                {step.step_number}
              </div>

              <div className="flex-1 min-w-0 md:w-full">
                <h4 className="text-3xs font-extrabold text-zinc-300 truncate mb-1.5 uppercase tracking-widest">{step.step_label}</h4>
                
                <div className="flex flex-wrap md:justify-center gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 border text-4xs font-black rounded-full uppercase tracking-widest ${getScoreBg(step.score)}`}>
                    Score: {step.score}
                  </span>
                  <span className="px-2.5 py-0.5 bg-zinc-950/60 border border-white/5 text-zinc-500 text-4xs font-extrabold rounded-full uppercase tracking-widest">
                    {step.issue_count} issues
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="text-5xs text-zinc-550 mt-5 text-center font-bold uppercase tracking-widest">
        💡 Click on any journey step node to filter issues and screenshot coordinates for that step.
      </p>
    </div>
  );
}
