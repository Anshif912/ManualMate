import React, { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { client } from "./api/client";
import LandingHero from "./components/LandingHero";
import AuditInputPage from "./components/AuditInputPage";
import PremiumResultView from "./components/PremiumResultView";
import CosmoCanvas from "./components/CosmoCanvas";
import CrawlProgress from "./components/CrawlProgress";
import {
  Shield, LayoutDashboard, ArrowLeft, Globe, Image,
  Sparkles, ChevronRight, Activity, FileText, ShieldAlert,
  TrendingUp, Users, Palette, GitBranch, Wrench, BarChart3, CheckCircle
} from "lucide-react";

// Lazy-loaded audit detail components
const ScoreCard          = lazy(() => import("./components/ScoreCard"));
const SiteMap            = lazy(() => import("./components/SiteMap"));
const ConsistencyPlot    = lazy(() => import("./components/ConsistencyPlot"));
const AnnotatedScreenshot= lazy(() => import("./components/AnnotatedScreenshot"));
const FixPreviewFrame    = lazy(() => import("./components/FixPreviewFrame"));
const JourneyTimeline    = lazy(() => import("./components/JourneyTimeline"));
const ChatPanel          = lazy(() => import("./components/ChatPanel"));
const ExportButton       = lazy(() => import("./components/ExportButton"));
const ReAuditDiff        = lazy(() => import("./components/ReAuditDiff"));
const FileDiffPanel      = lazy(() => import("./components/FileDiffPanel"));
const IssueList          = lazy(() => import("./components/IssueList"));
const MasterDashboard    = lazy(() => import("./components/MasterDashboard"));
const NavigationGraph    = lazy(() => import("./components/NavigationGraph"));
const ExecutiveDashboard = lazy(() => import("./components/ExecutiveDashboard"));
const BusinessImpactPanel= lazy(() => import("./components/BusinessImpactPanel"));
const PersonaPanel       = lazy(() => import("./components/PersonaPanel"));
const ThemeRecommendation= lazy(() => import("./components/ThemeRecommendation"));
const PriorityAgent      = lazy(() => import("./components/PriorityAgent"));

// ── Views ─────────────────────────────────────────────────────────────────────
const VIEW_LANDING     = "landing";
const VIEW_AUDIT_INPUT = "audit_input";
const VIEW_DASHBOARD   = "dashboard";
const VIEW_AUDIT       = "audit";

const AUDIT_TABS = [
  { id: "overview",   label: "Overview",        icon: LayoutDashboard },
  { id: "executive",  label: "Executive Summary",icon: FileText        },
  { id: "issues",     label: "Issues & Fixes",   icon: ShieldAlert     },
  { id: "impact",     label: "Business Impact",  icon: TrendingUp      },
  { id: "personas",   label: "Personas",         icon: Users           },
  { id: "theme",      label: "Theme & Palette",  icon: Palette         },
  { id: "graph",      label: "Nav Graph",        icon: GitBranch       },
  { id: "tools",      label: "Tools",            icon: Wrench          },
];

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function NavBar({ view, onGoHome, onGoDashboard, onGoAuditInput, auditUrl, inputType }) {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0,
      zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px 24px",
      pointerEvents: "none",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", maxWidth: 1200,
        pointerEvents: "all",
      }}>

        {/* Logo */}
        <button onClick={onGoHome} style={{ background:"none", border:"none", cursor:"pointer",
          fontSize:15, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#ffffff" }}>
          MANUALMATE
        </button>

        {/* Center pill nav */}
        {view === VIEW_LANDING ? (
          <nav style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 10px",
            background:"rgba(12,15,22,0.80)", border:"1px solid rgba(255,255,255,0.10)",
            borderRadius:999, backdropFilter:"blur(20px)" }}>
            {["AI Solutions","About","Pricing","Contact"].map(item => (
              <button key={item}
                onClick={item==="Pricing" ? () => document.querySelector("[data-section=pricing]")?.scrollIntoView({behavior:"smooth"}) : undefined}
                style={{ padding:"7px 16px", background:"transparent", border:"none", cursor:"pointer",
                  fontSize:13.5, fontWeight:500, color:"rgba(155,169,196,0.9)", borderRadius:999,
                  transition:"color 0.2s, background 0.2s" }}
                onMouseEnter={e=>{e.currentTarget.style.color="#fff"; e.currentTarget.style.background="rgba(255,255,255,0.06)";}}
                onMouseLeave={e=>{e.currentTarget.style.color="rgba(155,169,196,0.9)"; e.currentTarget.style.background="transparent";}}>
                {item}
              </button>
            ))}
          </nav>
        ) : view === VIEW_AUDIT_INPUT ? (
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"rgba(120,130,150,0.8)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em" }}>
            <button onClick={onGoHome} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(120,130,150,0.8)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",fontSize:12 }}>Home</button>
            <ChevronRight size={12} color="rgba(80,90,110,0.8)" />
            {view === VIEW_AUDIT_INPUT && <span style={{color:"#e2e8f0"}}>New Audit</span>}
            {view === VIEW_DASHBOARD && <span style={{color:"#e2e8f0"}}>Dashboard</span>}
            {view === VIEW_AUDIT && (
              <>
                <button onClick={onGoDashboard} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(120,130,150,0.8)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",fontSize:12 }}>Dashboard</button>
                <ChevronRight size={12} color="rgba(80,90,110,0.8)" />
                <span style={{ color:"#e2e8f0", fontFamily:"monospace", textTransform:"none", letterSpacing:"0.02em", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{auditUrl}</span>
              </>
            )}
          </div>
        ) : null}


        {/* Right CTA */}
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {view === VIEW_LANDING ? (
            <button onClick={() => onGoAuditInput()} style={{
              padding:"10px 22px", background:"#000", color:"#fff",
              border:"1px solid rgba(255,255,255,0.14)", borderRadius:10,
              fontSize:13, fontWeight:600, cursor:"pointer",
              boxShadow:"0 0 20px rgba(1,117,255,0.18)",
              transition:"box-shadow 0.25s",
            }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow="0 0 36px rgba(1,117,255,0.38)"}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="0 0 20px rgba(1,117,255,0.18)"}
            >Get Started</button>
          ) : view === VIEW_AUDIT_INPUT ? (
            <button onClick={onGoHome} style={{
              padding:"9px 18px", background:"transparent",
              border:"1px solid rgba(255,255,255,0.10)", borderRadius:10,
              fontSize:12, fontWeight:600, color:"rgba(155,169,196,0.8)", cursor:"pointer",
            }}>← Back to Home</button>
          ) : (
            <>
              {view !== VIEW_DASHBOARD && (
                <button onClick={onGoDashboard} style={{
                  display:"flex",alignItems:"center",gap:6,
                  padding:"9px 16px", background:"rgba(12,15,22,0.8)",
                  border:"1px solid rgba(255,255,255,0.08)", borderRadius:10,
                  fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.09em",
                  color:"rgba(155,169,196,0.85)", cursor:"pointer",
                }}>
                  <LayoutDashboard size={13} /><span>Dashboard</span>
                </button>
              )}
              <button onClick={onGoHome} style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"9px 16px",
                background:"rgba(52,211,153,0.10)", border:"1px solid rgba(52,211,153,0.22)",
                borderRadius:10, fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.09em",
                color:"#34d399", cursor:"pointer",
              }}>
                <Sparkles size={13} /><span>New Audit</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  // ── View state ────────────────────────────────────────────────────────────
  const [view, setView] = useState(VIEW_LANDING);

  // ── Audit state ───────────────────────────────────────────────────────────
  const [loading, setLoading]           = useState(false);
  const [auditId, setAuditId]           = useState(null);
  const [auditStatus, setAuditStatus]   = useState(null);
  const [auditUrl, setAuditUrl]         = useState("");
  const [inputType, setInputType]       = useState("url");
  const [siteScore, setSiteScore]       = useState(null);
  const [scoreBreakdown, setScoreBreakdown] = useState({});
  const [pages, setPages]               = useState([]);
  const [steps, setSteps]               = useState([]);
  const [issues, setIssues]             = useState([]);
  const [statusLog, setStatusLog]       = useState([]);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [selectedFixes, setSelectedFixes] = useState(new Set());
  const [activePageId, setActivePageId] = useState(null);
  const [activeStepId, setActiveStepId] = useState(null);
  const [activeIssueId, setActiveIssueId] = useState(null);
  const [activeTab, setActiveTab]       = useState("overview");

  // ── Derived helpers ───────────────────────────────────────────────────────
  const activePage = pages.find(p => p.id === activePageId) || pages[0] || null;

  const getFilteredIssues = () => {
    let filtered = issues;
    if (activePageId) filtered = filtered.filter(i => i.page_id === activePageId);
    if (activeStepId) filtered = filtered.filter(i => i.step_id === activeStepId);
    return filtered;
  };

  const selectedFixesList = issues
    .filter(i => selectedFixes.has(i.id))
    .map(i => i.css_rule_text)
    .filter(Boolean);

  // ── Progress Stream Handler (WebSocket -> SSE -> Polling) ─────────────────
  const startProgressStream = (id) => {
    let wsClosed = false;
    let sseStarted = false;
    let pollingInterval = null;

    const onProgressMessage = (data) => {
      setCurrentProgress(data);
      if (data.message) setStatusLog(prev => [...prev.slice(-49), data.message]);
      if (data.status === "completed" || data.status === "completed_with_errors" || data.status === "failed" || data.type === "complete" || data.type === "error") {
        const finalStatus = data.status || (data.type === "complete" ? "completed" : "failed");
        setLoading(false);
        setAuditStatus(finalStatus);
        if (finalStatus === "completed" || finalStatus === "completed_with_errors") loadAuditData(id);
        if (pollingInterval) clearInterval(pollingInterval);
        return true;
      }
      return false;
    };

    // 1. Try WebSocket
    const wsUrl = `ws://localhost:8000/ws/audit/${id}`;
    let ws = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          const done = onProgressMessage(data);
          if (done) ws.close();
        } catch {}
      };
      ws.onerror = (err) => {
        console.warn("WebSocket progress error, falling back to SSE...", err);
      };
      ws.onclose = () => {
        wsClosed = true;
        if (auditStatus !== "completed" && auditStatus !== "completed_with_errors" && auditStatus !== "failed" && !sseStarted) {
          startSseFallback();
        }
      };
    } catch (e) {
      console.warn("WebSocket init error, falling back to SSE...", e);
      startSseFallback();
    }

    // 2. SSE Fallback
    const startSseFallback = () => {
      sseStarted = true;
      console.log("Starting SSE fallback progress handler...");
      let es = null;
      try {
        es = new EventSource(`http://localhost:8000/api/audits/${id}/progress`);
        es.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            const done = onProgressMessage(data);
            if (done) es.close();
          } catch {}
        };
        es.onerror = (err) => {
          console.warn("SSE progress error, falling back to Polling...", err);
          es.close();
          startPollingFallback();
        };
      } catch (err) {
        console.warn("SSE initialization error, falling back to Polling...", err);
        startPollingFallback();
      }
    };

    // 3. Polling Fallback (every 2 seconds)
    const startPollingFallback = () => {
      if (pollingInterval) return;
      console.log("Starting Polling fallback progress handler...");
      pollingInterval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/audit/${id}/status`);
          if (res.ok) {
            const data = await res.json();
            const progressData = {
              status: data.status,
              percent: (data.status === "completed" || data.status === "completed_with_errors") ? 100 : 50,
              message: (data.status === "completed" || data.status === "completed_with_errors") ? "Audit complete" : "Crawling and auditing in progress...",
              active_agent: (data.status === "completed" || data.status === "completed_with_errors") ? "recommendation" : "crawler",
              progress: (data.status === "completed" || data.status === "completed_with_errors") ? 100 : 50
            };
            const done = onProgressMessage(progressData);
            if (done && pollingInterval) {
              clearInterval(pollingInterval);
            }
          }
        } catch (e) {
          console.error("Polling status request failed:", e);
        }
      }, 2000);
    };
  };

  const loadAuditData = async (id) => {
    try {
      // Use Promise.allSettled — a single failure must NEVER prevent the dashboard from rendering
      const [auditResult, journeyResult, issueResult] = await Promise.allSettled([
        client.getAudit(id),
        client.getJourney(id),
        client.getIssues(id),
      ]);

      // Handle audit (critical — needed for score)
      if (auditResult.status === "fulfilled" && auditResult.value) {
        const audit = auditResult.value;
        setSiteScore(audit.site_score ?? null);
        setScoreBreakdown(
          typeof audit.score_breakdown_json === "string"
            ? JSON.parse(audit.score_breakdown_json || "{}")
            : (audit.score_breakdown_json || {})
        );
      } else {
        console.error("Audit fetch failed:", auditResult.reason);
      }

      // Handle journey (non-critical — pages/steps)
      if (journeyResult.status === "fulfilled" && journeyResult.value) {
        const journey = journeyResult.value;
        const pagesList = Array.isArray(journey.pages) ? journey.pages : [];
        const stepsList = Array.isArray(journey.steps) ? journey.steps : [];
        setPages(pagesList);
        setSteps(stepsList);
        if (pagesList.length > 0) setActivePageId(pagesList[0].id || pagesList[0].page_id || null);
      } else {
        console.error("Journey API failed:", journeyResult.reason);
        setPages([]);
        setSteps([]);
      }

      // Handle issues (non-critical)
      if (issueResult.status === "fulfilled" && Array.isArray(issueResult.value)) {
        setIssues(issueResult.value);
      } else {
        console.error("Issues API failed:", issueResult.reason);
        setIssues([]);
      }

      // Always navigate to audit view — even if some requests failed
      setView(VIEW_AUDIT);
    } catch (e) {
      console.error("Failed to load audit data:", e);
      // Still show the audit view even on total failure — let the dashboard degrade gracefully
      setView(VIEW_AUDIT);
    }
  };


  // ── Start URL audit ───────────────────────────────────────────────────────
  const handleStartUrlAudit = async (url, pageLimit) => {
    setLoading(true);
    setAuditUrl(url);
    setInputType("url");
    setStatusLog([]);
    setCurrentProgress(null);
    setSiteScore(null);
    setPages([]); setSteps([]); setIssues([]);
    setSelectedFixes(new Set());
    setActiveTab("overview");
    try {
      const { audit_id } = await client.startAudit(url, pageLimit);
      setAuditId(audit_id);
      setAuditStatus("running");
      startProgressStream(audit_id);
    } catch (e) {
      setLoading(false);
      alert("Failed to start audit: " + e.message);
    }
  };

  // ── Start image audit ─────────────────────────────────────────────────────
  const handleStartImageAudit = async (file) => {
    setLoading(true);
    setAuditUrl(file.name);
    setInputType("image");
    setStatusLog([]);
    setCurrentProgress(null);
    setSiteScore(null);
    setPages([]); setSteps([]); setIssues([]);
    setSelectedFixes(new Set());
    setActiveTab("overview");
    try {
      const { audit_id } = await client.startImageAudit(file);
      setAuditId(audit_id);
      setAuditStatus("running");
      startProgressStream(audit_id);
    } catch (e) {
      setLoading(false);
      alert("Failed to start image audit: " + e.message);
    }
  };

  // ── Open past audit from dashboard ───────────────────────────────────────
  const handleSelectAudit = async (id) => {
    setAuditId(id);
    setAuditStatus("completed");
    setStatusLog([]);
    setCurrentProgress(null);
    setSelectedFixes(new Set());
    setActiveTab("overview");
    try {
      const audit = await client.getAudit(id);
      setAuditUrl(audit.start_url);
      setInputType(audit.input_type || "url");
    } catch {}
    await loadAuditData(id);
  };

  // ── Event handlers ────────────────────────────────────────────────────────
  const handlePageSelect    = (id) => { setActivePageId(id); setActiveStepId(null); setActiveIssueId(null); };
  const handleStepSelect    = (id) => { setActiveStepId(id); setActiveIssueId(null); };
  const handleIssueSelect   = (id) => setActiveIssueId(id);
  const handleToggleFix     = (id) => setSelectedFixes(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", color:"#f4f4f5", background:"#06070a", position:"relative" }}>
      <CosmoCanvas />
      <div className="cosmo-noise" />
      {view !== VIEW_AUDIT && (
        <NavBar
          view={view}
          onGoHome={() => setView(VIEW_LANDING)}
          onGoDashboard={() => setView(VIEW_DASHBOARD)}
          onGoAuditInput={() => setView(VIEW_AUDIT_INPUT)}
          auditUrl={auditUrl}
          inputType={inputType}
        />
      )}

      <AnimatePresence mode="wait">

        {/* ── AUDIT INPUT VIEW ─────────────────────────────────────────────── */}
        {view === VIEW_AUDIT_INPUT && (
          <motion.div
            key="audit_input"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
          >
            <AuditInputPage
              onSubmitUrl={(url, limit) => { handleStartUrlAudit(url, limit); }}
              onSubmitImage={(file) => { handleStartImageAudit(file); }}
              loading={loading}
            />
            {(loading || auditStatus === "running") && currentProgress && (
              <div style={{ maxWidth:720, margin:"0 auto", padding:"0 24px 48px" }}>
                <CrawlProgress statusLog={statusLog} currentProgress={currentProgress} />
              </div>
            )}
          </motion.div>
        )}

        {/* ── LANDING VIEW ─────────────────────────────────────────────────── */}
        {view === VIEW_LANDING && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="min-h-[calc(100vh-60px)]"
          >
            <LandingHero
              onSubmitUrl={(url, limit) => setView(VIEW_AUDIT_INPUT)}
              onSubmitImage={() => setView(VIEW_AUDIT_INPUT)}
              onGoAuditInput={() => setView(VIEW_AUDIT_INPUT)}
              loading={false}
            />

            {/* Show progress if audit is running */}
            {(loading || auditStatus === "running") && currentProgress && (
              <div className="max-w-4xl mx-auto px-4 pb-8">
                <CrawlProgress statusLog={statusLog} currentProgress={currentProgress} />
              </div>
            )}

            {/* Recent audits teaser */}
            {!loading && view === VIEW_LANDING && (
              <div className="max-w-3xl mx-auto px-4 pb-16 mt-2">
                <button
                  onClick={() => setView(VIEW_DASHBOARD)}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 font-semibold transition"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>View Audit History</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── DASHBOARD VIEW ───────────────────────────────────────────────── */}
        {view === VIEW_DASHBOARD && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <Suspense fallback={<Spinner />}>
              <MasterDashboard onSelectAudit={handleSelectAudit} />
            </Suspense>
          </motion.div>
        )}

        {/* ── AUDIT DETAIL VIEW ────────────────────────────────────────────── */}
        {view === VIEW_AUDIT && (
          <motion.div
            key="audit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              minHeight: "100vh",
              background: "transparent",
              color: "#f4f4f5",
              position: "relative"
            }}
          >
            <PremiumResultView
              auditId={auditId}
              siteScore={siteScore}
              scoreBreakdown={scoreBreakdown}
              pages={pages}
              issues={issues}
              steps={steps}
              activePageId={activePageId}
              activeStepId={activeStepId}
              activeIssueId={activeIssueId}
              selectedFixes={selectedFixes}
              onPageSelect={handlePageSelect}
              onStepSelect={handleStepSelect}
              onIssueSelect={handleIssueSelect}
              onToggleFix={handleToggleFix}
              onGoDashboard={() => setView(VIEW_DASHBOARD)}
              onGoHome={() => setView(VIEW_LANDING)}
              onGoAuditInput={() => setView(VIEW_AUDIT_INPUT)}
              loading={loading}
              currentProgress={currentProgress}
              statusLog={statusLog}
              auditUrl={auditUrl}
              inputType={inputType}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
