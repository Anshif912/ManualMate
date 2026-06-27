import React, { useState } from "react";
import { Play, Globe, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function UrlInput({ onSubmit, loading }) {
  const [url, setUrl] = useState("");
  const [pageLimit, setPageLimit] = useState(10);

  const presets = [
    { label: "Example Domain", url: "https://example.com" },
    { label: "Hacker News", url: "https://news.ycombinator.com" },
    { label: "RFC Editor", url: "https://www.rfc-editor.org" }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url) return;
    
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }
    onSubmit(formattedUrl, pageLimit);
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl max-w-3xl mx-auto my-8 text-zinc-100">
      <div className="flex items-center space-x-3 mb-6">
        <Activity className="h-8 w-8 text-emerald-400 animate-pulse shrink-0" />
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-100">UX & Accessibility Multi-Page Auditor</h2>
          <p className="text-4xs text-zinc-550 uppercase tracking-widest font-extrabold mt-0.5">Deterministic DOM heuristics & Local AI assistant pipeline</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-4xs font-black uppercase tracking-widest text-zinc-500 mb-2">Target Website URL</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-650" />
            <input
              type="text"
              placeholder="e.g. https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="w-full pl-12 pr-4 py-3.5 bg-zinc-950/80 border border-zinc-850 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-200 placeholder-zinc-700 text-xs transition"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setUrl(preset.url)}
              disabled={loading}
              className="px-3.5 py-1.5 bg-zinc-950/80 hover:bg-zinc-850 border border-zinc-850 hover:border-zinc-750 rounded-lg text-4xs font-black uppercase text-zinc-400 hover:text-zinc-200 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="bg-zinc-950/40 border border-zinc-850 p-5 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-4xs font-black uppercase tracking-widest text-zinc-400">Discovery Page Limit</span>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-4xs font-black rounded-full">
              {pageLimit} pages max
            </span>
          </div>
          <input
            type="range"
            min="6"
            max="12"
            value={pageLimit}
            onChange={(e) => setPageLimit(parseInt(e.target.value))}
            disabled={loading}
            className="w-full accent-emerald-400 h-1 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-4xs text-zinc-600 mt-2 font-bold tracking-wider">
            <span>6 (Min)</span>
            <span>10 (Default)</span>
            <span>12 (Max)</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !url}
          className="w-full flex items-center justify-center space-x-2 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-900 disabled:text-zinc-750 disabled:cursor-not-allowed text-zinc-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition active:scale-[0.98]"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>{loading ? "Discovering Site structure..." : "Launch Audit Pipeline"}</span>
        </button>
      </form>
    </div>
  );
}
