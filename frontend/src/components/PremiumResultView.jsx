import React, { useState, useRef, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, LayoutDashboard, ArrowLeft, Globe, Image as ImageIcon,
  Sparkles, ChevronRight, Activity, FileText, ShieldAlert,
  TrendingUp, Users, Palette, GitBranch, Wrench, BarChart3,
  CheckCircle, AlertTriangle, Play, HelpCircle, Code, Maximize2,
  ChevronDown, MessageSquare, Download, Compass, RefreshCw, Send, Check, Clock, Award
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, PieChart, Pie, Cell, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend
} from "recharts";
import { client } from "../api/client";
import NavigationGraph from "./NavigationGraph";
import PriorityAgent from "./PriorityAgent";
import ReAuditDiff from "./ReAuditDiff";
import FileDiffPanel from "./FileDiffPanel";

// Donut chart severities colors
const DONUT_COLORS = {
  critical: "#f43f5e",
  serious: "#f97316",
  moderate: "#eab308",
  minor: "#a1a1aa"
};

// Framer motion standard stagger definitions
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

// ── DESIGN SYSTEM: THEME PROVIDER ──────────────────────────────────────────
const ThemeContext = React.createContext({ theme: "dark" });
function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ theme: "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── DESIGN SYSTEM: GLASS CARD COMPONENT ──────────────────────────────────────────
function GlassCard({ children, className = "", style = {}, ...props }) {
  return (
    <motion.div
      variants={cardVariants}
      className={`glass-panel ${className}`}
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        ...style
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ── DESIGN SYSTEM: SECTION HEADER COMPONENT ──────────────────────────────────────
function SectionHeader({ label, title, subtitle, className = "", ...props }) {
  return (
    <div className={`flex flex-col gap-1 mb-2 ${className}`} {...props}>
      {label && (
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "#00f5a0" }}>
          {label}
        </span>
      )}
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.015em", marginTop: 4 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 13, color: "rgba(155, 169, 196, 0.6)", marginTop: 2 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ── DESIGN SYSTEM: EMPTY STATE COMPONENT ──────────────────────────────────────────
function EmptyState({ onGoAuditInput, message }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 gap-5" style={{ minHeight: "40vh" }}>
      <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl" />
        <HelpCircle size={40} style={{ color: "#00f5a0" }} />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        No Data Available
      </h3>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", maxWidth: 360, lineHeight: 1.6 }}>
        {message || "There are no entries or analysis records matching this query in the database."}
      </p>
      {onGoAuditInput && (
        <button onClick={onGoAuditInput} className="cosmo-btn-primary" style={{ padding: "8px 20px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Start Audit
        </button>
      )}
    </div>
  );
}

// ── DESIGN SYSTEM: LOADING STATE COMPONENT ─────────────────────────────────────────
function LoadingState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-4" style={{ minHeight: "30vh" }}>
      <RefreshCw className="animate-spin h-6 w-6 text-emerald-400" style={{ animation: "spin 2.2s linear infinite" }} />
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "rgba(255,255,255,0.5)" }}>
        {message || "Loading panel data..."}
      </p>
    </div>
  );
}

// ── DESIGN SYSTEM: METRIC CARD COMPONENT ───────────────────────────────────────────
function MetricCard({ label, value, description, color = "#00f5a0", icon: Icon }) {
  return (
    <GlassCard style={{ height: "100%", justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(155, 169, 196, 0.6)" }}>{label}</span>
        {Icon && (
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}12`, border: `1px solid ${color}24`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={14} color={color} />
          </div>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>{value}</div>
        {description && <div style={{ fontSize: 10, color: "rgba(155, 169, 196, 0.5)", marginTop: 4 }}>{description}</div>}
      </div>
    </GlassCard>
  );
}

// ── LOCAL CRASH-PROOF ERROR BOUNDARY ──────────────────────────────────────────
class LocalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`LocalErrorBoundary caught error in ${this.props.sectionName || "Component"}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel" style={{
          padding: 32, background: "rgba(244,63,94,0.03)", border: "1px solid rgba(244,63,94,0.2)",
          borderRadius: 28, textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center"
        }}>
          <AlertTriangle size={28} style={{ color: "#f43f5e" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f43f5e", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {this.props.sectionName || "Module"} Panel Crashed
          </div>
          <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.4, maxWidth: 320 }}>
            Details: {this.state.error?.message || "An unexpected calculations error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="cosmo-btn-ghost"
            style={{ padding: "6px 14px", fontSize: 10.5, textTransform: "uppercase" }}
          >
            Retry Render
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── GLOBAL APPLICATION LEVEL ERROR BOUNDARY ────────────────────────────────────
class AppResultErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AppResultErrorBoundary caught crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center",
          flexDirection: "column", background: "#06070a", color: "#fff", padding: 24, textAlign: "center",
          fontFamily: "'Inter', sans-serif"
        }}>
          <div className="glass-panel" style={{
            maxWidth: 540, padding: "40px 32px", border: "1px solid rgba(244,63,94,0.25)",
            borderRadius: 28, boxShadow: "0 0 64px rgba(244,63,94,0.12)", backdropFilter: "blur(24px)"
          }}>
            <span style={{ fontSize: 44, display: "block", marginBottom: 16 }}>⚠️</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f43f5e", marginBottom: 12 }}>
              Unable to load audit dashboard
            </h2>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 24 }}>
              The results console crashed due to a severe runtime error.
            </p>
            <div style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.06)", padding: 14, borderRadius: 12, marginBottom: 24, textAlign: "left", overflowX: "auto" }}>
              <pre style={{ margin: 0, fontSize: 10.5, fontFamily: "monospace", color: "#e2e8f0" }}>
                {this.state.error?.message || "Unknown error"}
              </pre>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onGoAuditInput) this.props.onGoAuditInput();
              }}
              className="cosmo-btn-primary"
            >
              Return to Audit Input
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── CUSTOM LIGHT MARKDOWN PARSER ───────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  let formatted = text;
  formatted = formatted
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  
  // Inline code
  formatted = formatted.replace(/`(.*?)`/g, "<code class='bg-black/50 border border-white/10 px-1 py-0.5 rounded font-mono text-xs text-emerald-400'>$1</code>");
  
  // Bullet points
  formatted = formatted.replace(/^\s*-\s+(.*?)$/gm, "<li class='ml-4 list-disc text-zinc-300'>$1</li>");
  
  // Code blocks
  formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, "<pre class='bg-black/60 border border-white/5 p-3 rounded-lg font-mono text-xs text-emerald-300 my-2 overflow-x-auto'>$2</pre>");
  
  // Newlines
  formatted = formatted.replace(/\n/g, "<br />");
  
  return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
}

// ── MAIN EXPORT COMPONENT ──────────────────────────────────────────────────────
export default function PremiumResultView(props) {
  return (
    <AppResultErrorBoundary onGoAuditInput={props.onGoAuditInput}>
      <PremiumResultViewContent {...props} />
    </AppResultErrorBoundary>
  );
}

