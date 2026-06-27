import React, { useState } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { HelpCircle, ChevronDown, ChevronUp, AlertCircle, ArrowUpRight, TrendingUp, ShieldAlert, Award, CheckCircle, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function ScoreCard({ siteScore, scoreBreakdown, pages, issues, mode = "all" }) {
  const [showFormula, setShowFormula] = useState(false);

  // Map category code to human readable name
  const catNames = {
    contrast: "Contrast",
    touch_target: "Touch Target",
    consistency: "Consistency",
    error_prevention: "Error Prevention",
    status_visibility: "Status Visibility",
    recognition_recall: "Ambiguous Labels",
    "axe-core": "Axe Core Baseline"
  };

  const colors = {
    contrast: "#f43f5e",        // rose-500
    touch_target: "#f97316",    // orange-500
    consistency: "#a855f7",     // purple-500
    error_prevention: "#3b82f6", // blue-500
    status_visibility: "#06b6d4",// cyan-500
    recognition_recall: "#eab308",// yellow-500
    "axe-core": "#10b981"        // emerald-500
  };

  // 1. Radar Chart Data
  const radarData = [
    { subject: "Accessibility", A: scoreBreakdown.accessibility ?? 100 },
    { subject: "Navigation", A: scoreBreakdown.navigation ?? 100 },
    { subject: "Performance", A: scoreBreakdown.performance ?? 100 },
    { subject: "Consistency", A: scoreBreakdown.consistency ?? 100 },
    { subject: "Visual Hierarchy", A: scoreBreakdown.visual_hierarchy ?? 100 }
  ];

  // 2. Donut Chart Data
  const donutData = [
    { name: "Critical", value: issues.filter(i => i.severity === "critical").reduce((acc, curr) => acc + (curr.occurrences || 1), 0), color: "#f43f5e" },
    { name: "Serious", value: issues.filter(i => i.severity === "serious").reduce((acc, curr) => acc + (curr.occurrences || 1), 0), color: "#f97316" },
    { name: "Moderate", value: issues.filter(i => i.severity === "moderate").reduce((acc, curr) => acc + (curr.occurrences || 1), 0), color: "#eab308" },
    { name: "Minor", value: issues.filter(i => i.severity === "minor").reduce((acc, curr) => acc + (curr.occurrences || 1), 0), color: "#a1a1aa" }
  ].filter(d => d.value > 0);

  // 3. Trend Chart Data
  const trendData = pages.map(p => ({
    name: `Page ${p.crawl_order}`,
    Score: p.page_score
  }));

  // Score color helper
  const getScoreColor = (score) => {
    if (score == null) return "text-zinc-550 border-zinc-800 bg-zinc-950/40";
    if (score >= 90) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    if (score >= 70) return "text-yellow-400 border-yellow-500/20 bg-yellow-500/5";
    return "text-rose-400 border-rose-500/20 bg-rose-500/5";
  };

  // Helper for generating custom progress radial path
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (siteScore / 100) * circumference;

  return (
    <div className="space-y-6 text-zinc-100">
      
      {issues.length === 0 && mode === "metrics" && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 p-5 rounded-2xl flex items-center space-x-3 shadow-lg shadow-emerald-950/20"
        >
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest">Aesthetic Evaluation Clear</h4>
            <p className="text-3xs text-emerald-500/80 font-semibold mt-0.5 uppercase tracking-widest">This URL passed all evaluated style and contrast audits successfully.</p>
          </div>
        </motion.div>
      )}
      
      {/* Top metrics row */}
      {(mode === "all" || mode === "metrics") && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Overall Health Card */}
        <div className="glass-card p-6 flex flex-col justify-between items-center text-center relative overflow-hidden group" style={{ minHeight: 285 }}>
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          <h3 className="text-3xs font-extrabold uppercase tracking-widest text-zinc-400 mb-3 flex items-center space-x-1.5">
            <Award className="h-4 w-4 text-emerald-400" />
            <span>Site UX Health Score</span>
          </h3>
          
          <div className="my-2 relative flex items-center justify-center">
            {/* Circular progress bar SVG */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-zinc-800"
                strokeWidth="8"
                fill="transparent"
              />
              <motion.circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-emerald-400"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center px-2">
              <span className={`${siteScore == null ? 'text-xs' : 'text-3xl'} font-black tracking-tight text-white`}>
                {siteScore != null ? siteScore : "Not evaluated"}
              </span>
              {siteScore != null && <span className="text-5xs text-zinc-550 uppercase tracking-widest font-black mt-0.5">SCORE</span>}
            </div>
          </div>

          <div className={`px-4 py-1.5 border rounded-full text-3xs font-black uppercase tracking-widest ${getScoreColor(siteScore)}`}>
            {siteScore == null ? "Not evaluated" : siteScore >= 90 ? "Excellent Standards" : siteScore >= 70 ? "Minor Deductions" : "Critical Fixes Required"}
          </div>
        </div>

        {/* Total issues card */}
        <div className="glass-card p-6 flex flex-col justify-between relative group" style={{ minHeight: 285 }}>
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
          <h3 className="text-3xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center space-x-1.5">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span>Violations & Occurrences Rollup</span>
          </h3>
          <div className="my-4 space-y-2">
            <div className="text-xl font-black text-white tracking-tight">
              {issues.length} <span className="text-3xs text-zinc-550 font-black uppercase tracking-widest block mt-0.5">Unique Violations</span>
            </div>
            <div className="text-xl font-black text-emerald-400 tracking-tight">
              {issues.reduce((acc, curr) => acc + (curr.occurrences || 1), 0)} <span className="text-3xs text-zinc-550 font-black uppercase tracking-widest block mt-0.5">Total Occurrences</span>
            </div>
          </div>
          <div className="text-3xs text-zinc-500 font-bold flex items-center uppercase tracking-widest">
            <TrendingUp className="h-3.5 w-3.5 text-rose-500 mr-1.5" />
            <span>Sorted via Priority Engine</span>
          </div>
        </div>

        {/* Scoring formula details */}
        <div className="glass-card p-6 flex flex-col justify-between relative" style={{ minHeight: 285 }}>
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-3xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center space-x-1.5">
              <Info className="h-4 w-4 text-blue-400" />
              <span>Scoring Engine Policy</span>
            </h3>
          </div>

          <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
            <p className="text-3xs font-bold text-zinc-500 uppercase tracking-widest">
              Prioritization Rule Basis:
            </p>
            <div className="bg-zinc-950/60 border border-white/5 p-3 rounded-xl font-mono text-3xs text-zinc-300 space-y-1 shadow-inner">
              <p className="text-emerald-400">Priority = Severity &times; Impact &times; Freq</p>
              <p className="text-4xs text-zinc-550 leading-normal mt-1 uppercase font-bold tracking-wider">
                • Severity: Critical=10, Serious=5, Moderate=2, Minor=1<br />
                • Impact: Contrast=1.2, Touch=1.0, Consistency=0.8<br />
                • Frequency: Occurrence multiplier
              </p>
            </div>
          </div>
          <span className="text-5xs text-zinc-500 block mt-2 font-black uppercase tracking-widest">All analysis is 100% deterministic rule-based.</span>
        </div>
      </div>)}
      {/* Analytics Charts Grid */}
      {(mode === "all" || mode === "charts") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* 1. Radar Compliance Chart */}
          <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-teal-500/2 to-transparent pointer-events-none" />
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-4">UX Compliance Radar</h4>
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={9} fontWeight="bold" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.05)" fontSize={7} />
                  <Radar name="Compliance" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.12} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Donut Severity Distribution Chart */}
          <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/2 to-transparent pointer-events-none" />
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-4">Severity Distribution</h4>
            <div className="h-60 w-full flex items-center justify-center relative">
              {donutData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#06070a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#f4f4f5", fontSize: "10px", fontFamily: "monospace" }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '10px', color: '#a1a1aa', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-zinc-500 text-3xs uppercase tracking-widest font-black">No issues discovered</span>
              )}
            </div>
          </div>

          {/* 3. Page Score Trend */}
          <div className="glass-card p-5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-500/2 to-transparent pointer-events-none" />
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-4">Page Score Trend</h4>
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={9} tickLine={false} />
                  <YAxis stroke="#71717a" domain={[0, 100]} fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#06070a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#f4f4f5", fontSize: "10px" }}
                  />
                  <Line type="monotone" dataKey="Score" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
