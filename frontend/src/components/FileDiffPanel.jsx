import React, { useState } from "react";
import { FileUp, GitPullRequest, Code } from "lucide-react";
import { client } from "../api/client";
import { motion } from "framer-motion";

export default function FileDiffPanel({ auditId }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await client.uploadDiff(auditId, file);
      setDiff(res.diff);
    } catch (err) {
      console.error(err);
      setDiff("Failed to compute CSS diff file.");
    } finally {
      setLoading(false);
    }
  };

  const renderDiffLines = () => {
    if (!diff) return null;
    return diff.split("\n").map((line, idx) => {
      let lineStyle = "text-zinc-500";
      if (line.startsWith("+") && !line.startsWith("+++")) {
        lineStyle = "bg-emerald-950/20 text-emerald-450 border-l-2 border-emerald-500 pl-2 py-0.5 font-semibold";
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        lineStyle = "bg-rose-950/20 text-rose-450 border-l-2 border-rose-500 pl-2 py-0.5 font-semibold";
      } else if (line.startsWith("@@")) {
        lineStyle = "text-cyan-400 font-bold font-mono py-0.5";
      }
      return (
        <div key={idx} className={`font-mono text-2xs whitespace-pre-wrap ${lineStyle}`}>
          {line}
        </div>
      );
    });
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl max-w-6xl mx-auto my-8 px-4 text-zinc-100">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center space-x-2">
          <GitPullRequest className="h-5 w-5 text-emerald-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-200">Production stylesheet patch diff</h3>
        </div>
        <span className="text-4xs text-zinc-550 font-black uppercase tracking-widest">
          Compare user stylesheet lines against rule overrides
        </span>
      </div>

      <div className="bg-zinc-950/40 border border-zinc-900 p-5 rounded-xl flex flex-col md:flex-row items-center gap-4 mb-6 justify-between">
        <div className="flex-1">
          <h4 className="text-xs font-bold text-zinc-250 uppercase tracking-wide">Upload stylesheet CSS file</h4>
          <p className="text-3xs text-zinc-500 mt-1 font-semibold uppercase tracking-wider">
            Select stylesheet (e.g. <code>global.css</code>) to see unified git diff patches.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <input
            type="file"
            accept=".css"
            onChange={handleFileChange}
            disabled={loading}
            className="text-3xs font-extrabold uppercase text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-4xs file:font-black file:uppercase file:bg-zinc-900 file:text-zinc-300 hover:file:bg-zinc-800 cursor-pointer"
          />
          <button
            type="button"
            onClick={handleUpload}
            disabled={loading || !file}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-900 disabled:text-zinc-750 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition active:scale-[0.98]"
          >
            <FileUp className="h-4 w-4" />
            <span>{loading ? "Computing Diff..." : "Generate Diff"}</span>
          </button>
        </div>
      </div>

      {diff && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 max-h-[350px] overflow-y-auto space-y-0.5"
        >
          <div className="flex items-center space-x-1 text-4xs font-black text-zinc-500 uppercase tracking-widest mb-2.5 pb-1 border-b border-zinc-900">
            <Code className="h-4 w-4 text-emerald-400" />
            <span>Unified Diff Patch</span>
          </div>
          {renderDiffLines()}
        </motion.div>
      )}
    </div>
  );
}
