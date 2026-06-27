import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { client } from "../api/client";
import { Palette, CheckCircle2, XCircle, Loader2, Type } from "lucide-react";

function ColorSwatch({ hex, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={copy}
      className="flex flex-col items-center space-y-1.5 group"
      title={hex}
    >
      <div
        className="w-12 h-12 rounded-xl shadow-lg border border-white/10 relative overflow-hidden"
        style={{ backgroundColor: hex }}
      >
        {copied && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
      <span className="text-3xs text-zinc-500 font-mono">{hex}</span>
      <span className="text-3xs text-zinc-600 font-semibold">{label}</span>
    </motion.button>
  );
}

export default function ThemeRecommendation({ auditId }) {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auditId) return;
    setLoading(true);
    client.getTheme(auditId)
      .then(setTheme)
      .catch(() => setTheme(null))
      .finally(() => setLoading(false));
  }, [auditId]);

  if (loading) return (
    <div className="flex items-center justify-center py-10 text-zinc-500">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm">Detecting industry & theme...</span>
    </div>
  );

  if (!theme) return (
    <div className="text-center py-10 text-zinc-500 text-sm">Theme data unavailable.</div>
  );

  const swatchLabels = ["Primary", "Background", "Accent", "Text", "Surface"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-pink-500/10 border border-pink-500/20 rounded-xl">
            <Palette className="h-4 w-4 text-pink-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Theme Recommendation</h3>
            <p className="text-xs text-zinc-500">Industry-matched accessible color system</p>
          </div>
        </div>
        {theme.wcag_aa_compliant ? (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-3xs text-emerald-400 font-bold">
            <CheckCircle2 className="h-3 w-3" />
            <span>WCAG AA</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-3xs text-rose-400 font-bold">
            <XCircle className="h-3 w-3" />
            <span>Not WCAG AA</span>
          </div>
        )}
      </div>

      {/* Industry badge */}
      <div className="flex items-center space-x-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
        <span className="text-2xl">{theme.emoji}</span>
        <div>
          <p className="text-3xs text-zinc-500 uppercase tracking-wider font-extrabold">Detected Industry</p>
          <p className="text-sm font-black text-white">{theme.label}</p>
        </div>
        <div className="ml-auto">
          <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-black text-zinc-300">
            {theme.palette_name}
          </span>
        </div>
      </div>

      {/* Color swatches */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
        <p className="text-3xs text-zinc-500 uppercase tracking-wider font-extrabold mb-4">Recommended Palette</p>
        <div className="flex justify-between">
          {theme.swatches?.slice(0, 5).map((hex, i) => (
            <ColorSwatch key={hex} hex={hex} label={swatchLabels[i] || `Color ${i+1}`} />
          ))}
        </div>
      </div>

      {/* Preview card */}
      <div
        className="rounded-xl p-5 border border-white/10 shadow-xl overflow-hidden relative"
        style={{ backgroundColor: theme.secondary_color }}
      >
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, ${theme.primary_color} 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, ${theme.accent_color} 0%, transparent 40%)`
        }} />
        <div className="relative space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: theme.primary_color }} />
            <div>
              <p className="text-xs font-black" style={{ color: theme.text_color }}>
                Your Brand
              </p>
              <p className="text-3xs" style={{ color: theme.text_color, opacity: 0.6 }}>
                Preview with {theme.fonts[0]} font
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: theme.text_color, opacity: 0.8 }}>
            {theme.description}
          </p>
          <div className="flex space-x-2">
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-black"
              style={{ backgroundColor: theme.primary_color, color: theme.secondary_color }}
            >
              Primary Button
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-bold border"
              style={{ borderColor: theme.primary_color, color: theme.primary_color }}
            >
              Secondary
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Type className="h-3.5 w-3.5 text-zinc-400" />
          <p className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Recommended Typography</p>
        </div>
        <div className="flex space-x-3">
          {theme.fonts.map((font) => (
            <div key={font} className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-center">
              <p className="text-sm font-black text-white" style={{ fontFamily: font }}>{font}</p>
              <p className="text-3xs text-zinc-500 mt-1">
                {theme.fonts.indexOf(font) === 0 ? "UI / Body" : "Code / Accent"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
