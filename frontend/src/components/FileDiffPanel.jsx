import React, { useState } from "react";
import { FileUp, GitPullRequest, Code, Loader2 } from "lucide-react";
import { client } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";

export default function FileDiffPanel({ auditId }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await client.uploadDiff(auditId, file);
      setDiff(res.diff);
    } catch (err) {
      console.error(err);
      setDiff("Failed to compute CSS diff file.");
    } finally {
      setLoading(false);
    }
  };

  const renderDiffLines = () => {
    if (!diff) return null;
    return diff.split("\n").map((line, idx) => {
      let lineStyle = "rgba(155, 169, 196, 0.4)";
      let background = "transparent";
      let borderLeft = "none";
      let paddingLeft = 0;

      if (line.startsWith("+") && !line.startsWith("+++")) {
        lineStyle = "#34d399";
        background = "rgba(52, 211, 153, 0.06)";
        borderLeft = "2px solid #10b981";
        paddingLeft = 6;
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        lineStyle = "#f43f5e";
        background = "rgba(244, 63, 94, 0.06)";
        borderLeft = "2px solid #ef4444";
        paddingLeft = 6;
      } else if (line.startsWith("@@")) {
        lineStyle = "#22d3ee";
      }

      return (
        <div
          key={idx}
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            lineHeight: 1.6,
            color: lineStyle,
            background,
            borderLeft,
            paddingLeft,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all"
          }}
        >
          {line}
        </div>
      );
    });
  };

  return (
    <div className="glass-panel" style={{ padding: "24px 28px", height: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(1, 117, 255, 0.1)", border: "1px solid rgba(1, 117, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GitPullRequest size={15} color="#0175ff" />
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Stylesheet Patch Diff</h3>
            <p style={{ fontSize: 11, color: "rgba(155, 169, 196, 0.5)", margin: "2px 0 0" }}>Compare stylesheet lines against overrides</p>
          </div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(155,169,196,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Production Patch
        </span>
      </div>

      {/* File selector card */}
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
          <h4 style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Upload production CSS file</h4>
          <p style={{ fontSize: 11, color: "rgba(155, 169, 196, 0.5)", margin: 0, lineHeight: 1.4 }}>
            Select local stylesheet (e.g. <code>global.css</code>) to see unified git diff patches.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Custom styled file input */}
          <div style={{ position: "relative", overflow: "hidden", display: "inline-block" }}>
            <input
              type="file"
              accept=".css"
              id="file-upload-input"
              onChange={handleFileChange}
              disabled={loading}
              style={{
                fontSize: 100,
                position: "absolute",
                left: 0,
                top: 0,
                opacity: 0,
                cursor: "pointer"
              }}
            />
            <label
              htmlFor="file-upload-input"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 8,
                fontSize: 11.5,
                color: file ? "#fff" : "rgba(155, 169, 196, 0.5)",
                fontWeight: 650,
                cursor: "pointer"
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>
                {file ? file.name : "Choose CSS file..."}
              </span>
              <span style={{
                background: "rgba(255,255,255,0.08)",
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 10,
                color: "#e2e8f0"
              }}>Browse</span>
            </label>
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={loading || !file}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 16px",
              background: loading || !file ? "rgba(255, 255, 255, 0.03)" : "linear-gradient(135deg,#0175ff,#3b82f6)",
              border: "none",
              borderRadius: 10,
              color: loading || !file ? "rgba(255, 255, 255, 0.25)" : "#fff",
              fontSize: 11.5,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              cursor: loading || !file ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: loading || !file ? "none" : "0 4px 14px rgba(1, 117, 255, 0.2)"
            }}
          >
            {loading ? (
              <>
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                <span>Computing Diff...</span>
              </>
            ) : (
              <>
                <FileUp size={13} />
                <span>Generate Diff</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Diff Output */}
      <AnimatePresence>
        {diff && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minHeight: 180 }}
          >
            <div style={{ height: 1, background: "rgba(255, 255, 255, 0.06)" }} />

            <div style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              flex: 1
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 800, color: "rgba(155, 169, 196, 0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <Code size={12} color="#10b981" />
                <span>Unified Diff Patch</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", maxHeight: 180, display: "flex", flexDirection: "column", gap: 2, scrollbarWidth: "thin" }}>
                {renderDiffLines()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
