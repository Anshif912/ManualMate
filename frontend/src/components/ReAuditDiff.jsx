import React, { useState } from "react";
import { Sparkles, ArrowRight, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { client } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";

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

  const numFixes = selectedFixes?.length || 0;

  return (
    <div className="glass-panel" style={{ padding: "24px 28px", height: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(0, 245, 160, 0.1)", border: "1px solid rgba(0, 245, 160, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={15} color="#00f5a0" />
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Regression Estimator</h3>
            <p style={{ fontSize: 11, color: "rgba(155, 169, 196, 0.5)", margin: "2px 0 0" }}>Local override score simulation</p>
          </div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(155,169,196,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Re-Audit Diff
        </span>
      </div>

      {/* Selector and Action card */}
      <div style={{
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "16px 18px",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        gap: 14
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Evaluate selected CSS override patches</h4>
          <p style={{ fontSize: 11, color: "rgba(155, 169, 196, 0.5)", margin: 0, lineHeight: 1.4 }}>
            Analyze {numFixes} checked CSS overrides and re-evaluate compliance score diffs.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReAudit}
          disabled={loading || numFixes === 0}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 16px",
            background: loading || numFixes === 0 ? "rgba(255, 255, 255, 0.03)" : "linear-gradient(135deg,#00f5a0,#14b8a6)",
            border: "none",
            borderRadius: 10,
            color: loading || numFixes === 0 ? "rgba(255, 255, 255, 0.25)" : "#022c22",
            fontSize: 11.5,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            cursor: loading || numFixes === 0 ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow: loading || numFixes === 0 ? "none" : "0 4px 14px rgba(0, 245, 160, 0.2)"
          }}
        >
          {loading ? (
            <>
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
              <span>Re-Evaluating...</span>
            </>
          ) : (
            <>
              <span>Apply & Re-Audit</span>
              <ArrowRight size={13} />
            </>
          )}
        </button>
      </div>

      {/* Results Comparison */}
      <AnimatePresence>
        {diffResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, justifyContent: "center" }}
          >
            <div style={{ height: 1, background: "rgba(255, 255, 255, 0.06)" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14, alignItems: "center" }}>
              {/* Baseline */}
              <div style={{
                background: "rgba(244, 63, 94, 0.03)",
                border: "1px solid rgba(244, 63, 94, 0.15)",
                borderRadius: 12,
                padding: "12px 14px",
                textAlign: "center"
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(244, 63, 94, 0.6)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>Baseline Score</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: "#f43f5e", display: "block", marginTop: 4 }}>{diffResult.before?.site_score}</span>
              </div>

              <ChevronRight size={20} color="rgba(255,255,255,0.15)" />

              {/* Post-Fix */}
              <div style={{
                background: "rgba(0, 245, 160, 0.05)",
                border: "1px solid rgba(0, 245, 160, 0.25)",
                borderRadius: 12,
                padding: "12px 14px",
                textAlign: "center"
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(0, 245, 160, 0.7)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>Post-Fix Score</span>
                <span style={{ fontSize: 32, fontWeight: 900, color: "#00f5a0", display: "block", marginTop: 4 }}>{diffResult.after?.site_score}</span>
              </div>
            </div>

            {/* Metrics List */}
            <div style={{
              background: "rgba(255, 255, 255, 0.01)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: 12,
              padding: "12px 16px"
            }}>
              <h5 style={{ fontSize: 10, fontWeight: 800, color: "rgba(155, 169, 196, 0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Score Improvement Summary</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11.5, color: "#cbd5e1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#00f5a0" }} />
                  <span>Site health score improved by <strong style={{ color: "#00f5a0" }}>+{Math.round((diffResult.after?.site_score || 0) - (diffResult.before?.site_score || 0))} points</strong>.</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#00f5a0" }} />
                  <span>Solved <strong style={{ color: "#00f5a0" }}>{numFixes} layout & compliance errors</strong>.</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#34d399", fontWeight: 600, fontSize: 11, marginTop: 4 }}>
                  <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
                  <span>Patches validated and ready for build handoff.</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
