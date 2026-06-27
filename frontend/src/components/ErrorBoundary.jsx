import React from "react";

// ─── Widget-level ErrorBoundary ─────────────────────────────────────────────
// Wraps individual dashboard widgets. If one crashes, it shows a minimal
// fallback while keeping the rest of the dashboard functional.
export class WidgetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`[WidgetErrorBoundary] "${this.props.name}" crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "24px",
          borderRadius: 14,
          background: "rgba(220,38,38,0.08)",
          border: "1px solid rgba(220,38,38,0.18)",
          textAlign: "center",
        }}>
          <p style={{ color: "rgba(252,165,165,0.9)", fontSize: 13, fontWeight: 600, margin: 0 }}>
            Unable to load {this.props.name || "this widget"}.
          </p>
          <p style={{ color: "rgba(148,163,184,0.7)", fontSize: 12, margin: "6px 0 12px" }}>
            The remaining dashboard is still available.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "6px 16px",
              background: "rgba(220,38,38,0.15)",
              border: "1px solid rgba(220,38,38,0.3)",
              borderRadius: 8,
              color: "#fca5a5",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Top-level App ErrorBoundary ────────────────────────────────────────────
// Wraps the entire App. Only catches catastrophic crashes outside of
// individual widget boundaries.
export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[AppErrorBoundary] Uncaught crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#06070a",
          color: "#f4f4f5",
          padding: "40px 24px",
          textAlign: "center",
          gap: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(220,38,38,0.12)",
            border: "1px solid rgba(220,38,38,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, marginBottom: 8,
          }}>⚠️</div>

          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#f1f5f9" }}>
            Something went wrong
          </h1>
          <p style={{ color: "rgba(148,163,184,0.8)", fontSize: 14, maxWidth: 420, margin: 0 }}>
            Something went wrong while rendering this audit. Please try again or return to the dashboard.
          </p>
          {this.state.error && (
            <code style={{
              fontSize: 11, color: "rgba(252,165,165,0.7)",
              background: "rgba(0,0,0,0.3)", padding: "8px 14px",
              borderRadius: 8, maxWidth: 500, overflowX: "auto",
              display: "block", textAlign: "left",
            }}>
              {this.state.error.message}
            </code>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              onClick={() => window.location.href = "/"}
              style={{
                padding: "10px 22px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10, color: "rgba(148,163,184,0.9)",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              style={{
                padding: "10px 22px",
                background: "rgba(52,211,153,0.12)",
                border: "1px solid rgba(52,211,153,0.25)",
                borderRadius: 10, color: "#34d399",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              Retry Loading
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