// ── MAIN RESULT CONTENT ────────────────────────────────────────────────────────
function PremiumResultViewContent({
  auditId,
  siteScore,
  scoreBreakdown,
  pages,
  issues,
  steps,
  activePageId: propActivePageId,
  activeStepId: propActiveStepId,
  activeIssueId: propActiveIssueId,
  selectedFixes,
  onPageSelect,
  onStepSelect,
  onIssueSelect,
  onToggleFix,
  onGoDashboard,
  onGoHome,
  onGoAuditInput,
  loading,
  auditUrl,
  inputType
}) {
  
  // Defensive collections initialization
  const safePages = Array.isArray(pages) ? pages : [];
  const safeIssues = Array.isArray(issues) ? issues : [];
  const safeSteps = Array.isArray(steps) ? steps : [];
  const safeScoreBreakdown = scoreBreakdown && typeof scoreBreakdown === "object" ? scoreBreakdown : {};

  // Local selection overrides
  const [localActivePageId, setLocalActivePageId] = useState(null);
  const [localActiveStepId, setLocalActiveStepId] = useState(null);
  const [localActiveIssueId, setLocalActiveIssueId] = useState(null);
  const [expandedIssueId, setExpandedIssueId] = useState(null);

  // Sync props selections
  const activePageId = propActivePageId || localActivePageId;
  const activeStepId = propActiveStepId || localActiveStepId;
  const activeIssueId = propActiveIssueId || localActiveIssueId;

  // Extra background datasets loaded asynchronously from API endpoints
  const [businessImpact, setBusinessImpact] = useState(null);
  const [personas, setPersonas] = useState(null);
  const [themeData, setThemeData] = useState(null);
  const [consistencyData, setConsistencyData] = useState(null);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [extraLoading, setExtraLoading] = useState(false);
  const [extraError, setExtraError] = useState(false);

  const [priorities, setPriorities] = useState(null);
  const [beforeAfterList, setBeforeAfterList] = useState([]);
  const [progressHistory, setProgressHistory] = useState(null);
  const [navigationGraphData, setNavigationGraphData] = useState([]);
  const [scoreBreakdownData, setScoreBreakdownData] = useState(null);

  // Ollama Chat console states
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "I've analyzed the UX audit reports. I can guide you through resolving the layout shift, accessibility, and touch target violations. What would you like to fix first?" }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState("Connecting"); // "Connecting", "Connected", "Unavailable", "ModelMissing", "Streaming"

  // Natural screenshot dimensions tracker
  const [imgSize, setImgSize] = useState({ w: 1280, h: 800 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Suggested Prompts list
  const suggestedPrompts = [
    "Explain the touch target accessibility concerns for elderly users.",
    "How do I fix low contrast text issues?",
    "What visual consistency recommendations are suggested?",
    "Which WCAG rules did we violate most?"
  ];

  // Helper function to check connection to local Ollama status
  const checkOllamaConnection = async () => {
    setOllamaStatus("Connecting");
    try {
      const res = await fetch("http://localhost:11434/api/tags", { mode: "cors" });
      if (res.ok) {
        const data = await res.json();
        const models = data.models || [];
        const hasModel = models.some(m => m.name.includes("qwen") || m.name.includes("llama") || m.name.includes("phi"));
        if (hasModel) {
          setOllamaStatus("Connected");
        } else {
          setOllamaStatus("ModelMissing");
        }
      } else {
        setOllamaStatus("Unavailable");
      }
    } catch (e) {
      // Fallback check through backend stream endpoints
      try {
        const pingRes = await fetch(`${client.getConsistencyUrl(auditId) ? client.getConsistencyUrl(auditId).split("/api/")[0] : "http://localhost:8000"}/api/audits/${auditId}/query/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "ping_connection" })
        });
        if (pingRes.ok) {
          const text = await pingRes.text();
          if (text.includes("Assistant Offline")) {
            setOllamaStatus("Unavailable");
          } else {
            setOllamaStatus("Connected");
          }
        } else {
          setOllamaStatus("Unavailable");
        }
      } catch (err) {
        setOllamaStatus("Unavailable");
      }
    }
  };

  // Fetch extra metrics in background when auditId is resolved
  useEffect(() => {
    if (!auditId) return;
    setExtraLoading(true);
    setExtraError(false);

    Promise.allSettled([
      client.getBusinessImpact(auditId),
      client.getPersonas(auditId),
      client.getTheme(auditId),
      client.getConsistencyUrl(auditId) ? fetch(client.getConsistencyUrl(auditId)).then(r => r.json()) : Promise.reject(),
      client.getExecutiveSummary(auditId),
      client.getPriorities(auditId),
      client.getBeforeAfter(auditId),
      client.getProgressHistory(auditId),
      client.getNavigationGraph(auditId),
      client.getScoreBreakdown(auditId)
    ]).then(([impactRes, personasRes, themeRes, consistencyRes, execRes, prioritiesRes, beforeAfterRes, progressHistoryRes, navGraphRes, scoreBreakdownRes]) => {
      if (impactRes.status === "fulfilled" && impactRes.value) {
        setBusinessImpact(
          typeof impactRes.value === "string" ? JSON.parse(impactRes.value) : impactRes.value
        );
      }
      if (personasRes.status === "fulfilled" && personasRes.value) {
        setPersonas(
          typeof personasRes.value === "string" ? JSON.parse(personasRes.value) : personasRes.value
        );
      }
      if (themeRes.status === "fulfilled" && themeRes.value) {
        setThemeData(
          typeof themeRes.value === "string" ? JSON.parse(themeRes.value) : themeRes.value
        );
      }
      if (consistencyRes.status === "fulfilled" && consistencyRes.value) {
        setConsistencyData(consistencyRes.value);
      }
      if (execRes.status === "fulfilled" && execRes.value) {
        setExecutiveSummary(
          typeof execRes.value === "string" ? JSON.parse(execRes.value) : execRes.value
        );
      }
      if (prioritiesRes.status === "fulfilled" && prioritiesRes.value) {
        setPriorities(
          typeof prioritiesRes.value === "string" ? JSON.parse(prioritiesRes.value) : prioritiesRes.value
        );
      }
      if (beforeAfterRes.status === "fulfilled" && beforeAfterRes.value) {
        setBeforeAfterList(
          typeof beforeAfterRes.value === "string" ? JSON.parse(beforeAfterRes.value) : beforeAfterRes.value
        );
      }
      if (progressHistoryRes.status === "fulfilled" && progressHistoryRes.value) {
        setProgressHistory(
          typeof progressHistoryRes.value === "string" ? JSON.parse(progressHistoryRes.value) : progressHistoryRes.value
        );
      }
      if (navGraphRes.status === "fulfilled" && navGraphRes.value) {
        setNavigationGraphData(
          typeof navGraphRes.value === "string" ? JSON.parse(navGraphRes.value) : navGraphRes.value
        );
      }
      if (scoreBreakdownRes.status === "fulfilled" && scoreBreakdownRes.value) {
        setScoreBreakdownData(
          typeof scoreBreakdownRes.value === "string" ? JSON.parse(scoreBreakdownRes.value) : scoreBreakdownRes.value
        );
      }
      setExtraLoading(false);
      checkOllamaConnection();
    }).catch(() => {
      setExtraError(true);
      setExtraLoading(false);
      setOllamaStatus("Unavailable");
    });
  }, [auditId]);

  const getScreenshotSrc = (page) => {
    if (!page) return "";
    if (page.screenshot_path) {
      return client.getStaticUrl(page.screenshot_path);
    }
    if (page.screenshot_b64) {
      if (page.screenshot_b64.startsWith("data:")) {
        return page.screenshot_b64;
      }
      return `data:image/jpeg;base64,${page.screenshot_b64}`;
    }
    if (page.local_path) {
      return client.getStaticUrl(page.local_path);
    }
    return "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80";
  };

  // Loading View
  if (loading) {
    return <SkeletonLoader />;
  }

  // Empty View
  if (!auditId || safePages.length === 0) {
    return <EmptyState onGoAuditInput={onGoAuditInput} />;
  }

  // Auto-focus first elements
  const activePage = safePages.find(p => p.page_id === activePageId || p.id === activePageId) || safePages[0];
  const activePageIssues = safeIssues.filter(i => i.page_id === (activePage?.page_id || activePage?.id));
  const activeIssue = activePageIssues.find(i => i.id === activeIssueId || i.id === expandedIssueId) || activePageIssues[0];

  // Derived values & Grades
  const getEstimatedUXGrade = (score) => {
    if (score == null) return "N/A";
    if (score >= 95) return "A+";
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    return "D";
  };

  const getEstimatedUXGradeColor = (score) => {
    if (score == null) return "rgba(255,255,255,0.4)";
    if (score >= 90) return "#00f5a0";
    if (score >= 75) return "#0175ff";
    if (score >= 60) return "#eab308";
    return "#f43f5e";
  };

  // Safe compliance radar data mapping - FILTER OUT MISSING CATEGORIES
  const radarData = [
    { subject: "Accessibility", A: safeScoreBreakdown.accessibility },
    { subject: "Navigation", A: safeScoreBreakdown.navigation },
    { subject: "Performance", A: safeScoreBreakdown.performance },
    { subject: "Consistency", A: safeScoreBreakdown.consistency },
    { subject: "Visual Hierarchy", A: safeScoreBreakdown.visual_hierarchy ?? safeScoreBreakdown.visual }
  ].filter(item => item.A !== undefined && item.A !== null);

  const severities = ["critical", "serious", "moderate", "minor"];
  const donutData = severities.map(sev => {
    const count = safeIssues.filter(i => i.severity === sev).reduce((acc, curr) => acc + (curr.occurrences || 1), 0);
    return { name: sev.charAt(0).toUpperCase() + sev.slice(1), value: count, color: DONUT_COLORS[sev] };
  }).filter(d => d.value > 0);

  const lineData = safePages.map((p, i) => ({
    name: p.url ? (p.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 12) + "...") : `Page ${p.crawl_order || (i + 1)}`,
    score: p.page_score || siteScore || 90
  })).filter(p => p.score !== undefined && p.score !== null);

  // Selection callbacks
  const handlePageSelect = (pageId) => {
    if (onPageSelect) onPageSelect(pageId);
    setLocalActivePageId(pageId);
    setLocalActiveStepId(null);
    setLocalActiveIssueId(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleStepSelect = (stepId) => {
    if (onStepSelect) onStepSelect(stepId);
    setLocalActiveStepId(stepId);
  };

  const handleIssueSelect = (issueId) => {
    if (onIssueSelect) onIssueSelect(issueId);
    setLocalActiveIssueId(issueId);
    setExpandedIssueId(issueId);
  };

  // Interactive image pan listeners
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // PDF report downloader
  const handleExport = () => {
    window.open(client.getExportUrl(auditId), "_blank");
  };

  // Ollama Chat stream publisher
  const handleSendChat = async (queryText) => {
    if (!queryText.trim() || isSending) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: queryText }]);
    setIsSending(true);
    setOllamaStatus("Streaming");

    // Empty assistant respond bubble
    setChatMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      let gotTokens = false;
      await client.runQueryStream(auditId, queryText, (token) => {
        gotTokens = true;
        setChatMessages(prev => {
          const list = [...prev];
          const last = list[list.length - 1];
          if (last && last.role === "assistant") {
            last.content += token;
          }
          return list;
        });
      });
      
      // Look for offline warnings within streamed message
      setChatMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.content.includes("Conversational Assistant Offline")) {
          setOllamaStatus("Unavailable");
        } else {
          setOllamaStatus("Connected");
        }
        return prev;
      });
    } catch (e) {
      console.error("Chat stream error:", e);
      setOllamaStatus("Unavailable");
      setChatMessages(prev => {
        const list = [...prev];
        const last = list[list.length - 1];
        if (last && last.role === "assistant") last.content = "Connection timed out.";
        return list;
      });
    } finally {
      setIsSending(false);
    }
  };

  const isPartial = 
    (businessImpact && (businessImpact.status === "unavailable" || businessImpact.status === "failed")) ||
    (personas && (personas.status === "unavailable" || personas.status === "failed" || (Array.isArray(personas) && personas.length === 0))) ||
    (themeData && (themeData.status === "unavailable" || themeData.status === "failed")) ||
    (executiveSummary && (executiveSummary.status === "unavailable" || executiveSummary.status === "failed"));

  // ─── Sidebar section definitions ──────────────────────────────────────────
  const NAV_SECTIONS = [
    { id: "overview",    icon: LayoutDashboard, label: "Overview",        color: "#00f5a0" },
    { id: "metrics",     icon: BarChart3,        label: "Score Metrics",   color: "#0175ff" },
    { id: "charts",      icon: Activity,         label: "Analytics",       color: "#a855f7" },
    { id: "violations",  icon: ShieldAlert,      label: "Violations",      color: "#f43f5e" },
    { id: "pages",       icon: Globe,            label: "Pages Map",       color: "#0175ff" },
    { id: "journey",     icon: Compass,          label: "User Journey",    color: "#ffac0a" },
    { id: "visualizer",  icon: Maximize2,        label: "Visualizer",      color: "#00f5a0" },
    { id: "business",    icon: TrendingUp,       label: "Business Impact", color: "#ffac0a" },
    { id: "personas",    icon: Users,            label: "Personas",        color: "#a855f7" },
    { id: "theme",       icon: Palette,          label: "Visual Theme",    color: "#a855f7" },
    { id: "ai",          icon: MessageSquare,    label: "AI Assistant",    color: "#00f5a0" },
    { id: "navgraph",    icon: GitBranch,        label: "Nav Graph",       color: "#0175ff" },
    { id: "priorities",  icon: CheckCircle,      label: "Priorities",      color: "#00f5a0" },
    { id: "beforeafter", icon: Code,             label: "Before / After",  color: "#ffac0a" },
    { id: "progress",    icon: Clock,            label: "Progress",        color: "#a855f7" },
    { id: "devtools",    icon: Wrench,           label: "Dev Tools",       color: "#f43f5e" },
  ];

  const [activeSec, setActiveSec] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const scrollToSection = (id) => {
    setActiveSec(id);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const observers = [];
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(`section-${id}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSec(id); },
        { threshold: 0.2 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [auditId]);

  // ─── Sidebar component ────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside style={{
      position: "sticky", top: 0, height: "100vh",
      width: sidebarCollapsed ? 60 : 216, flexShrink: 0,
      display: "flex", flexDirection: "column",
      background: "rgba(6,7,10,0.92)", backdropFilter: "blur(20px)",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      transition: "width 0.28s cubic-bezier(.4,0,.2,1)",
      overflow: "hidden", zIndex: 40,
    }}>
      {/* Sidebar header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: sidebarCollapsed ? "18px 14px" : "18px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", minHeight: 60, gap: 8 }}>
        {!sidebarCollapsed && (
          <span style={{ fontSize: 10, fontWeight: 800, color: "#00f5a0", textTransform: "uppercase", letterSpacing: "0.14em", whiteSpace: "nowrap" }}>Navigate</span>
        )}
        <button onClick={() => setSidebarCollapsed(c => !c)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ChevronRight size={13} color="#a1a1aa" style={{ transform: sidebarCollapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.28s" }} />
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 0" }}>
        {NAV_SECTIONS.map(({ id, icon: Icon, label, color }) => {
          const isActive = activeSec === id;
          return (
            <button key={id} onClick={() => scrollToSection(id)} title={sidebarCollapsed ? label : undefined} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: sidebarCollapsed ? "9px 16px" : "9px 18px", background: isActive ? `${color}12` : "transparent", borderLeft: `2px solid ${isActive ? color : "transparent"}`, border: "none", borderLeftWidth: 2, borderLeftStyle: "solid", borderLeftColor: isActive ? color : "transparent", cursor: "pointer", transition: "all 0.18s", color: isActive ? color : "rgba(155,169,196,0.6)" }}>
              <Icon size={14} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span style={{ fontSize: 11.5, fontWeight: isActive ? 700 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Export button */}
      {!sidebarCollapsed && (
        <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button onClick={handleExport} style={{ width: "100%", padding: "8px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(0,245,160,0.08)", border: "1px solid rgba(0,245,160,0.2)", borderRadius: 10, color: "#00f5a0", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer" }}>
            <Download size={12} />Export
          </button>
        </div>
      )}
    </aside>
  );

  // ─── Section anchor heading ───────────────────────────────────────────────
  const SectionAnchor = ({ id, icon: Icon, title, subtitle, color = "#00f5a0" }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 24, scrollMarginTop: 20 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}14`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: "rgba(155,169,196,0.55)", margin: "3px 0 0" }}>{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <ThemeProvider>
      <div className="cosmic-background font-sans" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <div className="noise-overlay" />

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <header style={{ flexShrink: 0, position: "relative", zIndex: 50, background: "rgba(6,7,10,0.85)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div onClick={onGoHome} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#fff" }}>ManualMate</span>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", background: "rgba(0,245,160,0.12)", color: "#00f5a0", borderRadius: 4, textTransform: "uppercase" }}>AI</span>
            </div>
            <div style={{ height: 14, width: 1, background: "rgba(255,255,255,0.12)" }} />
            {isPartial ? (
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 10px", background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.18)", borderRadius: 8, color: "#eab308", fontSize: 10.5, fontWeight: 650 }}>
                <AlertTriangle size={11} /><span>Partial Analysis</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 10px", background: "rgba(0,245,160,0.05)", border: "1px solid rgba(0,245,160,0.18)", borderRadius: 8, color: "#00f5a0", fontSize: 10.5, fontWeight: 650 }}>
                <CheckCircle size={11} /><span>All 7 Agents Active</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={onGoDashboard} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "#e2e8f0", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
              <LayoutDashboard size={12} /><span>History</span>
            </button>
            <button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "#e2e8f0", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
              <Download size={12} /><span>Export</span>
            </button>
            <button onClick={onGoAuditInput} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "rgba(0,245,160,0.12)", border: "1px solid rgba(0,245,160,0.28)", borderRadius: 9, color: "#00f5a0", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
              <Sparkles size={12} /><span>New Audit</span>
            </button>
          </div>
        </header>

        {/* ── TWO-PANEL BODY ─────────────────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative", zIndex: 10 }}>

          {/* LEFT SIDEBAR */}
          <Sidebar />

          {/* RIGHT SCROLL AREA */}
          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "32px 36px 64px" }}>
            <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: "flex", flexDirection: "column", gap: 52, maxWidth: 1200, margin: "0 auto" }}>

              {/* ════ OVERVIEW ══════════════════════════════════════════════ */}
              <section id="section-overview" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="overview" icon={LayoutDashboard} title="Audit Overview" subtitle="Score summary and key metrics at a glance" color="#00f5a0" />
                <GlassCard style={{ padding: 36, display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 48, alignItems: "center" }}>
                  {/* Radial Score */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ position: "relative", width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                        <circle cx="90" cy="90" r="76" stroke="rgba(255,255,255,0.04)" strokeWidth="9" fill="transparent" />
                        <motion.circle cx="90" cy="90" r="76" stroke="#00f5a0" strokeWidth="9" fill="transparent"
                          strokeDasharray={2 * Math.PI * 76}
                          initial={{ strokeDashoffset: 2 * Math.PI * 76 }}
                          animate={{ strokeDashoffset: (2 * Math.PI * 76) - ((siteScore || 0) / 100) * (2 * Math.PI * 76) }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div style={{ position: "absolute", textAlign: "center" }}>
                        <div style={{ fontSize: 52, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>{siteScore || 0}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(155,169,196,0.6)", textTransform: "uppercase", letterSpacing: "0.12em" }}>UX Health</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, padding: "5px 14px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.22)", borderRadius: 999, fontSize: 11, fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {(siteScore || 0) >= 90 ? "Excellent" : (siteScore || 0) >= 70 ? "Minor Deductions" : "Critical Fixes Required"}
                    </div>
                  </div>
                  {/* Summary */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                      <span className="cosmo-pill" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "rgba(0,245,160,0.8)" }}>Analysis Summary</span>
                      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", marginTop: 8 }}>
                        {inputType === "image" ? "Vision-Audited Design Layout" : (auditUrl || "").replace(/^https?:\/\/(www\.)?/, "")}
                      </h1>
                      {executiveSummary?.headline && (
                        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, marginTop: 10, background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                          {executiveSummary.headline}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Pages",          value: safePages.length,                                                          color: "#fff"    },
                        { label: "Issues",          value: safeIssues.length,                                                         color: "#f43f5e" },
                        { label: "Occurrences",     value: safeIssues.reduce((a, c) => a + (c.occurrences || 1), 0),                  color: "#ffac0a" },
                        { label: "Grade",           value: getEstimatedUXGrade(siteScore),                                            color: "#a855f7" },
                        { label: "Impact Risk",     value: businessImpact?.overall_risk || "Low",                                     color: "#0175ff" },
                        { label: "Est. Lift",       value: `+${businessImpact?.estimated_improvement || 0}`,                          color: "#00f5a0" },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ padding: 12, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "rgba(155,169,196,0.5)" }}>{label}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color, marginTop: 3 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </section>

              {/* ════ SCORE METRICS ═════════════════════════════════════════ */}
              <section id="section-metrics" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="metrics" icon={BarChart3} title="Score Metrics" subtitle="Breakdown across all compliance dimensions" color="#0175ff" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <MetricCard label="Overall Score"     value={siteScore != null ? `${siteScore}%` : "N/A"}                                            icon={CheckCircle} color="#00f5a0" description="Aesthetic Heuristics" />
                  <MetricCard label="Accessibility"     value={safeScoreBreakdown.accessibility != null ? `${safeScoreBreakdown.accessibility}%` : "N/A"} icon={Shield}      color="#0175ff" description="WCAG 2.2 AA" />
                  <MetricCard label="Consistency"       value={safeScoreBreakdown.consistency   != null ? `${safeScoreBreakdown.consistency}%`   : "N/A"} icon={Palette}     color="#a855f7" description="Style uniformity" />
                  <MetricCard label="Performance"       value={safeScoreBreakdown.performance   != null ? `${safeScoreBreakdown.performance}%`   : "N/A"} icon={Activity}    color="#ffac0a" description="Load & transition" />
                  <MetricCard label="Violations"        value={safeIssues.length}                                                                         icon={ShieldAlert}  color="#f43f5e" description="Failing codes" />
                </div>
              </section>

              {/* ════ ANALYTICS CHARTS ══════════════════════════════════════ */}
              <section id="section-charts" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="charts" icon={Activity} title="Analytics" subtitle="Compliance radar, severity distribution, and score trend" color="#a855f7" />
                <LocalErrorBoundary sectionName="Charts">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <GlassCard style={{ minHeight: 360 }}>
                      <SectionHeader label="Visual Analytics" title="Compliance Radar" />
                      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {radarData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                              <PolarGrid stroke="rgba(255,255,255,0.05)" />
                              <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={10} fontWeight="bold" />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.05)" fontSize={8} />
                              <Radar name="Compliance" dataKey="A" stroke="#00f5a0" fill="#00f5a0" fillOpacity={0.10} />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : <EmptyState message="Radar data unavailable." />}
                      </div>
                    </GlassCard>
                    <GlassCard style={{ minHeight: 360 }}>
                      <SectionHeader label="Violations Severity" title="Severity Distribution" />
                      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {donutData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={donutData} cx="50%" cy="50%" innerRadius={58} outerRadius={78} paddingAngle={4} dataKey="value">
                                {donutData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: "#06070a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} />
                              <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#a1a1aa" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : <EmptyState message="No issues — 100% compliant." />}
                      </div>
                    </GlassCard>
                    <GlassCard style={{ minHeight: 360 }}>
                      <SectionHeader label="Timeline" title="Score Trend" />
                      <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {lineData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                              <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                              <YAxis stroke="#71717a" domain={[0, 100]} fontSize={10} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: "#06070a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} />
                              <Line type="monotone" dataKey="score" stroke="#0175ff" strokeWidth={3} dot={{ fill: "#00f5a0", r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : <EmptyState message="Score trends unavailable for single uploads." />}
                      </div>
                    </GlassCard>
                  </div>
                </LocalErrorBoundary>
              </section>

              {/* ════ TOP VIOLATIONS ════════════════════════════════════════ */}
              <section id="section-violations" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="violations" icon={ShieldAlert} title="Top Violations" subtitle="Critical and serious issues that need immediate attention" color="#f43f5e" />
                <GlassCard style={{ padding: 28 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, alignItems: "center" }}>
                    <SectionHeader label="Priority Fixes" title="Critical & Serious Issues" />
                    <span className="cosmo-pill" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                      {safeIssues.filter(i => i.severity === "critical" || i.severity === "serious").length} High Severity
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {safeIssues.filter(i => ["critical","serious","moderate"].includes(i.severity)).slice(0, 5).map((issue, idx) => (
                      <div key={issue.id || idx} style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ padding: "3px 8px", borderRadius: 99, fontSize: 9, fontWeight: 800, textTransform: "uppercase", background: `rgba(${issue.severity === "critical" ? "244,63,94" : "249,115,22"}, 0.12)`, color: issue.severity === "critical" ? "#f43f5e" : "#f97316" }}>{issue.severity}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{issue.description}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, color: "rgba(155,169,196,0.4)", fontFamily: "monospace" }}>-{issue.score_impact || 3}pts</span>
                          <button onClick={() => { handleIssueSelect(issue.id); scrollToSection("visualizer"); }} style={{ padding: "5px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Inspect</button>
                        </div>
                      </div>
                    ))}
                    {safeIssues.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No violations detected.</div>}
                  </div>
                </GlassCard>
              </section>

              {/* ════ PAGES MAP ═════════════════════════════════════════════ */}
              <section id="section-pages" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="pages" icon={Globe} title="Pages Map" subtitle="All discovered pages — click a card to inspect page-level issues" color="#0175ff" />
                <LocalErrorBoundary sectionName="Pages">
                  <GlassCard style={{ padding: 24 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                      {safePages.map((p, idx) => {
                        const isActive = p.page_id === activePageId || p.id === activePageId;
                        return (
                          <div key={p.page_id || idx} onClick={() => handlePageSelect(p.page_id || p.id)} style={{ padding: 18, background: isActive ? "rgba(0,245,160,0.04)" : "rgba(255,255,255,0.01)", border: `1px solid ${isActive ? "rgba(0,245,160,0.28)" : "rgba(255,255,255,0.06)"}`, borderRadius: 16, cursor: "pointer", transition: "all 0.22s", display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "rgba(155,169,196,0.4)" }}>Page #{p.crawl_order || idx + 1}</span>
                              <span style={{ fontSize: 12, fontWeight: 800, color: getEstimatedUXGradeColor(p.page_score) }}>Score: {p.page_score || 100}</span>
                            </div>
                            <h4 style={{ fontSize: 13, fontWeight: 700, color: "#fff", wordBreak: "break-all", margin: 0 }}>{p.url ? p.url.replace(/^https?:\/\/(www\.)?/, "") : "Uploaded Design"}</h4>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(155,169,196,0.5)" }}>
                              <span>{p.issue_count || 0} violations</span><span>{p.total_occurrences || 0} occurrences</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>
                </LocalErrorBoundary>
              </section>

              {/* ════ USER JOURNEY ══════════════════════════════════════════ */}
              {safeSteps.length > 0 && (
                <section id="section-journey" style={{ scrollMarginTop: 20 }}>
                  <SectionAnchor id="journey" icon={Compass} title="User Journey" subtitle="Timeline steps and flow compliance scores" color="#ffac0a" />
                  <GlassCard style={{ padding: 24 }}>
                    <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
                      {safeSteps.map((step, idx) => {
                        const isActive = step.step_id === activeStepId;
                        return (
                          <div key={step.step_id || idx} onClick={() => handleStepSelect(step.step_id)} style={{ minWidth: 190, padding: 16, background: isActive ? "rgba(0,245,160,0.04)" : "rgba(255,255,255,0.01)", border: `1px solid ${isActive ? "rgba(0,245,160,0.24)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(155,169,196,0.4)" }}>STEP {step.step_number}</span>
                              <span style={{ fontSize: 10, fontWeight: 800, color: "#00f5a0" }}>{step.score}%</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{step.step_label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </GlassCard>
                </section>
              )}

              {/* ════ VISUALIZER ════════════════════════════════════════════ */}
              <section id="section-visualizer" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="visualizer" icon={Maximize2} title="Issue Visualizer" subtitle="Drag & zoom the screenshot — bounding boxes highlight violations" color="#00f5a0" />
                <LocalErrorBoundary sectionName="Visualizer">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <GlassCard className="lg:col-span-2" style={{ height: 540, display: "flex", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "center" }}>
                        <SectionHeader label="Node Mapping" title="Bounding Box Overlay" />
                        <div style={{ display: "flex", gap: 6 }}>
                          {[["−", () => setZoom(z => Math.max(0.5, z - 0.2))], ["Reset", () => { setZoom(1); setPan({ x: 0, y: 0 }); }], ["+", () => setZoom(z => Math.min(3, z + 0.2))]].map(([label, fn]) => (
                            <button key={label} onClick={fn} style={{ height: 26, padding: "0 10px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>{label}</button>
                          ))}
                        </div>
                      </div>
                      <div onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} style={{ flex: 1, position: "relative", overflow: "hidden", background: "#0b0c10", borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", cursor: isDragging ? "grabbing" : "grab" }}>
                        <div style={{ position: "absolute", width: "100%", height: "100%", transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: "top left", transition: isDragging ? "none" : "transform 0.15s" }}>
                          <img src={getScreenshotSrc(activePage)} onLoad={e => setImgSize({ w: e.target.naturalWidth || 1280, h: e.target.naturalHeight || 800 })} style={{ display: "block", maxWidth: "none", height: "auto", userSelect: "none" }} alt="" />
                          {activePageIssues.filter(i => i.boundingBox).map((issue, idx) => {
                            const box = issue.boundingBox;
                            const isSel = issue.id === activeIssue?.id;
                            return (
                              <div key={issue.id || idx} onClick={e => { e.stopPropagation(); handleIssueSelect(issue.id); }} style={{ position: "absolute", left: `${(box.x / imgSize.w) * 100}%`, top: `${(box.y / imgSize.h) * 100}%`, width: `${(box.width / imgSize.w) * 100}%`, height: `${(box.height / imgSize.h) * 100}%`, border: isSel ? "2px solid #00f5a0" : `1px dashed ${DONUT_COLORS[issue.severity] || "#ffac0a"}`, background: isSel ? "rgba(0,245,160,0.08)" : "transparent", cursor: "pointer", transition: "all 0.2s", zIndex: isSel ? 30 : 10, boxShadow: isSel ? "0 0 16px rgba(0,245,160,0.4)" : "none" }} title={`${issue.rule_id}: ${issue.description}`} />
                            );
                          })}
                        </div>
                      </div>
                    </GlassCard>
                    <GlassCard className="lg:col-span-1" style={{ height: 540, display: "flex", flexDirection: "column" }}>
                      <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "#e2e8f0", marginBottom: 16 }}>Node Metrics</h3>
                      {activeIssue ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, overflowY: "auto" }}>
                          <div>
                            <span style={{ padding: "3px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: `rgba(${activeIssue.severity === "critical" ? "244,63,94" : "249,115,22"}, 0.12)`, color: activeIssue.severity === "critical" ? "#f43f5e" : "#f97316" }}>{activeIssue.severity}</span>
                            <h4 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 8 }}>{activeIssue.rule_id || "UX Rule violation"}</h4>
                          </div>
                          <p style={{ fontSize: 12.5, color: "rgba(155,169,196,0.85)", lineHeight: 1.6 }}>{activeIssue.description}</p>
                          {activeIssue.wcag_reference && <span style={{ display: "inline-flex", padding: "5px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11, color: "#e2e8f0", width: "fit-content" }}>{activeIssue.wcag_reference}</span>}
                          {(activeIssue.recommendation || activeIssue.fix?.explanation_text) && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14, background: "rgba(0,245,160,0.04)", border: "1px solid rgba(0,245,160,0.14)", borderRadius: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "#00f5a0", textTransform: "uppercase" }}><Sparkles size={11} />AI Recommendation</div>
                              <p style={{ fontSize: 12, color: "rgba(155,169,196,0.9)", lineHeight: 1.6 }}>{activeIssue.recommendation || activeIssue.fix?.explanation_text}</p>
                              {activeIssue.fix?.css_rule_text && <pre style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.06)", padding: 10, borderRadius: 8, fontSize: 10, fontFamily: "monospace", overflowX: "auto", color: "#34d399", margin: 0 }}>{activeIssue.fix.css_rule_text}</pre>}
                              <button onClick={e => { e.stopPropagation(); onToggleFix && onToggleFix(activeIssue.id); }} style={{ width: "100%", padding: "8px 0", cursor: "pointer", background: selectedFixes.has(activeIssue.id) ? "rgba(52,211,153,0.12)" : "linear-gradient(135deg,#0175ff,#00f5a0)", border: selectedFixes.has(activeIssue.id) ? "1px solid rgba(52,211,153,0.22)" : "none", borderRadius: 8, color: selectedFixes.has(activeIssue.id) ? "#34d399" : "#06070a", fontSize: 11, fontWeight: 800, textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                {selectedFixes.has(activeIssue.id) ? <><Check size={12} />Fix Selected</> : "Apply Fix Simulator"}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", color: "rgba(155,169,196,0.4)", fontSize: 12, textAlign: "center" }}>Select a violation in the visualizer to inspect it.</div>
                      )}
                    </GlassCard>
                  </div>
                </LocalErrorBoundary>
              </section>

              {/* ════ BUSINESS IMPACT ═══════════════════════════════════════ */}
              <section id="section-business" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="business" icon={TrendingUp} title="Business Impact" subtitle="Trace visual failures to revenue conversion impact models" color="#ffac0a" />
                <GlassCard style={{ padding: 28 }}>
                  {businessImpact && businessImpact.status !== "unavailable" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: "Dropoff Risk",    value: `${businessImpact.overall_risk} Risk`,         color: businessImpact.risk_color === "rose" ? "#f43f5e" : "#34d399" },
                          { label: "Score Lift",       value: `+${businessImpact.estimated_improvement}pts`, color: "#00f5a0" },
                          { label: "Tracked Issues",   value: `${businessImpact.total_issues} Failures`,    color: "#0175ff" },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ padding: 18, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14 }}>
                            <div style={{ fontSize: 10, color: "rgba(155,169,196,0.5)", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 5 }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {Array.isArray(businessImpact.by_category) && businessImpact.by_category.map((cat, idx) => (
                          <div key={idx} style={{ padding: 20, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                            <div><span style={{ fontSize: 9, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase" }}>Issue Detected</span><h4 style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", marginTop: 3 }}>{cat.metric} ({cat.category})</h4><p style={{ fontSize: 12.5, color: "rgba(155,169,196,0.75)", marginTop: 3, lineHeight: 1.5 }}>{cat.description}</p></div>
                            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                            <div><span style={{ fontSize: 9, fontWeight: 800, color: "#f97316", textTransform: "uppercase" }}>Conversion Impact</span><div style={{ fontSize: 14, fontWeight: 900, color: "#f97316", marginTop: 3 }}>{cat.loss_range} Dropoff <span style={{ fontSize: 11, color: "rgba(155,169,196,0.5)", fontWeight: 400 }}>on {cat.loss_metric}</span></div></div>
                            <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
                            <div><span style={{ fontSize: 9, fontWeight: 800, color: "#00f5a0", textTransform: "uppercase" }}>Expected Improvement</span><p style={{ fontSize: 13, color: "#00f5a0", fontWeight: 700, marginTop: 3 }}>{cat.fix_benefit}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : <EmptyState message="No business impact data available." />}
                </GlassCard>
              </section>

              {/* ════ PERSONAS ══════════════════════════════════════════════ */}
              <section id="section-personas" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="personas" icon={Users} title="User Personas" subtitle="Accessibility friction across diverse user profiles" color="#a855f7" />
                <LocalErrorBoundary sectionName="Personas">
                  <GlassCard style={{ padding: 24 }}>
                    {Array.isArray(personas) && personas.length > 0 && !personas[0]?.reason ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {personas.map((pers, idx) => (
                          <div key={pers.id || idx} style={{ padding: 20, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 22 }}>{pers.emoji}</span><h4 style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>{pers.label}</h4></div>
                              <span style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 900, background: `rgba(${pers.grade_color === "rose" ? "244,63,94" : pers.grade_color === "yellow" ? "234,179,8" : "52,211,153"}, 0.12)`, color: pers.grade_color === "rose" ? "#f43f5e" : pers.grade_color === "yellow" ? "#eab308" : "#34d399" }}>{pers.grade}: {pers.score}%</span>
                            </div>
                            <p style={{ fontSize: 12, color: "rgba(155,169,196,0.65)", lineHeight: 1.5, margin: 0 }}>{pers.description}</p>
                            {Array.isArray(pers.top_issues) && pers.top_issues.length > 0 && (
                              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                                {pers.top_issues.map((iss, iidx) => (
                                  <div key={iidx} style={{ display: "flex", gap: 7 }}><span style={{ color: iss.severity === "critical" ? "#f43f5e" : "#f97316", fontSize: 11, marginTop: 2 }}>•</span><p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.4 }}>{iss.description}</p></div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : <EmptyState message="Persona analysis needs more interaction data." />}
                  </GlassCard>
                </LocalErrorBoundary>
              </section>

              {/* ════ VISUAL THEME ══════════════════════════════════════════ */}
              <section id="section-theme" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="theme" icon={Palette} title="Visual Theme" subtitle="Recommended branding palette, typography, and compliance status" color="#a855f7" />
                <GlassCard style={{ padding: 28 }}>
                  {themeData && themeData.status !== "unavailable" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 24 }}>{themeData.emoji}</span><div><h4 style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>{themeData.label} Style Profile</h4><span style={{ fontSize: 10, color: "rgba(155,169,196,0.45)", fontWeight: 700, textTransform: "uppercase" }}>{themeData.industry}</span></div></div>
                        <p style={{ fontSize: 13, color: "rgba(155,169,196,0.75)", lineHeight: 1.6 }}>{themeData.description}</p>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(0,245,160,0.04)", border: "1px solid rgba(0,245,160,0.12)", padding: "8px 12px", borderRadius: 10, width: "fit-content" }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00f5a0" }} /><span style={{ fontSize: 11, fontWeight: 700, color: "#00f5a0" }}>{themeData.wcag_aa_compliant ? "WCAG 2.2 AA Verified" : "Minor adjustments required"}</span></div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div>
                          <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "rgba(155,169,196,0.45)" }}>Swatches — {themeData.palette_name}</span>
                          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                            {Array.isArray(themeData.swatches) && themeData.swatches.map((hex, idx) => (
                              <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}><div style={{ width: 38, height: 38, borderRadius: 9, background: hex, border: "1px solid rgba(255,255,255,0.08)" }} /><span style={{ fontSize: 9, color: "rgba(155,169,196,0.5)", fontFamily: "monospace" }}>{hex}</span></div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "rgba(155,169,196,0.45)" }}>Typography</span>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                            {Array.isArray(themeData.fonts) && themeData.fonts.map((f, idx) => <span key={idx} style={{ padding: "4px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, fontSize: 11, color: "#fff" }}>{f}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : <EmptyState message="No theme analysis signals available." />}
                </GlassCard>
              </section>

              {/* ════ AI ASSISTANT ══════════════════════════════════════════ */}
              <section id="section-ai" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="ai" icon={MessageSquare} title="AI Assistant" subtitle="Ask Ollie about any UX finding, WCAG violation, or persona concern" color="#00f5a0" />
                <LocalErrorBoundary sectionName="AI Assistant">
                  <GlassCard style={{ padding: 28 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Autonomous UX Consultation</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: ollamaStatus === "Connected" ? "#00f5a0" : ollamaStatus === "Streaming" || ollamaStatus === "Connecting" ? "#ffac0a" : "#f43f5e", boxShadow: ollamaStatus === "Connected" ? "0 0 8px #00f5a0" : "none" }} />
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: ollamaStatus === "Connected" ? "#00f5a0" : ollamaStatus === "Streaming" || ollamaStatus === "Connecting" ? "#ffac0a" : "#f43f5e" }}>{ollamaStatus === "Connected" ? "Connected" : ollamaStatus === "Connecting" ? "Connecting…" : ollamaStatus === "Streaming" ? "Streaming" : ollamaStatus === "ModelMissing" ? "Model Missing" : "Offline"}</span>
                      </div>
                    </div>

                    {ollamaStatus === "Unavailable" || ollamaStatus === "ModelMissing" ? (
                      <div style={{ padding: "28px 24px", background: "rgba(244,63,94,0.02)", border: "1px solid rgba(244,63,94,0.18)", borderRadius: 14, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <AlertTriangle size={26} style={{ color: "#f43f5e" }} />
                        <h4 style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>{ollamaStatus === "ModelMissing" ? "Required model not found." : "Local AI offline."}</h4>
                        <pre style={{ background: "#000", border: "1px solid rgba(255,255,255,0.06)", padding: "8px 18px", borderRadius: 8, fontSize: 12, fontFamily: "monospace", color: "#f43f5e", margin: 0 }}>{ollamaStatus === "ModelMissing" ? "ollama pull qwen2.5:3b" : "ollama serve"}</pre>
                        <button onClick={checkOllamaConnection} className="cosmo-btn-primary" style={{ marginTop: 4 }}><RefreshCw size={12} /> Retry</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 18, maxHeight: 260, overflowY: "auto" }}>
                          {chatMessages.map((msg, idx) => (
                            <div key={idx} style={{ display: "flex", gap: 8, alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
                              <div style={{ background: msg.role === "user" ? "linear-gradient(135deg,#0175ff,#00f5a0)" : "rgba(255,255,255,0.03)", border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.06)", borderRadius: msg.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px", padding: "10px 15px", color: msg.role === "user" ? "#06070a" : "#e2e8f0", fontSize: 13, lineHeight: 1.5, wordBreak: "break-word" }}>
                                {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                              </div>
                            </div>
                          ))}
                          {isSending && chatMessages[chatMessages.length - 1]?.content === "" && (
                            <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "10px 15px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px 14px 14px 2px" }}>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Ollie is typing</span>
                              <div style={{ display: "flex", gap: 3 }}>
                                {[0, 0.2, 0.4].map(d => <span key={d} className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", margin: "12px 0 14px" }}>
                          {suggestedPrompts.map((p, idx) => (
                            <button key={idx} onClick={() => handleSendChat(p)} disabled={isSending} style={{ padding: "5px 11px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>{p}</button>
                          ))}
                        </div>
                        <form onSubmit={e => { e.preventDefault(); handleSendChat(chatInput); }} style={{ display: "flex", gap: 10 }}>
                          <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask about violations, personas, or WCAG fixes…" disabled={isSending} style={{ flex: 1, padding: "11px 16px", background: "rgba(0,0,0,0.20)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 11, color: "#fff", fontSize: 13, outline: "none" }} />
                          <button type="submit" disabled={isSending || !chatInput.trim()} style={{ padding: "0 20px", background: isSending || !chatInput.trim() ? "rgba(0,245,160,0.2)" : "linear-gradient(135deg,#00f5a0,#14b8a6)", border: "none", borderRadius: 11, color: isSending || !chatInput.trim() ? "rgba(255,255,255,0.3)" : "#022c22", fontWeight: 800, fontSize: 11, textTransform: "uppercase", cursor: isSending || !chatInput.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                            <Send size={12} /><span>Send</span>
                          </button>
                        </form>
                      </>
                    )}
                  </GlassCard>
                </LocalErrorBoundary>
              </section>

              {/* ════ NAV GRAPH ═════════════════════════════════════════════ */}
              <section id="section-navgraph" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="navgraph" icon={GitBranch} title="Navigation Graph" subtitle="Interactive journey node relationships and internal link topology" color="#0175ff" />
                <LocalErrorBoundary sectionName="Navigation Graph">
                  <GlassCard style={{ padding: 28 }}>
                    {navigationGraphData && navigationGraphData.length > 0 ? (
                      <NavigationGraph pages={navigationGraphData} activePageId={activePageId} onPageSelect={handlePageSelect} />
                    ) : <EmptyState message="No navigation graph data available." />}
                  </GlassCard>
                </LocalErrorBoundary>
              </section>

              {/* ════ PRIORITIES ════════════════════════════════════════════ */}
              <section id="section-priorities" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="priorities" icon={CheckCircle} title="Priority Agent" subtitle="AI-ranked fix sequence to maximise UX improvement per effort" color="#00f5a0" />
                <LocalErrorBoundary sectionName="Priority Agent">
                  <GlassCard style={{ padding: 28 }}>
                    <PriorityAgent auditId={auditId} selectedFixes={selectedFixes} onToggleFix={onToggleFix} />
                  </GlassCard>
                </LocalErrorBoundary>
              </section>

              {/* ════ BEFORE / AFTER ════════════════════════════════════════ */}
              <section id="section-beforeafter" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="beforeafter" icon={Code} title="Before / After" subtitle="AI-generated improvement diff — baseline vs proposed correction" color="#ffac0a" />
                <LocalErrorBoundary sectionName="Before vs After">
                  <GlassCard style={{ padding: 28 }}>
                    {beforeAfterList && beforeAfterList.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                        {beforeAfterList.map((item, idx) => (
                          <div key={item.id || idx} style={{ padding: 18, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14 }}>
                            <h4 style={{ fontSize: 12, fontWeight: 800, color: "#00f5a0", marginBottom: 12 }}>{item.page_path}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {[["Baseline", "#f43f5e", item.before], ["Proposed", "#34d399", item.after]].map(([label, color, data]) => (
                                <div key={label} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                  <span style={{ fontSize: 9, fontWeight: 800, color, textTransform: "uppercase" }}>{label}</span>
                                  <div style={{ padding: 12, background: `rgba(${color === "#f43f5e" ? "244,63,94" : "52,211,153"},0.03)`, border: `1px solid rgba(${color === "#f43f5e" ? "244,63,94" : "52,211,153"},0.12)`, borderRadius: 10 }}>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 6, fontStyle: "italic" }}>{data?.visual || "—"}</div>
                                    <pre style={{ margin: 0, fontSize: 10, fontFamily: "monospace", color: color === "#f43f5e" ? "rgba(255,255,255,0.5)" : "#34d399", overflowX: "auto" }}>{data?.html || "<!-- No code -->"}</pre>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <EmptyState message="No style override diffs available." />}
                  </GlassCard>
                </LocalErrorBoundary>
              </section>

              {/* ════ PROGRESS HISTORY ══════════════════════════════════════ */}
              <section id="section-progress" style={{ scrollMarginTop: 20 }}>
                <SectionAnchor id="progress" icon={Clock} title="Progress History" subtitle="Audit improvement timeline and score tracking over time" color="#a855f7" />
                <LocalErrorBoundary sectionName="Progress History">
                  <GlassCard style={{ padding: 28 }}>
                    {progressHistory ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(155,169,196,0.6)", textTransform: "uppercase" }}>Score Progression</span>
                          <div style={{ height: 190 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={progressHistory.history || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="timestamp" stroke="#71717a" fontSize={9} tickLine={false} />
                                <YAxis domain={[0, 100]} stroke="#71717a" fontSize={9} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: "#06070a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }} />
                                <Line type="monotone" dataKey="uxScore"   name="UX"   stroke="#00f5a0" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="a11yScore" name="A11y" stroke="#0175ff" strokeWidth={2} dot={{ r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <div style={{ padding: 14, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12 }}>
                            <div style={{ fontSize: 10, color: "rgba(155,169,196,0.5)", textTransform: "uppercase", fontWeight: 700 }}>Remaining Issues</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "#f43f5e", marginTop: 4 }}>{progressHistory.remaining_issues || 0} unresolved</div>
                          </div>
                          {Array.isArray(progressHistory.next_recommendations) && progressHistory.next_recommendations.map((rec, rIdx) => (
                            <div key={rIdx} style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7" }} />
                              <span style={{ fontSize: 12, color: "#e2e8f0" }}>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : <EmptyState message="No timeline progress history available." />}
                  </GlassCard>
                </LocalErrorBoundary>
              </section>

              {/* ════ DEV TOOLS ═════════════════════════════════════════════ */}
              <section id="section-devtools" style={{ scrollMarginTop: 20, paddingBottom: 48 }}>
                <SectionAnchor id="devtools" icon={Wrench} title="Developer Tools" subtitle="Re-audit with applied fixes and file-level diff comparison" color="#f43f5e" />
                <LocalErrorBoundary sectionName="Developer Tools">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <ReAuditDiff auditId={auditId} selectedFixes={Array.from(selectedFixes)} onReAuditComplete={() => {}} />
                    <FileDiffPanel auditId={auditId} />
                  </div>
                </LocalErrorBoundary>
              </section>

            </motion.div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

        
        {/* ── STICKY GLASS HEADER ────────────────────────────────────────── */}
        <header style={{
          position: "sticky", top: 0, left: 0, right: 0, zIndex: 50,
          background: "rgba(6, 7, 10, 0.72)", backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 32px", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div onClick={onGoHome} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#fff" }}>ManualMate</span>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", background: "rgba(0, 245, 160, 0.12)", color: "#00f5a0", borderRadius: 4, textTransform: "uppercase" }}>AI</span>
            </div>

            <div style={{ height: 16, width: 1, background: "rgba(255,255,255,0.15)" }} />

            {/* Partial state warning banner */}
            {isPartial ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "5px 12px",
                background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.18)",
                borderRadius: 8, color: "#eab308", fontSize: 10.5, fontWeight: 650
              }}>
                <AlertTriangle size={12} />
                <span>Partial Analysis: Some Ollama intelligence models were unavailable.</span>
              </div>
            ) : (
              <div style={{
                display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
                background: "rgba(0, 245, 160, 0.05)", border: "1px solid rgba(0, 245, 160, 0.18)",
                borderRadius: 8, color: "#00f5a0", fontSize: 10.5, fontWeight: 650
              }}>
                <CheckCircle size={12} />
                <span>All 7 Agent Modules Active</span>
              </div>
            )}
          </div>

          {/* Global actions bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onGoDashboard} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 10,
              color: "#e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
            }}>
              <LayoutDashboard size={13} />
              <span>Audit History</span>
            </button>
            
            <button onClick={handleExport} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 10,
              color: "#e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
            }}>
              <Download size={13} />
              <span>Export Report</span>
            </button>

            <button onClick={onGoAuditInput} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", background: "rgba(0, 245, 160, 0.12)",
              border: "1px solid rgba(0, 245, 160, 0.28)", borderRadius: 10,
              color: "#00f5a0", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
            }}>
              <Sparkles size={13} />
              <span>New Audit</span>
            </button>
          </div>
        </header>

        {/* Main Content Layout Container: max-width: 1600px, padding: 32px, gap: 32px */}
        <motion.main
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{
            maxWidth: 1600,
            margin: "0 auto",
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 32,
            position: "relative",
            zIndex: 10,
            width: "100%"
          }}
        >
          
          {/* ── 5. HERO SUMMARY SECTION ────────────────────────────────────────── */}
          <GlassCard style={{ padding: 40, display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 48, alignItems: "center", flexDirection: "row" }}>
            
            {/* Left Column: Radial score progress */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "relative", width: 200, height: 200, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <svg style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
                  <circle cx="100" cy="100" r="85" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="11" fill="transparent" />
                  <motion.circle
                    cx="100" cy="100" r="85" stroke="#00f5a0" strokeWidth="11" fill="transparent"
                    strokeDasharray={2 * Math.PI * 85}
                    initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 85) - ((siteScore || 0) / 100) * (2 * Math.PI * 85) }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: "absolute", textAlign: "center" }}>
                  <div style={{ fontSize: 62, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>{siteScore || 0}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(155, 169, 196, 0.6)", textTransform: "uppercase", letterSpacing: "0.12em" }}>UX Health</div>
                </div>
              </div>
              <div style={{
                marginTop: 20, padding: "6px 16px", background: "rgba(52, 211, 153, 0.08)",
                border: "1px solid rgba(52, 211, 153, 0.22)", borderRadius: 999,
                fontSize: 12, fontWeight: 800, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.08em"
              }}>
                {siteScore >= 90 ? "Excellent Standards" : siteScore >= 70 ? "Minor Deductions" : "Critical Fixes Required"}
              </div>
            </div>

            {/* Right Column: Audit summary metadata */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <span className="cosmo-pill" style={{ marginBottom: 12, fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "rgba(0, 245, 160, 0.8)" }}>
                  Analysis Summary
                </span>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.025em", marginTop: 8 }}>
                  {inputType === "image" ? "Vision-Audited Design Layout" : auditUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </h1>
                {executiveSummary?.headline && (
                  <p style={{ fontSize: 14.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, marginTop: 10, background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                    {executiveSummary.headline}
                  </p>
                )}
              </div>

              {/* 6 Grid Metrics Display */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "rgba(155, 169, 196, 0.5)" }}>Pages Audited</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 2 }}>{safePages.length}</div>
                </div>
                <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "rgba(155, 169, 196, 0.5)" }}>Unique Issues</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#f43f5e", marginTop: 2 }}>{safeIssues.length}</div>
                </div>
                <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "rgba(155, 169, 196, 0.5)" }}>Occurrences</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#ffac0a", marginTop: 2 }}>{safeIssues.reduce((acc, curr) => acc + (curr.occurrences || 1), 0)}</div>
                </div>
                <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "rgba(155, 169, 196, 0.5)" }}>Business Grade</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#a855f7", marginTop: 2 }}>{getEstimatedUXGrade(siteScore)}</div>
                </div>
                <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "rgba(155, 169, 196, 0.5)" }}>Impact Risk</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0175ff", marginTop: 2 }}>{businessImpact?.overall_risk || "Low"}</div>
                </div>
                <div style={{ padding: 12, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "rgba(155, 169, 196, 0.5)" }}>Est. Improvement</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#00f5a0", marginTop: 2 }}>+{businessImpact?.estimated_improvement || 0} pts</div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* ── 2. METRICS ROW ─────────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <MetricCard label="Overall Score" value={siteScore != null ? `${siteScore}%` : "No data"} icon={CheckCircle} color="#00f5a0" description="Aesthetic Heuristics" />
            <MetricCard label="Accessibility" value={safeScoreBreakdown.accessibility != null ? `${safeScoreBreakdown.accessibility}%` : "No data"} icon={Shield} color="#0175ff" description="WCAG 2.2 AA Rules" />
            <MetricCard label="Consistency" value={safeScoreBreakdown.consistency != null ? `${safeScoreBreakdown.consistency}%` : "No data"} icon={Palette} color="#a855f7" description="Style & Palette uniformity" />
            <MetricCard label="Performance" value={safeScoreBreakdown.performance != null ? `${safeScoreBreakdown.performance}%` : "No data"} icon={Activity} color="#ffac0a" description="Loading & Transition speed" />
            <MetricCard label="Unique Violations" value={safeIssues.length} icon={ShieldAlert} color="#f43f5e" description="Failing compliance codes" />
          </section>

          {/* ── 3. ANALYTICS ROW (CHARTS) ──────────────────────────────────────── */}
          <LocalErrorBoundary sectionName="Charts">
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <GlassCard style={{ minHeight: 420, justifyContent: "space-between" }}>
                <SectionHeader label="Visual Analytics" title="Compliance Radar" />
                <div style={{ height: 280, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={10} fontWeight="bold" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.05)" fontSize={8} />
                        <Radar name="Compliance" dataKey="A" stroke="#00f5a0" fill="#00f5a0" fillOpacity={0.10} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Compliance radar scoring details are not available for this site." />
                  )}
                </div>
              </GlassCard>

              <GlassCard style={{ minHeight: 420, justifyContent: "space-between" }}>
                <SectionHeader label="Violations Severity" title="Severity Distribution" />
                <div style={{ height: 280, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {donutData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value">
                          {donutData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#06070a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#f4f4f5", fontSize: 11 }} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#a1a1aa", fontWeight: "bold" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="No issues detected (100% compliant)." />
                  )}
                </div>
              </GlassCard>

              <GlassCard style={{ minHeight: 420, justifyContent: "space-between" }}>
                <SectionHeader label="Timeline Progress" title="Crawl Score Trend" />
                <div style={{ height: 280, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {lineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                        <YAxis stroke="#71717a" domain={[0, 100]} fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#06070a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#f4f4f5", fontSize: 11 }} />
                        <Line type="monotone" dataKey="score" stroke="#0175ff" strokeWidth={3} dot={{ fill: "#00f5a0", strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState message="Score trends are not available for single page design uploads." />
                  )}
                </div>
              </GlassCard>
            </section>
          </LocalErrorBoundary>

          {/* ── 4. TOP ISSUES ─────────────────────────────────────────────────── */}
          <GlassCard style={{ padding: 32 }}>
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
              <SectionHeader label="Priority Fixes" title="Critical Visual & Layout Violations" />
              <span className="cosmo-pill" style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                {safeIssues.filter(i => i.severity === "critical" || i.severity === "serious").length} High Severity
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {safeIssues.filter(i => i.severity === "critical" || i.severity === "serious" || i.severity === "moderate").slice(0, 3).map((issue, index) => (
                <div key={issue.id || index} style={{
                  display: "flex", justifyItems: "center", justifyContent: "space-between",
                  padding: "16px 20px", background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, alignItems: "center"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: 99, fontSize: 9, fontWeight: 800, textTransform: "uppercase",
                      background: `rgba(${issue.severity === "critical" ? "244,63,94" : "249,115,22"}, 0.12)`,
                      color: issue.severity === "critical" ? "#f43f5e" : "#f97316"
                    }}>{issue.severity}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 650, color: "#e2e8f0" }}>{issue.description}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 11, color: "rgba(155, 169, 196, 0.45)", fontFamily: "monospace" }}>Score Impact: -{issue.score_impact || 3}</span>
                    <button onClick={() => handleIssueSelect(issue.id)} style={{
                      padding: "6px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8, fontSize: 11, color: "#fff", cursor: "pointer", fontWeight: 600
                    }}>Inspect</button>
                  </div>
                </div>
              ))}
              {safeIssues.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
                  No violations detected on this page.
                </div>
              )}
            </div>
          </GlassCard>

          {/* ── 5. INTERACTIVE SITEMAP ───────────────────────────────────────── */}
          <LocalErrorBoundary sectionName="Dashboard">
            <GlassCard style={{ padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <SectionHeader label="Website Map" title="Interactive Discovered Pages" />
                <div style={{ fontSize: 11, color: "rgba(155, 169, 196, 0.5)", fontWeight: 600 }}>Click cards to inspect page-specific issues.</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                {safePages.map((p, idx) => {
                  const isActive = (p.page_id === activePageId || p.id === activePageId);
                  const totalOccurrences = p.total_occurrences || 0;
                  return (
                    <div
                      key={p.page_id || idx}
                      onClick={() => handlePageSelect(p.page_id || p.id)}
                      style={{
                        padding: 24, background: isActive ? "rgba(0, 245, 160, 0.04)" : "rgba(255,255,255,0.01)",
                        border: `1px solid ${isActive ? "rgba(0, 245, 160, 0.28)" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 20, cursor: "pointer", transition: "all 0.25s",
                        display: "flex", flexDirection: "column", gap: 14
                      }}
                    >
                      <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "rgba(155, 169, 196, 0.4)", letterSpacing: "0.05em" }}>Page #{p.crawl_order || (idx + 1)}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 800,
                          color: getEstimatedUXGradeColor(p.page_score)
                        }}>Score: {p.page_score || 100}</span>
                      </div>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#fff", wordBreak: "break-all" }}>
                          {p.url ? (p.url.replace(/^https?:\/\/(www\.)?/, "")) : "Uploaded Design"}
                        </h4>
                      </div>
                      <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 11, color: "rgba(155,169,196,0.5)" }}>
                        <span>{p.issue_count || 0} violations</span>
                        <span>{totalOccurrences} occurrences</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </LocalErrorBoundary>

          {/* ── JOURNEY TIMELINE (IF AVAILABLE) ───────────────────────────── */}
          {safeSteps.length > 0 && (
            <GlassCard style={{ padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <Compass size={18} color="#00f5a0" />
                <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "#e2e8f0" }}>User Journey timeline steps</h3>
              </div>
              
              <div style={{ display: "flex", gap: 20, overflowX: "auto", paddingBottom: 16 }}>
                {safeSteps.map((step, index) => {
                  const isActive = step.step_id === activeStepId;
                  return (
                    <div
                      key={step.step_id || index}
                      onClick={() => handleStepSelect(step.step_id)}
                      style={{
                        minWidth: 220, padding: 18, background: isActive ? "rgba(0, 245, 160, 0.04)" : "rgba(255,255,255,0.01)",
                        border: `1px solid ${isActive ? "rgba(0, 245, 160, 0.24)" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 16, cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 10
                      }}
                    >
                      <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(155,169,196,0.4)" }}>STEP {step.step_number}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#00f5a0" }}>{step.score}% Compliance</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{step.step_label}</div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* ── 6. ISSUE EXPLORER (SIDEBAR VISUALIZER & CODE SIMULATOR) ────────── */}
          <LocalErrorBoundary sectionName="Visualizer">
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Interactive Screenshot / Bounding Boxes Overlays (2 Columns width) */}
              <GlassCard className="lg:col-span-2" style={{ height: 580, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
                  <SectionHeader label="Audited Node Mapping" title="Visualizer Coordinates Mapping" />
                  
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} style={{ width: 28, height: 28, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", borderRadius: 6, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                    <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={{ padding: "0 10px", height: 28, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Reset</button>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{ width: 28, height: 28, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", borderRadius: 6, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  </div>
                </div>

                {/* Drag Zone Viewer */}
                <div
                  onMouseMove={handleMouseMove}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    flex: 1, position: "relative", overflow: "hidden", background: "#0b0c10",
                    borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", cursor: isDragging ? "grabbing" : "grab"
                  }}
                >
                  <div style={{
                    position: "absolute", width: "100%", height: "100%", transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "top left", transition: isDragging ? "none" : "transform 0.15s ease-out"
                  }}>
                    <img
                      src={getScreenshotSrc(activePage)}
                      onLoad={(e) => setImgSize({ w: e.target.naturalWidth || 1280, h: e.target.naturalHeight || 800 })}
                      style={{ display: "block", maxWidth: "none", height: "auto", userSelect: "none" }}
                      alt=""
                    />

                    {/* Overlaid bounding box outlines */}
                    {activePageIssues.filter(i => i.boundingBox).map((issue, idx) => {
                      const box = issue.boundingBox;
                      const isSelected = issue.id === activeIssue?.id;
                      const left = (box.x / imgSize.w) * 100;
                      const top = (box.y / imgSize.h) * 100;
                      const width = (box.width / imgSize.w) * 100;
                      const height = (box.height / imgSize.h) * 100;

                      return (
                        <div
                          key={issue.id || idx}
                          onClick={(e) => { e.stopPropagation(); handleIssueSelect(issue.id); }}
                          style={{
                            position: "absolute", left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
                            border: isSelected ? "2px solid #00f5a0" : `1px dashed ${DONUT_COLORS[issue.severity] || "#ffac0a"}`,
                            background: isSelected ? "rgba(0, 245, 160, 0.08)" : "transparent",
                            cursor: "pointer", transition: "all 0.2s", zIndex: isSelected ? 30 : 10,
                            boxShadow: isSelected ? "0 0 16px rgba(0, 245, 160, 0.4)" : "none"
                          }}
                          title={`${issue.rule_id}: ${issue.description}`}
                        />
                      );
                    })}
                  </div>

                  {/* Hidden natural width helper */}
                  <span style={{ display: "none" }}>
                    <img
                      src={getScreenshotSrc(activePage)}
                      onLoad={(e) => setImgSize({ w: e.target.naturalWidth || 1280, h: e.target.naturalHeight || 800 })}
                      alt=""
                    />
                  </span>
                </div>
              </GlassCard>

              {/* Right Column: Code Fix & Issue details (1 Column width) */}
              <GlassCard className="lg:col-span-1" style={{ height: 580, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "#e2e8f0", marginBottom: 20 }}>Audited Node Metrics</h3>
                
                {activeIssue ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1, overflowY: "auto" }}>
                    <div>
                      <span style={{
                        padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                        background: `rgba(${activeIssue.severity === "critical" ? "244,63,94" : "249,115,22"}, 0.12)`,
                        color: activeIssue.severity === "critical" ? "#f43f5e" : "#f97316"
                      }}>{activeIssue.severity}</span>
                      <h4 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 10, letterSpacing: "-0.01em" }}>{activeIssue.rule_id || "UX Rule violation"}</h4>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "rgba(155, 169, 196, 0.5)" }}>Description</div>
                      <p style={{ fontSize: 13.5, color: "rgba(155, 169, 196, 0.85)", lineHeight: 1.6 }}>{activeIssue.description}</p>
                    </div>

                    {activeIssue.wcag_reference && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "rgba(155, 169, 196, 0.5)" }}>WCAG Standards</div>
                        <span style={{ display: "inline-flex", padding: "6px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12, color: "#e2e8f0", width: "fit-content", fontWeight: 600 }}>
                          {activeIssue.wcag_reference}
                        </span>
                      </div>
                    )}

                    {/* AI Recommendation details */}
                    {(activeIssue.recommendation || activeIssue.fix?.explanation_text) && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 18, background: "rgba(0, 245, 160, 0.04)", border: "1px solid rgba(0, 245, 160, 0.14)", borderRadius: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#00f5a0", textTransform: "uppercase" }}>
                          <Sparkles size={12} />
                          AI Recommendation
                        </div>
                        <p style={{ fontSize: 13, color: "rgba(155,169,196,0.9)", lineHeight: 1.6 }}>
                          {activeIssue.recommendation || activeIssue.fix?.explanation_text}
                        </p>

                        {activeIssue.fix?.css_rule_text && (
                          <div style={{ marginTop: 4 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(155,169,196,0.5)", textTransform: "uppercase", marginBottom: 6 }}>Code Fix Preview</div>
                            <pre style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.06)", padding: 10, borderRadius: 8, fontSize: 10.5, fontFamily: "monospace", overflowX: "auto", color: "#34d399", margin: 0 }}>
                              {activeIssue.fix.css_rule_text}
                            </pre>
                          </div>
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleFix && onToggleFix(activeIssue.id); }}
                          style={{
                            marginTop: 4, width: "100%", padding: "8px 0", cursor: "pointer",
                            background: selectedFixes.has(activeIssue.id) ? "rgba(52,211,153,0.12)" : "linear-gradient(135deg, #0175ff, #00f5a0)",
                            border: selectedFixes.has(activeIssue.id) ? "1px solid rgba(52,211,153,0.22)" : "none",
                            borderRadius: 8, color: selectedFixes.has(activeIssue.id) ? "#34d399" : "#06070a",
                            fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                          }}
                        >
                          {selectedFixes.has(activeIssue.id) ? <><Check size={12} /> Fix Selected</> : "Apply Fix Simulator"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "rgba(155,169,196,0.4)", fontSize: 13 }}>
                    Select a violation node in the visualizer to inspect parameters.
                  </div>
                )}
              </GlassCard>
            </section>
          </LocalErrorBoundary>

          {/* ── 7. BUSINESS IMPACT SECTION (REFACTORED FLOW) ────────────────── */}
          <GlassCard style={{ padding: 32 }}>
            <div style={{ marginBottom: 24 }}>
              <SectionHeader label="Financial Impact" title="Conversion Loss Analysis Flow" subtitle="Trace visual failures to revenue conversion impact models" />
            </div>

            {businessImpact && businessImpact.status !== "unavailable" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                
                {/* Horizontal Risk summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div style={{ padding: 20, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16 }}>
                    <div style={{ fontSize: 11, color: "rgba(155,169,196,0.5)", textTransform: "uppercase", fontWeight: 700 }}>Overall Dropoff Risk</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: businessImpact.risk_color === "rose" ? "#f43f5e" : "#34d399", marginTop: 6 }}>
                      {businessImpact.overall_risk} Risk
                    </div>
                  </div>
                  <div style={{ padding: 20, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16 }}>
                    <div style={{ fontSize: 11, color: "rgba(155,169,196,0.5)", textTransform: "uppercase", fontWeight: 700 }}>Estimated Score Lift</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#00f5a0", marginTop: 6 }}>
                      +{businessImpact.estimated_improvement} Points
                    </div>
                  </div>
                  <div style={{ padding: 20, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16 }}>
                    <div style={{ fontSize: 11, color: "rgba(155,169,196,0.5)", textTransform: "uppercase", fontWeight: 700 }}>Total Tracked Issues</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#0175ff", marginTop: 6 }}>
                      {businessImpact.total_issues} Failures
                    </div>
                  </div>
                </div>

                {/* 1:1 Flow Refactoring: Issue -> Impact -> Expected Improvement -> Priority */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {Array.isArray(businessImpact.by_category) && businessImpact.by_category.map((cat, idx) => (
                    <div key={idx} style={{
                      padding: 24, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20,
                      display: "flex", flexDirection: "column", gap: 16
                    }}>
                      
                      {/* Step 1: Issue */}
                      <div>
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#a1a1aa", textTransform: "uppercase", trackingSpacing: "0.08em" }}>Step 1: Issue Detected</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <ShieldAlert size={14} className="text-rose-400" />
                          <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#fff" }}>{cat.metric} ({cat.category})</h4>
                        </div>
                        <p style={{ fontSize: 13, color: "rgba(155,169,196,0.75)", marginTop: 6, lineHeight: 1.5 }}>
                          {cat.description}
                        </p>
                      </div>

                      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", width: "100%" }} />

                      {/* Step 2: Impact */}
                      <div>
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#f97316", textTransform: "uppercase", trackingSpacing: "0.08em" }}>Step 2: Conversion Impact</span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 16, fontWeight: 900, color: "#f97316" }}>{cat.loss_range} Dropoff</span>
                          <span style={{ fontSize: 12, color: "rgba(155,169,196,0.5)" }}>risk on {cat.loss_metric}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(155,169,196,0.6)", marginTop: 4, fontStyle: "italic" }}>
                          Reference Basis: {cat.research_ref}
                        </p>
                      </div>

                      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", width: "100%" }} />

                      {/* Step 3: Expected Improvement */}
                      <div>
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#00f5a0", textTransform: "uppercase", trackingSpacing: "0.08em" }}>Step 3: Expected Improvement</span>
                        <p style={{ fontSize: 13, color: "#00f5a0", fontWeight: 700, marginTop: 4 }}>
                          {cat.fix_benefit}
                        </p>
                      </div>

                      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", width: "100%" }} />

                      {/* Step 4: Priority */}
                      <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "#0175ff", textTransform: "uppercase", trackingSpacing: "0.08em" }}>Step 4: Resolve Priority</span>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginTop: 2 }}>{cat.risk_level} Impact Severity</div>
                        </div>
                        <span style={{
                          padding: "4px 12px", borderRadius: 8, fontSize: 10, fontWeight: 900, textTransform: "uppercase",
                          background: `rgba(${cat.risk_level === "High" ? "244,63,94" : "1,117,255"}, 0.12)`,
                          color: cat.risk_level === "High" ? "#f43f5e" : "#0175ff"
                        }}>
                          {cat.risk_level === "High" ? "Urgent Fix" : "Recommended"}
                        </span>
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            ) : (
              <EmptyState message="No analysis data available." />
            )}
          </GlassCard>

          {/* ── 8. PERSONAS SIMULATION SECTION ───────────────────────────────── */}
          <LocalErrorBoundary sectionName="Personas">
            <GlassCard style={{ padding: 32 }}>
              <div style={{ marginBottom: 24 }}>
                <SectionHeader label="Target Personas" title="User Persona Simulation Metrics" subtitle="Evaluate accessibility friction constraints across diverse profiles" />
              </div>

              {Array.isArray(personas) && personas.length > 0 && !personas[0]?.reason ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {personas.map((pers, idx) => (
                    <div key={pers.id || idx} style={{
                      padding: 24, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20,
                      display: "flex", flexDirection: "column", gap: 16
                    }}>
                      <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 24 }}>{pers.emoji}</span>
                          <div>
                            <h4 style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{pers.label}</h4>
                            <span style={{ fontSize: 10, color: "rgba(155,169,196,0.45)", textTransform: "uppercase", fontWeight: 700 }}>ID: {pers.id}</span>
                          </div>
                        </div>
                        <span style={{
                          padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 900,
                          background: `rgba(${pers.grade_color === "rose" ? "244,63,94" : pers.grade_color === "yellow" ? "234,179,8" : "52,211,153"}, 0.12)`,
                          color: pers.grade_color === "rose" ? "#f43f5e" : pers.grade_color === "yellow" ? "#eab308" : "#34d399"
                        }}>{pers.grade} Score: {pers.score}%</span>
                      </div>

                      <p style={{ fontSize: 12.5, color: "rgba(155,169,196,0.65)", lineHeight: 1.5 }}>{pers.description}</p>

                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "rgba(155,169,196,0.45)", marginBottom: 8 }}>Primary Usability Deductions</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {Array.isArray(pers.top_issues) && pers.top_issues.map((iss, iidx) => (
                            <div key={iidx} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                              <span style={{ color: iss.severity === "critical" ? "#f43f5e" : "#f97316", fontSize: 11, marginTop: 2 }}>•</span>
                              <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: 1.4 }}>{iss.description}</p>
                            </div>
                          ))}
                          {(!pers.top_issues || pers.top_issues.length === 0) && (
                            <span style={{ fontSize: 11, color: "rgba(0,245,160,0.6)" }}>✓ No significant friction detected for this persona profile.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="Persona analysis unavailable. More website interaction data is required." />
              )}
            </GlassCard>
          </LocalErrorBoundary>

          {/* ── VISUAL THEME RECOMMENDATION SECTION ─────────────────────────── */}
          <GlassCard style={{ padding: 32 }}>
            <div style={{ marginBottom: 24 }}>
              <SectionHeader label="Visual Theme" title="Recommended Branding & Style Palette" subtitle="Review color contrast compliance for detected brand profiles" />
            </div>

            {themeData && themeData.status !== "unavailable" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{themeData.emoji}</span>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{themeData.label} Style Profile</h4>
                      <span style={{ fontSize: 10.5, color: "rgba(155,169,196,0.45)", fontWeight: 700, textTransform: "uppercase" }}>Industry Signals Detected: {themeData.industry}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(155,169,196,0.75)", lineHeight: 1.6 }}>{themeData.description}</p>
                  
                  <div style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(0,245,160,0.04)", border: "1px solid rgba(0,245,160,0.12)", padding: 12, borderRadius: 10, width: "fit-content" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00f5a0" }} />
                    <span style={{ fontSize: 11.5, fontWeight: 750, color: "#00f5a0" }}>
                      {themeData.wcag_aa_compliant ? "Branding compliance grade: WCAG 2.2 AA Verified" : "Minor color adjustments required for AAA readability"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "rgba(155, 169, 196, 0.45)" }}>Swatches Palette: {themeData.palette_name}</span>
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      {Array.isArray(themeData.swatches) && themeData.swatches.map((hex, idx) => (
                        <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: hex, border: "1px solid rgba(255,255,255,0.08)" }} />
                          <span style={{ fontSize: 9.5, color: "rgba(155, 169, 196, 0.5)", fontFamily: "monospace" }}>{hex}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: "rgba(155, 169, 196, 0.45)" }}>Typography Styling Recommendations</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      {Array.isArray(themeData.fonts) && themeData.fonts.map((f, idx) => (
                        <span key={idx} style={{ padding: "4px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, fontSize: 11.5, color: "#fff", fontWeight: 500 }}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState message="No theme analysis signals available." />
            )}
          </GlassCard>

          {/* ── 9. AI CONSULTATION CHAT INTERFACE ─────────────────────────────── */}
          <LocalErrorBoundary sectionName="AI Assistant">
            <GlassCard style={{ padding: 32 }}>
              <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MessageSquare size={18} color="#00f5a0" />
                  <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.10em", color: "#e2e8f0" }}>Autonomous AI UX Consultation</h3>
                </div>

                {/* Status Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: ollamaStatus === "Connected" ? "#00f5a0" : ollamaStatus === "Connecting" || ollamaStatus === "Streaming" ? "#ffac0a" : "#f43f5e",
                    boxShadow: ollamaStatus === "Connected" ? "0 0 10px #00f5a0" : "none"
                  }} />
                  <span style={{
                    fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em",
                    color: ollamaStatus === "Connected" ? "#00f5a0" : ollamaStatus === "Connecting" || ollamaStatus === "Streaming" ? "#ffac0a" : "#f43f5e"
                  }}>
                    {ollamaStatus === "Connected" ? "Ollama Connected" : ollamaStatus === "Connecting" ? "Connecting..." : ollamaStatus === "Streaming" ? "Streaming Response" : ollamaStatus === "ModelMissing" ? "Model Missing" : "Offline"}
                  </span>
                </div>
              </div>

              {/* Chat states routing */}
              {ollamaStatus === "Unavailable" ? (
                <div style={{ padding: "40px 24px", background: "rgba(244,63,94,0.02)", border: "1px solid rgba(244,63,94,0.18)", borderRadius: 16, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <AlertTriangle size={32} style={{ color: "#f43f5e" }} />
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: "#fff", textTransform: "uppercase" }}>Local AI Assistant unavailable.</h4>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", maxLineHeight: 1.5, maxWidth: 360 }}>
                    Please start Ollama daemon service locally on port 11434 to enable consulting:
                  </p>
                  <pre style={{ background: "#000", border: "1px solid rgba(255,255,255,0.06)", padding: "10px 20px", borderRadius: 8, fontSize: 12, fontFamily: "monospace", color: "#f43f5e" }}>
                    ollama serve
                  </pre>
                  <button onClick={checkOllamaConnection} className="cosmo-btn-primary" style={{ marginTop: 8 }}>
                    <RefreshCw size={12} className="mr-1" /> Retry Connection
                  </button>
                </div>
              ) : ollamaStatus === "ModelMissing" ? (
                <div style={{ padding: "40px 24px", background: "rgba(249,115,22,0.02)", border: "1px solid rgba(249,115,22,0.18)", borderRadius: 16, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <AlertTriangle size={32} style={{ color: "#f97316" }} />
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: "#fff", textTransform: "uppercase" }}>Required model not found.</h4>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", maxLineHeight: 1.5, maxWidth: 360 }}>
                    The target language model is missing in Ollama registry. Pull it to continue:
                  </p>
                  <pre style={{ background: "#000", border: "1px solid rgba(255,255,255,0.06)", padding: "10px 20px", borderRadius: 8, fontSize: 12, fontFamily: "monospace", color: "#f97316" }}>
                    ollama pull qwen2.5:3b
                  </pre>
                  <button onClick={checkOllamaConnection} className="cosmo-btn-primary" style={{ marginTop: 8 }}>
                    <RefreshCw size={12} className="mr-1" /> Retry Connection
                  </button>
                </div>
              ) : (
                <>
                  {/* Scrollable messages box */}
                  <div style={{
                    display: "flex", flexDirection: "column", gap: 16,
                    background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 18, padding: 24, maxHeight: 300, overflowY: "auto"
                  }}>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} style={{
                        display: "flex", gap: 12,
                        alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "80%"
                      }}>
                        <div style={{
                          background: msg.role === "user" ? "linear-gradient(135deg, #0175ff, #00f5a0)" : "rgba(255, 255, 255, 0.03)",
                          border: msg.role === "user" ? "none" : "1px solid rgba(255, 255, 255, 0.06)",
                          borderRadius: msg.role === "user" ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                          padding: "12px 18px", color: msg.role === "user" ? "#06070a" : "#e2e8f0",
                          fontSize: 13.5, fontWeight: msg.role === "user" ? 650 : 500, lineHeight: 1.5,
                          wordBreak: "break-word"
                        }}>
                          {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                          
                          {/* Citation / Sources Footer in assistant message */}
                          {msg.role === "assistant" && idx > 0 && (
                            <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                              <span>Sources:</span>
                              <span className="bg-black/35 px-1.5 py-0.5 rounded border border-white/5">sqlite3:issues</span>
                              <span className="bg-black/35 px-1.5 py-0.5 rounded border border-white/5">sqlite3:score_breakdown</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Bouncing typing indicator */}
                    {isSending && chatMessages[chatMessages.length - 1]?.content === "" && (
                      <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "18px 18px 18px 2px" }}>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Ollie is typing</span>
                        <div style={{ display: "flex", gap: 3 }}>
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Perplexity-style Suggested prompt pills */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>
                    {suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendChat(p)}
                        disabled={isSending}
                        style={{
                          padding: "6px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: 8, fontSize: 11, color: "rgba(255,255,255,0.6)", cursor: "pointer", transition: "all 0.2s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0, 245, 160, 0.3)"; e.currentTarget.style.color = "#00f5a0"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {/* Form input */}
                  <form onSubmit={(e) => { e.preventDefault(); handleSendChat(chatInput); }} style={{ display: "flex", gap: 12 }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Ask me how to solve visual violations or improve specific persona compliance..."
                      disabled={isSending}
                      style={{
                        flex: 1, padding: "14px 20px", background: "rgba(0,0,0,0.20)",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                        color: "#fff", fontSize: 13.5, outline: "none", transition: "border-color 0.2s"
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSending || !chatInput.trim()}
                      style={{
                        padding: "0 24px", background: isSending || !chatInput.trim() ? "rgba(0, 245, 160, 0.25)" : "linear-gradient(135deg, #00f5a0, #14b8a6)",
                        border: "none", borderRadius: 12, color: isSending || !chatInput.trim() ? "rgba(255,255,255,0.3)" : "#022c22",
                        fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", cursor: isSending || !chatInput.trim() ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
                      }}
                    >
                      <Send size={12} />
                      <span>Send</span>
                    </button>
                  </form>
                </>
              )}
            </GlassCard>
          </LocalErrorBoundary>

          {/* ── NAVIGATION GRAPH (MODULE 1) ────────────────────────────────── */}
          <LocalErrorBoundary sectionName="Navigation Graph">
            <GlassCard style={{ padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <SectionHeader label="Navigation Graph" title="Interactive Journey Node Relationships" subtitle="Visualize internal links and path flow topology" />
              </div>
              {navigationGraphData && navigationGraphData.length > 0 ? (
                <NavigationGraph
                  pages={navigationGraphData}
                  activePageId={activePageId}
                  onPageSelect={handlePageSelect}
                />
              ) : (
                <EmptyState message="No navigation graph data available." />
              )}
            </GlassCard>
          </LocalErrorBoundary>

          {/* ── PRIORITIES AGENT (MODULE 4) ────────────────────────────────── */}
          <LocalErrorBoundary sectionName="Priority Agent">
            <GlassCard style={{ padding: 32 }}>
              <PriorityAgent
                auditId={auditId}
                selectedFixes={selectedFixes}
                onToggleFix={onToggleFix}
              />
            </GlassCard>
          </LocalErrorBoundary>

          {/* ── BEFORE VS AFTER COMPARISON (MODULE 5) ──────────────────────── */}
          <LocalErrorBoundary sectionName="Before vs After">
            <GlassCard style={{ padding: 32 }}>
              <div style={{ marginBottom: 24 }}>
                <SectionHeader label="Before vs After" title="AI-Generated Improvement Diff" subtitle="Compare baseline layout and styling with proposed corrections" />
              </div>
              {beforeAfterList && beforeAfterList.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {beforeAfterList.map((item, idx) => (
                    <div key={item.id || idx} style={{ padding: 20, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 800, color: "#00f5a0", marginBottom: 12 }}>
                        {item.page_path}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Before */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#f43f5e", textTransform: "uppercase" }}>Baseline Style</span>
                          <div style={{ padding: 14, background: "rgba(244,63,94,0.03)", border: "1px solid rgba(244,63,94,0.12)", borderRadius: 10 }}>
                            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.8)", marginBottom: 8, fontStyle: "italic" }}>
                              {item.before?.visual || "No visual issue context."}
                            </div>
                            <pre style={{ margin: 0, fontSize: 10.5, fontFamily: "monospace", color: "rgba(255,255,255,0.5)", overflowX: "auto" }}>
                              {item.before?.html || "<!-- No code context available -->"}
                            </pre>
                          </div>
                        </div>
                        {/* After */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#34d399", textTransform: "uppercase" }}>Proposed Correction</span>
                          <div style={{ padding: 14, background: "rgba(52,211,153,0.03)", border: "1px solid rgba(52,211,153,0.12)", borderRadius: 10 }}>
                            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.8)", marginBottom: 8, fontStyle: "italic" }}>
                              {item.after?.visual || "No visual recommendation."}
                            </div>
                            <pre style={{ margin: 0, fontSize: 10.5, fontFamily: "monospace", color: "#34d399", overflowX: "auto" }}>
                              {item.after?.html || "<!-- No code recommendation available -->"}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No style override diffs available." />
              )}
            </GlassCard>
          </LocalErrorBoundary>

          {/* ── PROGRESS TRACKER (MODULE 6) ────────────────────────────────── */}
          <LocalErrorBoundary sectionName="Progress History">
            <GlassCard style={{ padding: 32 }}>
              <div style={{ marginBottom: 24 }}>
                <SectionHeader label="Progress History" title="Improvement Timeline & Score Track" subtitle="Monitor audit progression and track resolution scores over time" />
              </div>
              {progressHistory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Score chart */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(155, 169, 196, 0.6)", textTransform: "uppercase" }}>Historical Score Progression</span>
                    <div style={{ height: 200, width: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressHistory.history || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="timestamp" stroke="#71717a" fontSize={9} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="#71717a" fontSize={9} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: "#06070a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#f4f4f5", fontSize: 11 }} />
                          <Line type="monotone" dataKey="uxScore" name="UX Score" stroke="#00f5a0" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="a11yScore" name="Accessibility Score" stroke="#0175ff" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* Right: Remaining issues & recommendations */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ padding: 16, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12 }}>
                      <div style={{ fontSize: 10, color: "rgba(155,169,196,0.5)", textTransform: "uppercase", fontWeight: 700 }}>Remaining Issues Count</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#f43f5e", marginTop: 4 }}>
                        {progressHistory.remaining_issues || 0} unresolved violations
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "rgba(155,169,196,0.5)", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Next Resolution Milestones</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {Array.isArray(progressHistory.next_recommendations) && progressHistory.next_recommendations.map((rec, rIdx) => (
                          <div key={rIdx} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7" }} />
                            <span style={{ fontSize: 12, color: "#e2e8f0" }}>{rec}</span>
                          </div>
                        ))}
                        {(!progressHistory.next_recommendations || progressHistory.next_recommendations.length === 0) && (
                          <span style={{ fontSize: 11, color: "rgba(155,169,196,0.4)" }}>No recommendations available.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState message="No timeline progress history details available." />
              )}
            </GlassCard>
          </LocalErrorBoundary>

          {/* ── DEVELOPER TOOLS (RE-AUDIT & DIFF PANELS) ──────────────────── */}
          <LocalErrorBoundary sectionName="Developer Tools">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <ReAuditDiff
                auditId={auditId}
                selectedFixes={Array.from(selectedFixes)}
                onReAuditComplete={(res) => {
                  if (res?.after?.site_score != null) {
                    // Update score locally or trigger reload
                  }
                }}
              />
              <FileDiffPanel auditId={auditId} />
            </div>
          </LocalErrorBoundary>

        </motion.main>

      </div>
    </ThemeProvider>
  );
}
