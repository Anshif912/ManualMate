import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Network, AlertCircle, CheckCircle2 } from "lucide-react";

const NODE_R = 22;
const W = 680, H = 400;
const CENTER = { x: W / 2, y: H / 2 };

function scoreColor(score) {
  if (score == null || score < 0) return "#71717a";
  if (score >= 90) return "#10b981"; // emerald
  if (score >= 70) return "#eab308"; // yellow/amber
  return "#f43f5e"; // rose
}

function forceLayout(nodes, edges, iterations = 120) {
  const pos = nodes.map((_, i) => ({
    x: CENTER.x + Math.cos((i / nodes.length) * 2 * Math.PI) * 180 + Math.random() * 20,
    y: CENTER.y + Math.sin((i / nodes.length) * 2 * Math.PI) * 160 + Math.random() * 20,
    vx: 0,
    vy: 0,
  }));

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations;

    // Repulsion
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[i].x - pos[j].x;
        const dy = pos[i].y - pos[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (3500 / (dist * dist)) * cooling;
        pos[i].vx += (dx / dist) * force;
        pos[i].vy += (dy / dist) * force;
        pos[j].vx -= (dx / dist) * force;
        pos[j].vy -= (dy / dist) * force;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const si = nodes.findIndex(n => n.id === edge.source);
      const ti = nodes.findIndex(n => n.id === edge.target);
      if (si < 0 || ti < 0) continue;
      const dx = pos[ti].x - pos[si].x;
      const dy = pos[ti].y - pos[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const k = 0.04 * cooling;
      pos[si].vx += dx * k;
      pos[si].vy += dy * k;
      pos[ti].vx -= dx * k;
      pos[ti].vy -= dy * k;
    }

    // Apply velocity + clamp
    for (let i = 0; i < pos.length; i++) {
      pos[i].x = Math.max(NODE_R + 10, Math.min(W - NODE_R - 10, pos[i].x + pos[i].vx));
      pos[i].y = Math.max(NODE_R + 10, Math.min(H - NODE_R - 10, pos[i].y + pos[i].vy));
      pos[i].vx *= 0.6;
      pos[i].vy *= 0.6;
    }
  }
  return pos;
}

function truncateUrl(url) {
  try {
    const u = new URL(url);
    const p = u.pathname.replace(/\/$/, "") || "/";
    return p.length > 16 ? `…${p.slice(-14)}` : p;
  } catch { return url.slice(0, 16); }
}

export default function NavigationGraph({ pages, activePageId, onPageSelect }) {
  const [tooltip, setTooltip] = useState(null);

  const { nodes, edges, positions } = useMemo(() => {
    if (!pages || pages.length === 0) return { nodes: [], edges: [], positions: [] };

    // Build nodes — support both page_id and id properties
    const nodes = pages.map(p => ({
      id: p.page_id || p.id,
      url: p.url,
      score: p.page_score,
      label: truncateUrl(p.url),
    }));

    // Build edges from crawl order (page 1 links to 2, 2 to 3, etc.)
    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({ source: nodes[i].id, target: nodes[i + 1].id });
    }

    const positions = forceLayout(nodes, edges);
    return { nodes, edges, positions };
  }, [pages]);

  if (!nodes.length) {
    return (
      <div className="glass-card p-8 text-center text-zinc-500">
        <Network className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-xs font-semibold uppercase tracking-widest">Navigation graph will appear after crawl completes.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/2 to-transparent pointer-events-none" />
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-zinc-950/40">
        <div className="flex items-center space-x-2">
          <Network className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-extrabold text-zinc-300 uppercase tracking-widest">Navigation Graph</span>
        </div>
        <div className="flex items-center space-x-4 text-5xs font-black uppercase tracking-widest text-zinc-500">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Excellent (≥90)
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Minor (70–89)
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Poor (&lt;70)
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 380 }}>
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="18" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.12)" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const si = nodes.findIndex(n => n.id === edge.source);
          const ti = nodes.findIndex(n => n.id === edge.target);
          if (si < 0 || ti < 0 || !positions[si] || !positions[ti]) return null;
          return (
            <line
              key={i}
              x1={positions[si].x} y1={positions[si].y}
              x2={positions[ti].x} y2={positions[ti].y}
              stroke="rgba(255,255,255,0.06)" strokeWidth={1.5}
              markerEnd="url(#arrow)"
              strokeOpacity={0.8}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          if (!positions[i]) return null;
          const { x, y } = positions[i];
          const isActive = node.id === activePageId;
          const color = scoreColor(node.score);

          return (
            <g key={node.id} onClick={() => onPageSelect?.(node.id)} className="cursor-pointer" style={{ userSelect: "none" }}>
              {isActive && (
                <circle cx={x} cy={y} r={NODE_R + 6} fill="none" stroke={color} strokeWidth={1.5} opacity={0.4} />
              )}
              <motion.circle
                cx={x} cy={y} r={NODE_R}
                fill={`${color}12`}
                stroke={color}
                strokeWidth={isActive ? 2.5 : 1.5}
                whileHover={{ r: NODE_R + 3 }}
                onMouseEnter={() => setTooltip({ x, y, node })}
                onMouseLeave={() => setTooltip(null)}
              />
              <text x={x} y={y - 2} textAnchor="middle" fill="white" fontSize={9} fontWeight="900">
                {node.score != null && node.score >= 0 ? node.score : "?"}
              </text>
              <text x={x} y={y + 11} textAnchor="middle" fill="#71717a" fontSize={7.5} fontWeight="bold" className="uppercase tracking-widest">
                {node.label}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <foreignObject x={Math.min(tooltip.x - 100, W - 220)} y={Math.max(tooltip.y - 80, 4)} width="220" height="70">
            <div xmlns="http://www.w3.org/1999/xhtml"
              className="bg-zinc-950/95 border border-white/10 rounded-xl px-3 py-2 text-5xs shadow-2xl pointer-events-none backdrop-blur leading-relaxed">
              <p className="text-white font-extrabold truncate mb-1 uppercase tracking-wider">{tooltip.node.url}</p>
              <p className="text-zinc-500 font-bold uppercase tracking-widest">
                Score: <span className="text-emerald-400 font-black">{tooltip.node.score != null && tooltip.node.score >= 0 ? `${tooltip.node.score}/100` : "—"}</span>
              </p>
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
}
