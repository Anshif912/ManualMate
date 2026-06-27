import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { client } from "../api/client";
import {
  LayoutDashboard, Globe, Image, CheckCircle2, XCircle, Clock,
  ChevronRight, TrendingUp, TrendingDown, Minus, AlertTriangle,
  BarChart2, Loader2, RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid
} from "recharts";

function ScoreBadge({ score }) {
  if (score == null) {
    return (
      <span className="inline-flex items-center justify-center px-3 h-12 rounded-2xl border text-4xs font-black text-zinc-500 bg-zinc-950 border-white/5 text-center leading-tight uppercase tracking-widest">
        Not evaluated
      </span>
    );
  }
  const color =
    score >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    score >= 60 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                  "text-rose-400 bg-rose-500/10 border-rose-500/20";
  return (
    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl border text-sm font-black ${color}`}>
      {score}
    </span>
  );
}

function StatusIcon({ status }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-rose-400" />;
  if (status === "running") return <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />;
  return <Clock className="h-4 w-4 text-zinc-500" />;
}

function DeltaBadge({ current, previous }) {
  if (previous == null || current == null) return null;
  const delta = current - previous;
  if (Math.abs(delta) < 1) return <Minus className="h-3 w-3 text-zinc-500 inline" />;
  if (delta > 0)
    return <span className="inline-flex items-center text-emerald-400 text-5xs font-black uppercase tracking-widest">
      <TrendingUp className="h-3 w-3 mr-0.5" />+{delta}
    </span>;
  return <span className="inline-flex items-center text-rose-400 text-5xs font-black uppercase tracking-widest">
    <TrendingDown className="h-3 w-3 mr-0.5" />{delta}
  </span>;
}

function formatUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch { return url; }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs backdrop-blur">
      <p className="text-zinc-400 mb-1 font-semibold">{label}</p>
      <p className="text-emerald-400 font-bold">{payload[0]?.value}/100</p>
    </div>
  );
};

export default function MasterDashboard({ onSelectAudit }) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.listAudits();
      setAudits(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("Failed to load audit history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Trend data for the chart — score by audit date
  const trendData = audits
    .filter(a => a.status === "completed" && a.site_score != null)
    .slice(0, 10)
    .reverse()
    .map((a, i) => ({
      index: i + 1,
      score: a.site_score,
      label: formatUrl(a.start_url),
    }));

  const scoredCompleted = audits.filter(a => a.status === "completed" && a.site_score != null);
  const avgScore = scoredCompleted.length
    ? Math.round(scoredCompleted.reduce((s, a) => s + a.site_score, 0) / scoredCompleted.length)
    : null;
  const totalIssues = audits.reduce((s, a) => s + (a.issue_count ?? 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <LayoutDashboard className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Audit History</h2>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">All past ManualMate AI analyses</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-950/60 hover:bg-zinc-900 border border-white/5 rounded-xl text-3xs text-zinc-300 font-bold uppercase tracking-widest transition-all"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Audits", value: audits.length, icon: BarChart2, color: "indigo" },
          { label: "Avg Score", value: avgScore != null ? `${avgScore}/100` : "—", icon: TrendingUp, color: "emerald" },
          { label: "Issues Found", value: totalIssues, icon: AlertTriangle, color: "amber" },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/2 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xs text-zinc-500 uppercase tracking-widest font-black">{label}</span>
              <Icon className={`h-3.5 w-3.5 text-${color}-400`} />
            </div>
            <p className="text-2xl font-black text-white tracking-tight">{value ?? "—"}</p>
          </motion.div>
        ))}
      </div>

      {/* Score trend chart */}
      {trendData.length > 1 && (
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/2 to-transparent pointer-events-none" />
          <p className="text-3xs font-black text-zinc-400 uppercase tracking-widest mb-4">Score Trend</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 9 }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 9 }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Audit list */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-16 text-zinc-600">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Loading audit history...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-rose-400">
            <XCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!loading && !error && audits.length === 0 && (
          <div className="text-center py-16 text-zinc-600 glass-card">
            <Globe className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No audits yet.</p>
            <p className="text-xs mt-1">Submit a URL or upload an image to get started.</p>
          </div>
        )}

        {!loading && audits.map((audit, i) => {
          const prevScore = i < audits.length - 1 ? audits[i + 1]?.site_score : null;
          return (
            <motion.button
              key={audit.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onSelectAudit(audit.id)}
              className="w-full text-left glass-card p-4 hover:border-zinc-700 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Score */}
                  <ScoreBadge score={audit.site_score} />

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1.5">
                      <StatusIcon status={audit.status} />
                      {audit.input_type === "image"
                        ? <Image className="h-3.5 w-3.5 text-violet-400" />
                        : <Globe className="h-3.5 w-3.5 text-zinc-500" />}
                      <span className="text-xs font-bold text-white truncate">{formatUrl(audit.start_url)}</span>
                      {audit.industry && audit.industry !== "general" && (
                        <span className="px-2 py-0.5 bg-zinc-950/60 border border-white/5 rounded-full text-5xs text-zinc-400 font-extrabold uppercase tracking-widest">
                          {audit.industry}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-5xs text-zinc-500 font-extrabold uppercase tracking-widest">
                      <span>{audit.page_count} page{audit.page_count !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>{audit.issue_count} issue{audit.issue_count !== 1 ? "s" : ""}</span>
                      <span>·</span>
                      <span>{audit.created_at?.slice(0, 16).replace("T", " ")}</span>
                      {prevScore != null && (
                        <>
                          <span>·</span>
                          <DeltaBadge current={audit.site_score} previous={prevScore} />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition shrink-0" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
