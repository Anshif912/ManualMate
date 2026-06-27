import React, { useState, useRef } from "react";
import { client } from "../api/client";
import { Image, Crosshair } from "lucide-react";
import { motion } from "framer-motion";

export default function AnnotatedScreenshot({ page, issues, activeIssueId, onIssueSelect }) {
  const [imgSize, setImgSize] = useState({ w: 1280, h: 800 });
  const imgRef = useRef(null);

  if (!page) return null;

  const handleImageLoad = (e) => {
    setImgSize({
      w: e.target.naturalWidth || 1280,
      h: e.target.naturalHeight || 800
    });
  };

  const pageIssues = issues.filter((i) => i.page_id === page.id && i.boundingBox);

  const getSeverityColor = (sev) => {
    if (sev === "critical") return "border-rose-500 bg-rose-500/15";
    if (sev === "serious") return "border-orange-500 bg-orange-500/15";
    if (sev === "moderate") return "border-yellow-500 bg-yellow-500/15";
    return "border-zinc-550 bg-zinc-550/15";
  };

  return (
    <div className="glass-card p-6 shadow-2xl max-w-6xl mx-auto my-8 px-4 text-zinc-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/2 to-transparent pointer-events-none" />
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2.5">
          <Image className="h-5 w-5 text-emerald-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-widest text-zinc-200">Interactive Bounding-Box Visualizer</h3>
        </div>
        <div className="flex space-x-4 text-5xs font-black uppercase tracking-widest text-zinc-500">
          <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-rose-500 mr-1.5 animate-pulse" />Critical</span>
          <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-orange-500 mr-1.5" />Serious</span>
          <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-yellow-500 mr-1.5" />Moderate</span>
        </div>
      </div>

      <div className="relative border border-white/5 rounded-xl overflow-hidden bg-zinc-950 max-h-[500px] overflow-y-auto">
        <div className="relative w-full">
          <img
            ref={imgRef}
            src={client.getStaticUrl(page.screenshot_path)}
            alt="Page audit screenshot"
            onLoad={handleImageLoad}
            className="w-full h-auto block"
          />

          {/* Render bounding box overlays */}
          {pageIssues.map((issue) => {
            const box = issue.boundingBox;
            if (!box || box.width <= 0 || box.height <= 0) return null;

            const left = (box.x / imgSize.w) * 100;
            const top = (box.y / imgSize.h) * 100;
            const width = (box.width / imgSize.w) * 100;
            const height = (box.height / imgSize.h) * 100;

            const isSelected = issue.id === activeIssueId;

            return (
              <motion.div
                key={issue.id}
                onClick={() => onIssueSelect(issue.id)}
                whileHover={{ scale: 1.008 }}
                className={`absolute border-2 cursor-pointer transition-all duration-200 group flex items-start justify-start ${getSeverityColor(
                  issue.severity
                )} ${isSelected ? "ring-2 ring-emerald-400 border-white z-20 scale-[1.01] shadow-lg shadow-emerald-500/20" : "z-10 hover:border-white hover:z-20"}`}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${width}%`,
                  height: `${height}%`
                }}
              >
                {/* Tooltip on hover */}
                <div className="hidden group-hover:block absolute bg-zinc-950/95 border border-white/10 text-5xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-2xl text-zinc-200 top-full left-0 mt-2 max-w-[220px] whitespace-normal pointer-events-none z-30 leading-normal backdrop-blur">
                  {issue.description}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
