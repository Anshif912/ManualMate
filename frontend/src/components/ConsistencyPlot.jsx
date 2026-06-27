import React, { useEffect, useState } from "react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell, ZAxis, Label } from "recharts";
import { GitBranch, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function ConsistencyPlot({ auditId, onElementSelect }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auditId) return;
    
    fetch(`http://localhost:8000/api/audits/${auditId}/consistency`)
      .then(res => res.json())
      .then(items => {
        setData(items);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching consistency data:", err);
        setLoading(false);
      });
  }, [auditId]);

  if (loading) {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl max-w-6xl mx-auto my-8 h-64 flex items-center justify-center text-zinc-400 text-xs font-semibold">
        Loading consistency finger print analysis...
      </div>
    );
  }

  if (data.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-zinc-950 border border-zinc-900 p-3.5 rounded-xl shadow-2xl text-4xs space-y-1 text-zinc-350 max-w-[250px] leading-relaxed">
          <p className="font-bold text-zinc-150 truncate">Selector: {item.selector}</p>
          <p className="truncate text-zinc-500">Page: {item.url}</p>
          <p>Border Radius: <span className="font-bold text-zinc-200">{item.borderRadius.toFixed(1)}px</span></p>
          <p>Font Size: <span className="font-bold text-zinc-200">{item.fontSize.toFixed(1)}px</span></p>
          <p>Padding: <span className="font-bold text-zinc-200">{item.padding.toFixed(1)}px</span></p>
          {item.isOutlier && (
            <p className="text-rose-450 font-black flex items-center mt-1 uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Outlier Flagged
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const handlePointClick = (point) => {
    if (onElementSelect && point) {
      onElementSelect(point.page_id, point.selector);
    }
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl max-w-6xl mx-auto my-8 px-4 text-zinc-100">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center space-x-2">
          <GitBranch className="h-5 w-5 text-emerald-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-200">Site-Wide Button Consistency Map</h3>
        </div>
        <div className="text-4xs text-zinc-550 font-black uppercase tracking-widest">
          Emerald dots represent medians. Rose dots represent layout outliers.
        </div>
      </div>

      <div className="h-80 w-full bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/60">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
            <XAxis 
              type="number" 
              dataKey="borderRadius" 
              name="Border Radius" 
              unit="px" 
              stroke="#52525b" 
              fontSize={10}
              tickLine={false}
            >
              <Label value="Border Radius (px)" offset={-10} position="insideBottom" fill="#71717a" fontSize={10} />
            </XAxis>
            <YAxis 
              type="number" 
              dataKey="fontSize" 
              name="Font Size" 
              unit="px" 
              stroke="#52525b" 
              fontSize={10}
              tickLine={false}
            >
              <Label value="Font Size (px)" angle={-90} position="insideLeft" offset={0} fill="#71717a" fontSize={10} />
            </YAxis>
            <ZAxis type="number" range={[60, 60]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter 
              data={data} 
              onClick={(node) => handlePointClick(node)}
              className="cursor-pointer"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isOutlier ? "#f43f5e" : "#10b981"} 
                  stroke={entry.isOutlier ? "rgba(244,63,94,0.35)" : "rgba(16,185,129,0.3)"}
                  strokeWidth={entry.isOutlier ? 10 : 4}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
