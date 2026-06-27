import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Upload, Play, Image, Eye, ChevronRight,
  Zap, Shield, Activity, Check, ArrowRight
} from "lucide-react";

const PRESETS = [
  { label: "example.com",      url: "https://example.com"      },
  { label: "tailwindcss.com",  url: "https://tailwindcss.com"  },
  { label: "kce.ac.in",        url: "https://kce.ac.in"        },
];

const CAPABILITIES = [
  { icon: Shield,   label: "WCAG 2.2 AA",         color: "#ffac0a" },
  { icon: Eye,      label: "Vision Heuristics",   color: "#00f5a0" },
  { icon: Activity, label: "Business Impact",     color: "#0175ff" },
  { icon: Zap,      label: "Fix Simulator",        color: "#f22"   },
];

export default function AuditInputPage({ onSubmitUrl, onSubmitImage, loading }) {
  const [tab,        setTab]        = useState("url");
  const [url,        setUrl]        = useState("");
  const [pageLimit,  setPageLimit]  = useState(10);
  const [dragOver,   setDragOver]   = useState(false);
  const [file,       setFile]       = useState(null);
  const fileRef = useRef(null);

  const handleFileSelect = (f) => {
    if (!f) return;
    if (!["image/png","image/jpeg","image/jpg","image/webp"].includes(f.type)) {
      alert("Only PNG, JPG, JPEG, WEBP are supported."); return;
    }
    setFile(f);
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmitUrl(url.startsWith("http") ? url : `https://${url}`, pageLimit);
  };

  const handleImageSubmit = (e) => {
    e.preventDefault();
    if (file) onSubmitImage(file);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "100px 24px 60px",
      position: "relative",
    }}>

      {/* ── Ambient glow behind panel ─────────────────────────────────── */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -55%)",
        width: 700, height: 500,
        background: "radial-gradient(ellipse at center, rgba(1,117,255,0.12) 0%, rgba(0,245,160,0.06) 40%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* ── Page header ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        style={{ textAlign: "center", marginBottom: 48, position: "relative", zIndex: 1 }}
      >
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px",
          background: "rgba(0,245,160,0.08)",
          border: "1px solid rgba(0,245,160,0.20)",
          borderRadius: 999,
          fontSize: 11, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.12em",
          color: "#34d399",
          marginBottom: 24,
        }}>
          <Zap size={11} />  Launch Audit
        </div>

        <h1 style={{
          fontSize: "clamp(32px, 5vw, 54px)",
          fontWeight: 300,
          letterSpacing: "-0.035em",
          lineHeight: 1.08,
          color: "#ffffff",
          margin: "0 0 16px",
        }}>
          Analyse your website with<br />
          <span style={{ fontWeight: 500 }}>7 AI Agents</span>
        </h1>

        <p style={{
          fontSize: 15, color: "rgba(155,169,196,0.85)",
          lineHeight: 1.7, maxWidth: 440, margin: "0 auto",
        }}>
          Paste a URL or upload a screenshot. ManualMate runs a full deterministic
          UX audit — accessibility, layout, contrast, and more.
        </p>
      </motion.div>

      {/* ── The highlighted audit panel ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 560 }}
      >
        {/* Outer glow ring */}
        <div style={{
          position: "absolute",
          inset: -1.5,
          borderRadius: 28,
          background: "linear-gradient(135deg, rgba(0,245,160,0.35), rgba(1,117,255,0.35), rgba(0,245,160,0.10))",
          zIndex: 0,
          filter: "blur(1px)",
        }} />

        {/* Panel itself */}
        <div style={{
          position: "relative", zIndex: 1,
          background: "rgba(10,13,22,0.90)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 26,
          overflow: "hidden",
          backdropFilter: "blur(40px)",
          boxShadow: "0 0 80px rgba(0,245,160,0.07), 0 40px 100px rgba(0,0,0,0.65)",
        }}>

          {/* Tabs */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(0,0,0,0.45)",
          }}>
            {[
              { id: "url",   label: "Website URL",       icon: Globe  },
              { id: "image", label: "Upload Screenshot", icon: Image  },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "16px 0",
                  background: "transparent", border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.11em",
                  color: tab === id ? "#34d399" : "rgba(100,110,135,0.75)",
                  borderBottom: tab === id ? "2px solid #34d399" : "2px solid transparent",
                  transition: "all 0.2s",
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {/* Form body */}
          <div style={{ padding: "32px 32px 36px" }}>
            <AnimatePresence mode="wait">

              {/* URL form */}
              {tab === "url" && (
                <motion.form
                  key="url"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleUrlSubmit}
                >
                  {/* URL input */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(0,0,0,0.55)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 14, padding: "14px 18px",
                    marginBottom: 16,
                    transition: "border-color 0.2s",
                  }}
                    onFocus={e => e.currentTarget.style.borderColor = "rgba(52,211,153,0.4)"}
                    onBlur={e  => e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"}
                  >
                    <Globe size={15} color="rgba(100,112,140,0.7)" />
                    <input
                      type="text"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      disabled={loading}
                      style={{
                        flex: 1, background: "transparent",
                        border: "none", outline: "none",
                        fontSize: 14, color: "#e2e8f0",
                        fontFamily: "monospace", letterSpacing: "0.02em",
                      }}
                    />
                  </div>

                  {/* Preset chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                    {PRESETS.map(p => (
                      <button
                        key={p.url}
                        type="button"
                        onClick={() => setUrl(p.url)}
                        style={{
                          padding: "7px 15px",
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 999,
                          fontSize: 12, color: "rgba(150,160,185,0.8)",
                          fontWeight: 600, cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Page limit */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: "rgba(100,112,140,0.75)", textTransform: "uppercase", letterSpacing: "0.10em", fontWeight: 700 }}>
                        Page Limit
                      </span>
                      <span style={{ fontSize: 13, color: "#34d399", fontWeight: 800 }}>{pageLimit}</span>
                    </div>
                    <input
                      type="range" min={1} max={12} value={pageLimit}
                      onChange={e => setPageLimit(Number(e.target.value))}
                      disabled={loading}
                      style={{ width: "100%", accentColor: "#34d399", cursor: "pointer", height: 4 }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: "rgba(100,112,140,0.5)" }}>1</span>
                      <span style={{ fontSize: 10, color: "rgba(100,112,140,0.5)" }}>12</span>
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading || !url.trim()}
                    whileHover={!loading && url.trim() ? { scale: 1.01 } : {}}
                    whileTap={!loading && url.trim() ? { scale: 0.99 } : {}}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      padding: "16px 0",
                      background: loading || !url.trim()
                        ? "rgba(16,185,129,0.25)"
                        : "linear-gradient(135deg, #10b981, #14b8a6)",
                      border: "none", borderRadius: 14,
                      color: loading || !url.trim() ? "rgba(255,255,255,0.35)" : "#022c22",
                      fontSize: 12, fontWeight: 900,
                      textTransform: "uppercase", letterSpacing: "0.13em",
                      cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                      transition: "all 0.25s",
                      boxShadow: loading || !url.trim() ? "none" : "0 0 32px rgba(16,185,129,0.28)",
                    }}
                  >
                    {loading
                      ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#34d399", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />Analysing…</>
                      : <><Play size={14} fill="#022c22" />Launch 7-Agent Audit<ChevronRight size={14} /></>
                    }
                  </motion.button>
                </motion.form>
              )}

              {/* Image form */}
              {tab === "image" && (
                <motion.form
                  key="image"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={handleImageSubmit}
                >
                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
                    onClick={() => fileRef.current?.click()}
                    style={{
                      border: `2px dashed ${dragOver ? "#34d399" : "rgba(255,255,255,0.10)"}`,
                      borderRadius: 16,
                      padding: "44px 24px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: dragOver ? "rgba(52,211,153,0.05)" : "rgba(0,0,0,0.20)",
                      transition: "all 0.25s",
                      marginBottom: 20,
                    }}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      style={{ display: "none" }}
                      onChange={e => handleFileSelect(e.target.files[0])}
                    />
                    {file ? (
                      <div>
                        <Image size={30} color="#34d399" style={{ margin: "0 auto 12px", display: "block" }} />
                        <p style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{file.name}</p>
                        <p style={{ color: "rgba(100,112,140,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.09em" }}>
                          {(file.size / 1024).toFixed(0)} KB · Click to change
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Upload size={28} color="rgba(100,112,140,0.55)" style={{ margin: "0 auto 14px", display: "block" }} />
                        <p style={{ color: "#9ba9c4", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Drop image or click to upload</p>
                        <p style={{ color: "rgba(100,112,140,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.09em" }}>PNG · JPG · WEBP</p>
                      </div>
                    )}
                  </div>

                  <p style={{ fontSize: 12, color: "rgba(100,112,140,0.6)", textAlign: "center", marginBottom: 20, lineHeight: 1.6 }}>
                    Ideal for Figma exports, UI screenshots, and design mockups.<br />
                    Vision Agent analyses contrast, layout, and density zones.
                  </p>

                  <motion.button
                    type="submit"
                    disabled={loading || !file}
                    whileHover={!loading && file ? { scale: 1.01 } : {}}
                    whileTap={!loading && file ? { scale: 0.99 } : {}}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                      padding: "16px 0",
                      background: loading || !file
                        ? "rgba(124,58,237,0.25)"
                        : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      border: "none", borderRadius: 14,
                      color: loading || !file ? "rgba(255,255,255,0.35)" : "#fff",
                      fontSize: 12, fontWeight: 900,
                      textTransform: "uppercase", letterSpacing: "0.13em",
                      cursor: loading || !file ? "not-allowed" : "pointer",
                      boxShadow: loading || !file ? "none" : "0 0 32px rgba(124,58,237,0.28)",
                    }}
                  >
                    {loading ? "Running Vision Agent…" : <><Eye size={14} />Analyse with Vision Agent</>}
                  </motion.button>
                </motion.form>
              )}

            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── Capability chips below panel ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        style={{
          display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center",
          marginTop: 32, position: "relative", zIndex: 1,
        }}
      >
        {CAPABILITIES.map(c => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px",
                background: `${c.color}0f`,
                border: `1px solid ${c.color}28`,
                borderRadius: 999,
                fontSize: 12, fontWeight: 600,
                color: "rgba(180,188,210,0.8)",
              }}
            >
              <Icon size={12} color={c.color} />
              {c.label}
            </div>
          );
        })}
      </motion.div>

      {/* ── Checklist below chips ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        style={{
          display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center",
          marginTop: 28, position: "relative", zIndex: 1,
        }}
      >
        {[
          "No account required",
          "Deterministic scores — never fabricated",
          "Runs in ~30 seconds",
        ].map(text => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: "rgba(52,211,153,0.12)",
              border: "1px solid rgba(52,211,153,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Check size={10} color="#34d399" />
            </div>
            <span style={{ fontSize: 13, color: "rgba(155,169,196,0.75)", fontWeight: 500 }}>{text}</span>
          </div>
        ))}
      </motion.div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
