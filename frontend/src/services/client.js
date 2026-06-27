import { BASE_URL, safeFetch } from "./api";

const auditCache = new Map();

async function getOrFetchAudit(auditId) {
  if (auditCache.has(auditId)) {
    return auditCache.get(auditId);
  }
  // We call client.getAudit directly to fetch and cache
  const data = await client.getAudit(auditId);
  if (data && data.id) {
    auditCache.set(auditId, data);
  }
  return data || {};
}

export const client = {
  // ── Audit lifecycle ──────────────────────────────────────────────────────
  startAudit: async (url, pageLimit) => {
    const res = await fetch(`${BASE_URL}/api/audits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, page_limit: pageLimit })
    });
    return res.json();
  },

  startImageAudit: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/api/audits/image`, {
      method: "POST",
      body: formData
    });
    return res.json();
  },

  listAudits: async () => {
    const data = await safeFetch(`${BASE_URL}/api/audits`);
    return Array.isArray(data) ? data : [];
  },

  // ── Core audit data ───────────────────────────────────────────────────────
  getAudit: async (auditId) => {
    const data = await safeFetch(`${BASE_URL}/api/audits/${auditId}`);
    if (data && data.id) {
      auditCache.set(auditId, data);
    }
    return data || {};
  },

  getJourney: async (auditId) => {
    const data = await safeFetch(`${BASE_URL}/api/audits/${auditId}/journey`);
    if (!data) return { pages: [], steps: [], is_available: false, success: false, message: "Journey unavailable." };
    return {
      pages: Array.isArray(data.pages) ? data.pages : [],
      steps: Array.isArray(data.steps) ? data.steps : [],
      is_available: data.is_available !== false,
      success: data.success !== false,
      message: data.message || "",
    };
  },

  getIssues: async (auditId) => {
    const data = await safeFetch(`${BASE_URL}/api/audits/${auditId}/issues`);
    return Array.isArray(data) ? data : [];
  },

  // ── Cached Metadata Extractors (embedded in GET /api/audits/{id}) ──────────
  getTheme: async (auditId) => {
    const audit = await getOrFetchAudit(auditId);
    return audit.theme || {};
  },

  getExecutiveSummary: async (auditId) => {
    const audit = await getOrFetchAudit(auditId);
    return audit.executive_summary || {};
  },

  getScoreBreakdown: async (auditId) => {
    const audit = await getOrFetchAudit(auditId);
    return audit.score_breakdown || {};
  },

  getPriorityAgent: async (auditId) => {
    const audit = await getOrFetchAudit(auditId);
    return audit.priority_agent || { top_issues: [] };
  },

  // ── Heavy Granular Endpoints ──────────────────────────────────────────────
  getBusinessImpact: async (auditId) => {
    const data = await safeFetch(`${BASE_URL}/api/audits/${auditId}/business-impact`);
    return data || {};
  },

  getPersonas: async (auditId) => {
    const data = await safeFetch(`${BASE_URL}/api/audits/${auditId}/personas`);
    return Array.isArray(data) ? data : [];
  },

  getPriorities: async (auditId) => {
    const data = await safeFetch(`${BASE_URL}/api/audits/${auditId}/priorities`);
    return Array.isArray(data) ? data : [];
  },

  getBeforeAfter: async (auditId) => {
    const data = await safeFetch(`${BASE_URL}/api/audits/${auditId}/before-after`);
    return Array.isArray(data) ? data : [];
  },

  getProgressHistory: async (auditId) => {
    const data = await safeFetch(`${BASE_URL}/api/audits/${auditId}/progress-history`);
    return data || {};
  },

  getNavigationGraph: async (auditId) => {
    const data = await safeFetch(`${BASE_URL}/api/audits/${auditId}/navigation-graph`);
    return Array.isArray(data) ? data : [];
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  reAudit: async (auditId, fixIds) => {
    const data = await safeFetch(`${BASE_URL}/api/audits/${auditId}/re-audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fix_ids: fixIds })
    });
    return data || {};
  },

  uploadDiff: async (auditId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const data = await safeFetch(`${BASE_URL}/api/audits/${auditId}/diff`, {
      method: "POST",
      body: formData
    });
    return data || { diff: "" };
  },

  runQueryStream: async (auditId, query, onToken) => {
    try {
      const res = await fetch(`${BASE_URL}/api/audits/${auditId}/query/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        onToken(decoder.decode(value));
      }
    } catch (err) {
      console.error("Stream query failed:", err);
    }
  },

  // ── Media / Static Helpers ────────────────────────────────────────────────
  getStaticUrl: (path) => {
    if (!path) return "";
    return `${BASE_URL}/${path.replace(/^\//, "")}`;
  },

  getConsistencyUrl: (auditId) =>
    `${BASE_URL}/api/audits/${auditId}/consistency`,

  getExportUrl: (auditId) => `${BASE_URL}/api/audits/${auditId}/export`,
};
