import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { client } from "../api/client";
import {
  Trophy, CheckSquare, Square, Code, Zap, Loader2,
  ChevronDown, ArrowUpRight
} from "lucide-react";

const SEV = {
  critical: { label: "Critical", color: "#f43f5e", bg: "rgba(244,63,94,0.1)",  border: "rgba(244,63,94,0.22)"  },
  serious:  { label: "Serious",  color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.22)" },
  moderate: { label: "Moderate", color: "#eab308", bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.22)"  },
  minor:    { label: "Minor",    color: "#71717a",  bg: "rgba(113,113,122,0.08)", border: "rgba(113,113,122,0.18)" },
};

function IssueCard({ issue, index, isSelected, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEV[issue.severity] || SEV.moderate;
  const totalScore = Math.round(issue.priority_score || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      style={{
        borderRadius: 16,
        border: `1px solid ${isSelected ? "rgba(0,245,160,0.3)" : "rgba(255,255,255,0.07)"}`,
        background: isSelected
          ? "rgba(0,245,160,0.04)"
          : "rgba(255,255,255,0.025)",
        overflow: "hidden",
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${sev.color}, transparent)` }} />

      <div style={{ padding: "18px 20px" }}>
        {/* Row 1: rank + severity + score */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Rank badge */}
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,172,10,0.1)", border: "1px solid rgba(255,172,10,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "#ffac0a", flexShrink: 0,
            }}>
              #{index + 1}
            </div>

            {/* Severity pill */}
            <div style={{
              padding: "3px 10px", borderRadius: 999,
              background: sev.bg, border: `1px solid ${sev.border}`,
              fontSize: 10, fontWeight: 800, color: sev.color,
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {sev.label}
            </div>

            {/* Category */}
            {issue.category && (
              <span style={{ fontSize: 10.5, color: "rgba(155,169,196,0.5)", fontWeight: 500, textTransform: "capitalize" }}>
                {issue.category.replace(/_/g, " ")}
              </span>
            )}
          </div>

          {/* Priority score */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "rgba(255,172,10,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Priority</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#ffac0a", lineHeight: 1.1 }}>{totalScore}</div>
          </div>
        </div>

        {/* Issue description */}
        <p style={{
          fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.9)",
          lineHeight: 1.55, margin: "0 0 12px",
        }}>
          {issue.description}
        </p>

        {/* Page URL */}
        {issue.page_url && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
            <ArrowUpRight size={11} color="rgba(155,169,196,0.35)" />
            <span style={{ fontSize: 10.5, color: "rgba(155,169,196,0.4)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {issue.page_url}
            </span>
          </div>
        )}

        {/* Explanation */}
        {issue.fix?.explanation_text && (
          <div style={{
            padding: "10px 14px", marginBottom: 12,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
          }}>
            <p style={{ fontSize: 12, color: "rgba(200,210,230,0.75)", lineHeight: 1.65, margin: 0 }}>
              {issue.fix.explanation_text}
            </p>
          </div>
        )}

        {/* Code block — expandable */}
        {issue.fix?.css_rule_text && (
          <div style={{ marginBottom: 14 }}>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                padding: "7px 12px",
                background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: expanded ? "8px 8px 0 0" : 8,
                color: "rgba(155,169,196,0.6)", fontSize: 10.5, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.06em",
                cursor: "pointer", justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Code size={12} />
                <span>Generated Fix</span>
              </div>
              <ChevronDown size={12} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ overflow: "hidden" }}
                >
                  <pre style={{
                    margin: 0, padding: "12px 14px",
                    background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.07)",
                    borderTop: "none", borderRadius: "0 0 8px 8px",
                    fontSize: 11.5, color: "#4ade80", fontFamily: "monospace",
                    overflowX: "auto", whiteSpace: "pre-wrap", lineHeight: 1.7,
                  }}>
                    {issue.fix.css_rule_text}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Select toggle */}
        {onToggle && (
          <button
            onClick={() => onToggle(issue.id)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "6px 12px",
              background: isSelected ? "rgba(0,245,160,0.08)" : "transparent",
              border: `1px solid ${isSelected ? "rgba(0,245,160,0.25)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8,
              color: isSelected ? "#00f5a0" : "rgba(155,169,196,0.5)",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              transition: "all 0.18s",
            }}
          >
            {isSelected
              ? <CheckSquare size={13} />
              : <Square size={13} />
            }
            <span>{isSelected ? "Selected for re-audit" : "Select fix for re-audit"}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "40px 0", color: "rgba(155,169,196,0.5)" }}>
      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: 13 }}>Priority Agent calculating top fixes…</span>
    </div>
  );

  if (!data?.top_issues?.length) return (
    <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(155,169,196,0.4)" }}>
      <Trophy size={28} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
      <p style={{ fontSize: 13 }}>No priority issues found — the site is in great shape!</p>
    </div>
  );

  const topIssues = data.top_issues;
  const totalLift = topIssues.reduce((s, i) => s + (i.priority_score || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Score lift banner */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px",
        background: "rgba(0,245,160,0.05)", border: "1px solid rgba(0,245,160,0.15)",
        borderRadius: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,172,10,0.1)", border: "1px solid rgba(255,172,10,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trophy size={15} color="#ffac0a" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Priority Agent — Top Fixes</div>
            <div style={{ fontSize: 11, color: "rgba(155,169,196,0.5)", marginTop: 1 }}>{data.message || "AI-ranked high-impact fixes"}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(0,245,160,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Est. score lift</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#00f5a0", lineHeight: 1.1 }}>+{Math.round(totalLift)}<span style={{ fontSize: 11 }}>pts</span></div>
          </div>
          <Zap size={18} color="#00f5a0" />
        </div>
      </div>

      {/* Issue cards */}
      {topIssues.map((issue, i) => (
        <IssueCard
          key={issue.id || i}
          issue={issue}
          index={i}
          isSelected={selectedFixes?.has?.(issue.id)}
          onToggle={onToggleFix}
        />
      ))}
    </div>
  );
}
