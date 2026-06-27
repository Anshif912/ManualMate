import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Globe, Upload, Play, Image, Sparkles, ChevronRight, Shield, Zap, Eye,
  Compass, Award, Activity, BarChart3, HelpCircle, ArrowRight, Check,
  Star, Users, TrendingUp, Brain, Layers, GitBranch, Plus, Minus
} from "lucide-react";

const PRESETS = [
  { label: "example.com", url: "https://example.com" },
  { label: "tailwindcss.com", url: "https://tailwindcss.com" },
  { label: "kce.ac.in", url: "https://kce.ac.in" },
];



/* ══════════════════════════════════════════════════════════════════════════
   TICKER — logo strip like CosmoQ
   ══════════════════════════════════════════════════════════════════════════ */
const INTEGRATIONS = [
  "Axe-Core", "Playwright", "Google AI", "WCAG 2.2", "Figma API",
  "PIL Vision", "SQLite", "FastAPI", "React", "Framer",
  "Accessibility", "UX Analytics", "AI Agents", "SSE Streaming",
];

function Ticker() {
  const items = [...INTEGRATIONS, ...INTEGRATIONS];
  return (
    <div className="cosmo-ticker" style={{ padding: "0 0 0 0" }}>
      <div className="cosmo-ticker-inner">
        {items.map((item, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:32, padding:"0 32px", whiteSpace:"nowrap", fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>
            <span style={{ color:"var(--border)", fontSize:20, fontWeight:200 }}>·</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STATS ROW
   ══════════════════════════════════════════════════════════════════════════ */
const STATS = [
  { value: "7", suffix: "x", label: "Agents in sequence" },
  { value: "100", suffix: "%", label: "Deterministic scoring" },
  { value: "5", suffix: "+", label: "UX categories evaluated" },
  { value: "WCAG", suffix: "", label: "2.2 AA compliant checks" },
];

/* ══════════════════════════════════════════════════════════════════════════
   FEATURES SECTION
   ══════════════════════════════════════════════════════════════════════════ */
const FEATURES_MAIN = [
  {
    icon: Globe,
    title: "Multi-Page Crawler",
    desc: "Automatically maps your entire website, resolves duplicate URLs, and runs sequential UX audits on every page — up to 12 pages deep.",
    tags: ["Playwright", "URL Dedup", "Sequential"],
    col: "#0175ff",
  },
  {
    icon: Eye,
    title: "Vision AI Analysis",
    desc: "PIL-powered computer vision that segments layout zones, analyses contrast ratios, detects text density issues and colour accessibility failures.",
    tags: ["PIL", "Contrast", "Zones"],
    col: "#00f5a0",
  },
  {
    icon: Shield,
    title: "WCAG 2.2 Engine",
    desc: "Fully deterministic accessibility auditing powered by Axe-Core. Scores each violation by severity — Critical, Serious, Moderate, Minor.",
    tags: ["Axe-Core", "WCAG 2.2", "Severity"],
    col: "#ffac0a",
  },
  {
    icon: BarChart3,
    title: "Business Impact",
    desc: "Translate every UX violation into predicted revenue and conversion impact using research-backed Nielsen Norman data models.",
    tags: ["ROI", "Conversion", "Research"],
    col: "#f24",
  },
];

const FEATURES_GRID = [
  { icon: Award,       title: "Persona Simulation",    desc: "Simulate elderly, colour-blind, and impaired user journeys through your interface." },
  { icon: Zap,         title: "Fix Simulator",          desc: "Generate production CSS overrides with live diff preview and side-by-side comparison." },
  { icon: HelpCircle,  title: "AI Chat Agent",          desc: "Ask questions about your audit. Context-aware answers strictly from the database." },
  { icon: GitBranch,   title: "Re-Audit Diffing",       desc: "Compare before/after audits with score changes, new violations, and resolved issues." },
  { icon: Layers,      title: "Executive Reports",      desc: "Auto-generated PDF/CSV exports with executive summaries and technical deep-dives." },
  { icon: Brain,       title: "Priority Ranking",       desc: "AI sorts your violations by business impact so you fix the right things first." },
];

/* ══════════════════════════════════════════════════════════════════════════
   PRICING SECTION
   ══════════════════════════════════════════════════════════════════════════ */
const PLANS = [
  {
    name: "Starter",
    price: "Free",
    sub: "Self-hosted",
    desc: "Everything you need to start auditing.",
    features: ["Up to 3 pages per audit", "Axe-Core accessibility", "Vision heuristics", "Score breakdown"],
    cta: "Get Started",
    featured: false,
  },
  {
    name: "Pro",
    price: "$49",
    sub: "/ month",
    desc: "For teams that need full-depth analysis.",
    features: ["Up to 12 pages per audit", "All 7 AI agents", "Business impact reports", "Persona simulation", "Fix simulator + CSS export", "Priority ranking", "AI Chat agent"],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    sub: "Contact us",
    desc: "Unlimited scale, dedicated support.",
    features: ["Unlimited pages", "Custom agent pipeline", "White-label reports", "API access", "SLA support", "On-premise deployment"],
    cta: "Talk to Sales",
    featured: false,
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   FAQ SECTION
   ══════════════════════════════════════════════════════════════════════════ */
const FAQS = [
  { q: "What is ManualMate AI?", a: "ManualMate AI is an autonomous UX auditing platform powered by 7 sequential AI agents. It crawls your website, analyses layout, accessibility, contrast, and UX patterns, then produces deterministic scores and actionable fixes." },
  { q: "How does the scoring work?", a: "Scoring is fully deterministic — never randomised. Each WCAG violation is assigned a fixed deduction: Critical=10pts, Serious=5pts, Moderate=2pts, Minor=1pt. Each category is capped at 40pt deduction. Final score = 100 − total deductions." },
  { q: "Can it audit multi-page websites?", a: "Yes. The Explorer Agent crawls your site up to the page limit you set (max 12). It deduplicates URLs, normalises paths, and audits each page sequentially with full Playwright browser rendering." },
  { q: "Is the AI chat making things up?", a: "No. The AI Chat Agent is strictly bound to your audit database records. It cannot fabricate scores, issues, or recommendations — all answers are grounded in actual detected violations." },
  { q: "What file formats can I upload?", a: "You can upload PNG, JPG, JPEG, or WEBP screenshots for single-page visual analysis via the Vision Agent. This is great for Figma designs or existing UI mockups." },
];

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <div>
      {FAQS.map((f, i) => (
        <div key={i} className="cosmo-faq-item" onClick={() => setOpen(open === i ? null : i)}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
            <span style={{ fontSize:16, fontWeight:500, color:"var(--text-primary)" }}>{f.q}</span>
            <div style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"50%", background:"rgba(255,255,255,0.06)", border:"1px solid var(--border)", flexShrink:0, transition:"transform 0.25s" }}>
              {open === i ? <Minus size={13} color="var(--text-secondary)" /> : <Plus size={13} color="var(--text-secondary)" />}
            </div>
          </div>
          <AnimatePresence>
            {open === i && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.28 }} style={{ overflow:"hidden" }}>
                <p style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.7, marginTop:16 }}>{f.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MOCK AUDIT TERMINAL — Premium teaser card routing to separate page
   ══════════════════════════════════════════════════════════════════════════ */
function MockAuditTerminal({ onGoAuditInput }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65 }}
      onClick={onGoAuditInput}
      style={{
        background: "rgba(12,15,22,0.85)",
        border: "1px solid rgba(125,164,255,0.14)",
        borderRadius: 24,
        overflow: "hidden",
        backdropFilter: "blur(28px)",
        boxShadow: "0 0 48px rgba(1,117,255,0.06), 0 32px 64px rgba(0,0,0,0.55)",
        width: "100%",
        maxWidth: 520,
        cursor: "pointer",
        transition: "border-color 0.25s, transform 0.25s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(125,164,255,0.30)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(125,164,255,0.14)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Title Bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyItems: "center",
        padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.35)", gap: 8
      }}>
        <div style={{ display:"flex", gap:6 }}>
          <span style={{ width:10, height:10, borderRadius:"50%", background:"#ff5f56" }} />
          <span style={{ width:10, height:10, borderRadius:"50%", background:"#ffbd2e" }} />
          <span style={{ width:10, height:10, borderRadius:"50%", background:"#27c93f" }} />
        </div>
        <div style={{
          marginLeft: "auto", marginRight: "auto",
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.08em", color: "rgba(155,169,196,0.6)"
        }}>
          Autonomous Audit Terminal
        </div>
      </div>

      {/* Terminal Screen Body */}
      <div style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
          <Globe size={14} color="rgba(100,110,135,0.5)" />
          <div style={{ color: "rgba(155,169,196,0.5)", fontSize: 13, fontFamily: "monospace" }}>
            https://yourwebsite.com
          </div>
        </div>

        {/* Mock logs */}
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(155,169,196,0.65)", lineHeight: 1.8, marginBottom: 24, textAlign: "left" }}>
          <div><span style={{ color: "#34d399" }}>$</span> init pipeline --agents=7</div>
          <div><span style={{ color: "#0175ff" }}>[info]</span> Explorer crawler ready.</div>
          <div><span style={{ color: "#0175ff" }}>[info]</span> Vision segmenter initialised.</div>
          <div><span style={{ color: "#00f5a0" }}>[ready]</span> Open workspace to begin audit.</div>
        </div>

        {/* Big Launch button */}
        <div style={{
          width: "100%", padding: "14px 0",
          background: "linear-gradient(135deg, #0175ff, #00f5a0)",
          border: "none", borderRadius: 12,
          color: "#06070a", fontSize: 12, fontWeight: 900,
          textTransform: "uppercase", letterSpacing: "0.10em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          <Sparkles size={14} fill="#06070a" />
          Open Audit Workspace
          <ChevronRight size={14} />
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION HEADER — reusable CosmoQ section intro
   ══════════════════════════════════════════════════════════════════════════ */
function SectionHead({ label, title, sub }) {
  return (
    <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
      style={{ textAlign:"center", marginBottom:56 }}>
      {label && <div className="cosmo-label" style={{ marginBottom:16 }}>{label}</div>}
      <h2 className="cosmo-h2">{title}</h2>
      {sub && <p className="cosmo-body" style={{ marginTop:16, maxWidth:480, margin:"16px auto 0" }}>{sub}</p>}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ══════════════════════════════════════════════════════════════════════════ */
export default function LandingHero({ onSubmitUrl, onSubmitImage, loading, onGoAuditInput }) {
  const auditRef = useRef(null);
  const scrollTo = () => {
    if (onGoAuditInput) { onGoAuditInput(); return; }
    auditRef.current?.scrollIntoView({ behavior:"smooth" });
  };

  return (
    <div style={{ position:"relative", minHeight:"100vh", color:"var(--text-primary)", fontFamily:"'Inter', sans-serif", overflowX:"hidden" }}>

      <div className="cosmo-noise" />

      {/* ── All content above canvas ────────────────────────────────────── */}
      <div style={{ position:"relative", zIndex:10 }}>

        {/* ════════════════════════════════════════════════════════════════
            HERO SECTION
            ════════════════════════════════════════════════════════════════ */}
        <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"120px 24px 60px" }}>

          {/* Pill */}
          <motion.div initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.55 }} style={{ marginBottom:32 }}>
            <span className="cosmo-pill">Beta Version is launching on 12th September</span>
          </motion.div>

          {/* H1 */}
          <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.65, delay:0.1 }} className="cosmo-h1"
            style={{ maxWidth:780, margin:"0 auto" }}>
            Next-gen enterprise<br />
            <span style={{ fontWeight:400 }}>with AI Agents</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.65, delay:0.2 }} className="cosmo-body"
            style={{ maxWidth:480, margin:"28px auto 0" }}>
            Accelerate the speed of auditing with the ManualMate Platform and our AI
            solutions for layout, contrast, and performance.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.65, delay:0.3 }}
            style={{ display:"flex", gap:14, marginTop:44, flexWrap:"wrap", justifyContent:"center" }}>
            <button className="cosmo-btn-dark" onClick={scrollTo}>Get Started</button>
            <button className="cosmo-btn-ghost" onClick={scrollTo} style={{ display:"flex", alignItems:"center", gap:8 }}>
              See Demo <ArrowRight size={14} />
            </button>
          </motion.div>

          {/* Stats row */}
          <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.65, delay:0.45 }}
            style={{ display:"flex", gap:40, marginTop:70, flexWrap:"wrap", justifyContent:"center" }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign:"center" }}>
                <div className="cosmo-stat-num">{s.value}<span style={{ color:"var(--text-secondary)", fontWeight:300 }}>{s.suffix}</span></div>
                <div className="cosmo-small" style={{ marginTop:6 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            TICKER
            ════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:"40px 0", borderTop:"1px solid rgba(255,255,255,0.06)", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(0,0,0,0.25)" }}>
          <Ticker />
        </section>

        {/* ════════════════════════════════════════════════════════════════
            AUDIT PANEL
            ════════════════════════════════════════════════════════════════ */}
        <section ref={auditRef} style={{ padding:"100px 24px", scrollMarginTop:80 }}>
          <div style={{ maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center" }} className="audit-grid">
            {/* Left: copy */}
            <motion.div initial={{ opacity:0, x:-28 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.7 }}>
              <div className="cosmo-label" style={{ marginBottom:20 }}>Start Your Audit</div>
              <h2 className="cosmo-h2" style={{ marginBottom:20 }}>
                Analyse any website<br />in seconds
              </h2>
              <p className="cosmo-body" style={{ marginBottom:32 }}>
                Paste a URL or drop a screenshot. ManualMate's 7-agent pipeline runs accessibility
                checks, vision analysis, and UX scoring — all without human intervention.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {["Axe-Core WCAG 2.2 scanning", "PIL vision layout analysis", "Deterministic scoring engine", "AI-generated fix recommendations"].map(f => (
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(52,211,153,0.15)", border:"1px solid rgba(52,211,153,0.3)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Check size={11} color="#34d399" />
                    </div>
                    <span className="cosmo-small">{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: panel */}
            <div style={{ display:"flex", justifyContent:"center" }}>
              <MockAuditTerminal onGoAuditInput={onGoAuditInput} />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FEATURES — 4 main cards
            ════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:"100px 24px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <SectionHead label="Core Capabilities" title="Everything your UX team needs" sub="ManualMate audits layout, accessibility, contrast, and performance — all from a single automated pipeline." />

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:20 }}>
              {FEATURES_MAIN.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div key={f.title} initial={{ opacity:0, y:18 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:i*0.08 }}
                    className="cosmo-card" style={{ padding:"28px 24px" }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:`${f.col}18`, border:`1px solid ${f.col}30`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
                      <Icon size={20} color={f.col} />
                    </div>
                    <h3 style={{ fontSize:16, fontWeight:600, color:"var(--text-primary)", marginBottom:10, letterSpacing:"-0.01em" }}>{f.title}</h3>
                    <p className="cosmo-small" style={{ marginBottom:20 }}>{f.desc}</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                      {f.tags.map(t => <span key={t} className="cosmo-tag">{t}</span>)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FEATURES — 6 smaller grid cards
            ════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:"0 24px 100px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
              {FEATURES_GRID.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div key={f.title} initial={{ opacity:0, y:14 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.45, delay:i*0.06 }}
                    className="cosmo-card" style={{ padding:"24px 20px" }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                      <Icon size={16} color="var(--text-secondary)" />
                    </div>
                    <h4 style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)", marginBottom:8 }}>{f.title}</h4>
                    <p style={{ fontSize:12, color:"var(--text-secondary)", lineHeight:1.6 }}>{f.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PIPELINE VISUALIZER
            ════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:"100px 24px", borderTop:"1px solid rgba(255,255,255,0.06)", background:"rgba(0,0,0,0.18)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <SectionHead label="How It Works" title="7-Agent sequential pipeline" sub="Each agent specialises in one dimension of UX quality. They run in order, passing context forward." />

            <div style={{ display:"flex", flexWrap:"wrap", gap:12, justifyContent:"center", position:"relative" }}>
              {/* Connector line */}
              <div style={{ position:"absolute", top:36, left:"10%", right:"10%", height:1, background:"linear-gradient(90deg,transparent,rgba(52,211,153,0.25),rgba(1,117,255,0.25),transparent)", pointerEvents:"none" }} />

              {[
                { name:"Coordination", icon:Sparkles, color:"#ffac0a" },
                { name:"Explorer",     icon:Globe,    color:"#0175ff" },
                { name:"Vision",       icon:Eye,      color:"#00f5a0" },
                { name:"UX Eval",      icon:Shield,   color:"#f24" },
                { name:"Fix Sim",      icon:Zap,      color:"#ffac0a" },
                { name:"Priority",     icon:Activity, color:"#0175ff" },
                { name:"AI Chat",      icon:HelpCircle, color:"#00f5a0" },
              ].map((n, i) => {
                const Icon = n.icon;
                return (
                  <motion.div key={n.name} initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.45, delay:i*0.09 }}
                    style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:16, padding:"20px 16px", width:130, display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", position:"relative", zIndex:1 }}>
                    <div style={{ width:48, height:48, borderRadius:14, background:`${n.color}14`, border:`1px solid ${n.color}30`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                      <Icon size={20} color={n.color} />
                    </div>
                    <div style={{ fontSize:9, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Step {i+1}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:"var(--text-primary)" }}>{n.name}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            PRICING SECTION
            ════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:"100px 24px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth:1100, margin:"0 auto" }}>
            <SectionHead label="Pricing" title="Simple, transparent pricing" sub="Start free. Upgrade when you need more power." />

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
              {PLANS.map((plan, i) => (
                <motion.div key={plan.name} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:i*0.1 }}
                  className={`cosmo-pricing-card${plan.featured?" featured":""}`}>
                  {plan.featured && (
                    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#0175ff", marginBottom:-8 }}>Most Popular</div>
                  )}
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text-secondary)", marginBottom:8 }}>{plan.name}</div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                      <span style={{ fontSize:40, fontWeight:300, letterSpacing:"-0.04em", color:"var(--text-primary)" }}>{plan.price}</span>
                      <span style={{ fontSize:14, color:"var(--text-secondary)" }}>{plan.sub}</span>
                    </div>
                    <p style={{ fontSize:13, color:"var(--text-secondary)", marginTop:12, lineHeight:1.6 }}>{plan.desc}</p>
                  </div>
                  <div style={{ flex:1 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                        <Check size={13} color="#34d399" />
                        <span style={{ fontSize:13, color:"var(--text-secondary)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button className={plan.featured ? "cosmo-btn-primary" : "cosmo-btn-ghost"} style={{ width:"100%", justifyContent:"center" }}>
                    {plan.cta}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FAQ
            ════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:"100px 24px", borderTop:"1px solid rgba(255,255,255,0.06)", background:"rgba(0,0,0,0.18)" }}>
          <div style={{ maxWidth:720, margin:"0 auto" }}>
            <SectionHead label="FAQ" title="Frequently asked questions" />
            <FAQ />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            CTA BANNER
            ════════════════════════════════════════════════════════════════ */}
        <section style={{ padding:"100px 24px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth:800, margin:"0 auto", textAlign:"center" }}>
            <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.65 }}>
              <div className="cosmo-label" style={{ marginBottom:20 }}>Get Started Today</div>
              <h2 className="cosmo-h2" style={{ marginBottom:24 }}>
                Start auditing smarter.<br />Not harder.
              </h2>
              <p className="cosmo-body" style={{ marginBottom:40, maxWidth:440, margin:"0 auto 40px" }}>
                ManualMate AI gives your team automated, deterministic UX intelligence at enterprise scale.
              </p>
              <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
                <button className="cosmo-btn-primary" onClick={scrollTo}>Start Free Audit</button>
                <button className="cosmo-btn-ghost" style={{ display:"flex", alignItems:"center", gap:8 }}>Learn More <ArrowRight size={14} /></button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            FOOTER
            ════════════════════════════════════════════════════════════════ */}
        <footer style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"48px 24px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:24 }}>
            <div>
              <div style={{ fontSize:15, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--text-primary)", marginBottom:6 }}>MANUALMATE</div>
              <div style={{ fontSize:13, color:"var(--text-secondary)" }}>Autonomous UX Auditing · AI Agents · WCAG 2.2</div>
            </div>
            <div style={{ fontSize:12, color:"rgba(100,110,135,0.6)", fontWeight:500 }}>
              © 2026 ManualMate AI · All rights reserved
            </div>
          </div>
        </footer>

      </div>{/* end z-10 wrapper */}
    </div>
  );
}
