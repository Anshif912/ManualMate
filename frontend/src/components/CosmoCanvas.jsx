import React, { useRef, useEffect } from "react";

export default function CosmoCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let raf, t = 0;
    let W, H, stars = [];

    function init() {
      W = c.width  = window.innerWidth;
      H = c.height = window.innerHeight;
      stars = Array.from({ length: 220 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.7,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random() * 0.65 + 0.2,
        f: Math.random() * 0.018 + 0.003,
        p: Math.random() * Math.PI * 2,
      }));
    }
    init();
    window.addEventListener("resize", init);

    function rr(hex) {
      const h = hex.replace("#","");
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    }
    function rgba(hex, a) { const [r,g,b]=rr(hex); return `rgba(${r},${g},${b},${a})`; }

    function frame() {
      t++;
      ctx.clearRect(0, 0, W, H);

      /* 1 — deep space bg */
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0,    "#000000");
      bg.addColorStop(0.55, "#000000");
      bg.addColorStop(0.78, "#020108");
      bg.addColorStop(1,    "#05020e");
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

      /* 2 — stars */
      for (const s of stars) {
        const al = s.a + Math.sin(t * s.f + s.p) * 0.22;
        ctx.save(); ctx.globalAlpha = Math.max(0.05, Math.min(1, al));
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }

      /* 3 — planet geometry */
      const pCY = H + H * 0.42;
      const pRX = W  * 1.05;
      const pRY = H  * 0.78;
      const rimY = pCY - pRY;

      /* 3a — warm planet surface */
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(W/2, pCY, pRX, pRY, 0, 0, Math.PI*2);
      ctx.clip();
      const surf = ctx.createRadialGradient(W/2, pCY*0.96, 0, W/2, pCY, pRY);
      surf.addColorStop(0,   "rgba(55,20,5,0.98)");
      surf.addColorStop(0.4, "rgba(28,10,3,1)");
      surf.addColorStop(1,   "rgba(4,2,1,1)");
      ctx.fillStyle = surf; ctx.fillRect(0,0,W,H);
      ctx.restore();

      /* 3b — wide colour glow bands */
      const pulse = 1 + Math.sin(t * 0.006) * 0.05;
      function glow(cx, cy, rx, ry, hex, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        const [r,g,b] = rr(hex);
        const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx,ry));
        g2.addColorStop(0,    `rgba(${r},${g},${b},0.95)`);
        g2.addColorStop(0.35, `rgba(${r},${g},${b},0.45)`);
        g2.addColorStop(0.7,  `rgba(${r},${g},${b},0.10)`);
        g2.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx*pulse, ry*pulse, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }

      glow(W*0.12, rimY+H*0.06, W*0.38, H*0.55, "#bf4000", 0.70);
      glow(W*0.22, rimY+H*0.02, W*0.26, H*0.38, "#d86000", 0.55);
      glow(W*0.33, rimY-H*0.01, W*0.18, H*0.28, "#e09000", 0.38);
      glow(W*0.50, rimY+H*0.04, W*0.18, H*0.26, "#1a5530", 0.28);
      glow(W*0.67, rimY-H*0.01, W*0.18, H*0.28, "#00a888", 0.38);
      glow(W*0.78, rimY+H*0.02, W*0.26, H*0.38, "#0060c8", 0.55);
      glow(W*0.88, rimY+H*0.06, W*0.38, H*0.55, "#0030a8", 0.68);

      /* 3c — the bright coloured rim line */
      const rimGrad = ctx.createLinearGradient(0, 0, W, 0);
      rimGrad.addColorStop(0.00, rgba("#962800", 0.90));
      rimGrad.addColorStop(0.07, rgba("#c84000", 1.00));
      rimGrad.addColorStop(0.18, rgba("#e07000", 1.00));
      rimGrad.addColorStop(0.28, rgba("#c89000", 0.92));
      rimGrad.addColorStop(0.38, rgba("#70a800", 0.80));
      rimGrad.addColorStop(0.50, rgba("#10c870", 0.88));
      rimGrad.addColorStop(0.62, rgba("#00c0b0", 0.90));
      rimGrad.addColorStop(0.72, rgba("#0080e8", 0.98));
      rimGrad.addColorStop(0.82, rgba("#1040d0", 1.00));
      rimGrad.addColorStop(0.92, rgba("#3020b0", 0.92));
      rimGrad.addColorStop(1.00, rgba("#5010a0", 0.80));

      for (let i = 0; i < 5; i++) {
        const lw = [28, 16, 8, 3, 1.2][i];
        const al = [0.08, 0.16, 0.40, 0.80, 1.00][i];
        ctx.save();
        ctx.globalAlpha = al;
        ctx.strokeStyle = rimGrad;
        ctx.lineWidth = lw;
        if (i < 3) { ctx.shadowColor = "#fff"; ctx.shadowBlur = [40,20,10][i]; }
        ctx.beginPath();
        ctx.ellipse(W/2, pCY, pRX, pRY, 0, Math.PI, 2*Math.PI);
        ctx.stroke();
        ctx.restore();
      }

      /* 4 — vertical shafts */
      const shafts = [
        { xf:0.09, col:"#a83000", h:0.58, w:0.065, a:0.30, sp:0.9  },
        { xf:0.19, col:"#cc5000", h:0.65, w:0.055, a:0.24, sp:1.1  },
        { xf:0.30, col:"#d07800", h:0.52, w:0.045, a:0.20, sp:0.7  },
        { xf:0.41, col:"#98a000", h:0.42, w:0.038, a:0.15, sp:0.85 },
        { xf:0.55, col:"#009060", h:0.44, w:0.038, a:0.15, sp:1.0  },
        { xf:0.64, col:"#00b0a0", h:0.50, w:0.045, a:0.20, sp:0.75 },
        { xf:0.75, col:"#0070e0", h:0.62, w:0.055, a:0.24, sp:1.05 },
        { xf:0.87, col:"#0038c0", h:0.68, w:0.065, a:0.30, sp:0.92 },
      ];
      for (const [i, sh] of shafts.entries()) {
        const p2 = 1 + Math.sin(t * sh.sp * 0.012 + i * 0.8) * 0.12;
        const sx = W * sh.xf;
        const sy = rimY + H*0.025;
        const sw = W * sh.w;
        const sh2 = H * sh.h * p2;
        ctx.save();
        ctx.globalAlpha = sh.a * p2;
        const [r2,g2,b2] = rr(sh.col);
        const sg = ctx.createLinearGradient(sx, sy, sx, sy - sh2);
        sg.addColorStop(0,   `rgba(${r2},${g2},${b2},1)`);
        sg.addColorStop(0.25,`rgba(${r2},${g2},${b2},0.65)`);
        sg.addColorStop(0.6, `rgba(${r2},${g2},${b2},0.18)`);
        sg.addColorStop(1,   `rgba(${r2},${g2},${b2},0)`);
        ctx.filter = `blur(${sw*0.5}px)`;
        ctx.fillStyle = sg;
        ctx.fillRect(sx - sw/2, sy - sh2, sw, sh2);
        ctx.restore();
      }
      ctx.filter = "none";

      /* 5 — vignettes */
      const vt = ctx.createLinearGradient(0,0,0,H*0.18);
      vt.addColorStop(0,"rgba(0,0,0,0.70)"); vt.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=vt; ctx.fillRect(0,0,W,H*0.18);

      const vl = ctx.createLinearGradient(0,0,W*0.11,0);
      vl.addColorStop(0,"rgba(0,0,0,0.55)"); vl.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=vl; ctx.fillRect(0,0,W*0.11,H);

      const vr = ctx.createLinearGradient(W,0,W*0.89,0);
      vr.addColorStop(0,"rgba(0,0,0,0.55)"); vr.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=vr; ctx.fillRect(W*0.89,0,W*0.11,H);

      raf = requestAnimationFrame(frame);
    }
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, []);

  return <canvas ref={ref} style={{ position:"fixed", inset:0, width:"100%", height:"100%", zIndex:0, pointerEvents:"none", display:"block" }} />;
}
