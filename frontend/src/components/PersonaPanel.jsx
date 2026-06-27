import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { client } from "../api/client";
import { Users, Loader2, AlertTriangle } from "lucide-react";

const GRADE_CONFIG = {
  A: { bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", bar: "#10b981" },
  B: { bg: "bg-lime-500/10",    border: "border-lime-500/25",    text: "text-lime-400",    bar: "#84cc16" },
  C: { bg: "bg-yellow-500/10",  border: "border-yellow-500/25",  text: "text-yellow-400",  bar: "#eab308" },
  D: { bg: "bg-orange-500/10",  border: "border-orange-500/25",  text: "text-orange-400",  bar: "#f97316" },
  F: { bg: "bg-rose-500/10",    border: "border-rose-500/25",    text: "text-rose-400",    bar: "#f43f5e" },
};

function ScoreBar({ score, color }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-black text-white w-9 text-right">{score}</span>
    </div>
  );
}

function PersonaCard({ persona }) {
  const cfg = GRADE_CONFIG[persona.grade] || GRADE_CONFIG.F;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <span className="text-2xl" role="img" aria-label={persona.label}>{persona.emoji}</span>
          <div>
            <p className="text-sm font-black text-white">{persona.label}</p>
            <p className="text-3xs text-zinc-500 leading-tight mt-0.5">{persona.description}</p>
          </div>
        </div>
        <div className={`text-2xl font-black ${cfg.text} ml-2`}>{persona.grade}</div>
      </div>

      <ScoreBar score={persona.score} color={cfg.bar} />

      {persona.top_issues?.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {persona.top_issues.map((issue, i) => (
            <div key={i} className="flex items-start space-x-2 bg-zinc-900/50 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className={`h-3 w-3 mt-0.5 shrink-0 ${issue.severity === "critical" ? "text-rose-400" : "text-amber-400"}`} />
              <p className="text-3xs text-zinc-300 leading-tight">{issue.description}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function PersonaPanel({ auditId }) {
  const [personas, setPersonas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auditId) return;
    setLoading(true);
    client.getPersonas(auditId)
      .then(setPersonas)
      .catch(() => setPersonas(null))
      .finally(() => setLoading(false));
  }, [auditId]);

  if (loading) return (
    <div className="flex items-center justify-center py-10 text-zinc-500">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm">Calculating persona scores...</span>
    </div>
  );

  if (!personas?.length) return (
    <div className="text-center py-10 text-zinc-500 text-sm">No persona data available.</div>
  );

  const best = [...personas].sort((a, b) => b.score - a.score)[0];
  const worst = [...personas].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl">
          <Users className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">User Persona Analysis</h3>
          <p className="text-xs text-zinc-500">How different users experience your interface</p>
        </div>
      </div>

      {/* Best/Worst callout */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Best Experience", persona: best, icon: "🏆", color: "emerald" },
          { label: "Needs Most Attention", persona: worst, icon: "⚠️", color: "rose" },
        ].map(({ label, persona, icon, color }) => (
          <div key={label} className={`bg-${color}-500/5 border border-${color}-500/20 rounded-xl px-3 py-2.5 text-center`}>
            <p className="text-3xs text-zinc-500 uppercase tracking-wider font-extrabold mb-1">{label}</p>
            <span className="text-xl">{icon} {persona?.emoji}</span>
            <p className="text-xs font-black text-white mt-1">{persona?.label}</p>
            <p className={`text-lg font-black text-${color}-400`}>{persona?.score}/100</p>
          </div>
        ))}
      </div>

      {/* Persona cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {personas.map(p => <PersonaCard key={p.id} persona={p} />)}
      </div>
    </div>
  );
}
