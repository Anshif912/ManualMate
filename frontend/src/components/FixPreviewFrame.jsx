import React, { useEffect, useRef } from "react";
import { Monitor } from "lucide-react";
import { motion } from "framer-motion";

export default function FixPreviewFrame({ page, selectedFixesList }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const injectStyles = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      
      let styleTag = doc.getElementById("manualmate-fixes");
      if (!styleTag) {
        styleTag = doc.createElement("style");
        styleTag.id = "manualmate-fixes";
        doc.head.appendChild(styleTag);
      }
      
      const selectors = selectedFixesList.map(f => f.selector).filter(Boolean);
      let transitionCSS = "";
      if (selectors.length > 0) {
        transitionCSS = `${selectors.join(", ")} { \n` +
          `  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important; \n` +
          `  outline: 2px dashed #10b981 !important; \n` +
          `  outline-offset: 2px !important; \n` +
          `}\n`;
      }
      
      const rulesCSS = selectedFixesList.map(f => f.css_rule_text).filter(Boolean).join("\n");
      styleTag.textContent = transitionCSS + rulesCSS;
    };
    
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener("load", injectStyles);
    }
    
    injectStyles();
    
    return () => {
      if (iframe) {
        iframe.removeEventListener("load", injectStyles);
      }
    };
  }, [selectedFixesList, page]);

  if (!page) return null;

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl max-w-6xl mx-auto my-8 px-4 text-zinc-100">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Monitor className="h-5 w-5 text-emerald-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-200">Real-Time Fix Override Sandbox</h3>
        </div>
        <span className="text-4xs bg-zinc-950 border border-zinc-850 px-3 py-1 rounded-md text-zinc-400 font-mono">
          Page: {page.url}
        </span>
      </div>

      <div className="border border-zinc-850 rounded-xl overflow-hidden bg-white h-[450px]">
        <iframe
          ref={iframeRef}
          src={`http://localhost:8000/api/pages/${page.page_id}/html`}
          title="Sandbox Iframe Preview"
          sandbox="allow-same-origin allow-scripts"
          className="w-full h-full border-none bg-white"
        />
      </div>
      <p className="text-4xs text-zinc-550 mt-2 font-semibold">
        💡 Check/uncheck fixes in the issue list cards below to inject styles dynamically. Active elements will overlay an emerald dashed outline.
      </p>
    </div>
  );
}
