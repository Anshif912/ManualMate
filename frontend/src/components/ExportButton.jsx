import React from "react";
import { FolderArchive, Printer } from "lucide-react";
import { client } from "../api/client";
import { motion } from "framer-motion";

export default function ExportButton({ auditId }) {
  if (!auditId) return null;

  const handlePrint = (e) => {
    e.preventDefault();
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto my-8 px-4 flex flex-wrap justify-center gap-4 no-print">
      
      <motion.a
        href={client.getExportUrl(auditId)}
        download
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        className="flex items-center space-x-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition cursor-pointer"
      >
        <FolderArchive className="h-5 w-5" />
        <span>Export Deployable fixes.zip</span>
      </motion.a>

      <motion.button
        onClick={handlePrint}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        className="flex items-center space-x-2.5 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition cursor-pointer"
      >
        <Printer className="h-5 w-5 text-emerald-400" />
        <span>Print PDF Report</span>
      </motion.button>

    </div>
  );
}
