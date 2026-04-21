import { useState, useEffect, useRef, useMemo } from "react";

/*
 * COSMOS EXPLORER — HORIZON Pro Mockup
 * High-fidelity interactive prototype with 6 color themes
 */

const THEMES = {
  cosmic: {
    name: "Cosmic Blue",
    primary: "#3b82f6",
    primaryGlow: "rgba(59,130,246,0.6)",
    primarySoft: "rgba(59,130,246,0.12)",
    primaryBorder: "rgba(59,130,246,0.25)",
    secondary: "#8b5cf6",
    secondaryGlow: "rgba(139,92,246,0.4)",
    accent: "#06b6d4",
    accentSoft: "rgba(6,182,212,0.15)",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    gradient: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    gradientWide: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 40%, #8b5cf6 100%)",
    ring1: "rgba(59,130,246,0.08)",
    ring2: "rgba(139,92,246,0.06)",
    ring3: "rgba(6,182,212,0.07)",
    bg: "#030712",
    surface: "rgba(15,23,42,0.80)",
    surfaceBright: "rgba(30,41,59,0.60)",
  },
  emerald: {
    name: "Emerald Nebula",
    primary: "#10b981",
    primaryGlow: "rgba(16,185,129,0.6)",
    primarySoft: "rgba(16,185,129,0.12)",
    primaryBorder: "rgba(16,185,129,0.25)",
    secondary: "#14b8a6",
    secondaryGlow: "rgba(20,184,166,0.4)",
    accent: "#84cc16",
    accentSoft: "rgba(132,204,22,0.15)",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    gradient: "linear-gradient(135deg, #10b981, #14b8a6)",
    gradientWide: "linear-gradient(135deg, #064e3b 0%, #10b981 40%, #14b8a6 100%)",
    ring1: "rgba(16,185,129,0.08)",
    ring2: "rgba(20,184,166,0.06)",
    ring3: "rgba(132,204,22,0.07)",
    bg: "#020d08",
    surface: "rgba(6,30,20,0.80)",
    surfaceBright: "rgba(15,45,35,0.60)",
  },
  solar: {
    name: "Solar Flare",
    primary: "#f59e0b",
    primaryGlow: "rgba(245,158,11,0.6)",
    primarySoft: "rgba(245,158,11,0.12)",
    primaryBorder: "rgba(245,158,11,0.25)",
    secondary: "#f97316",
    secondaryGlow: "rgba(249,115,22,0.4)",
    accent: "#ef4444",
    accentSoft: "rgba(239,68,68,0.15)",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
    gradientWide: "linear-gradient(135deg, #78350f 0%, #f59e0b 40%, #f97316 100%)",
    ring1: "rgba(245,158,11,0.08)",
    ring2: "rgba(249,115,22,0.06)",
    ring3: "rgba(239,68,68,0.07)",
    bg: "#0a0603",
    surface: "rgba(30,20,8,0.80)",
    surfaceBright: "rgba(50,35,15,0.60)",
  },
  crimson: {
    name: "Crimson Void",
    primary: "#ef4444",
    primaryGlow: "rgba(239,68,68,0.6)",
    primarySoft: "rgba(239,68,68,0.12)",
    primaryBorder: "rgba(239,68,68,0.25)",
    secondary: "#ec4899",
    secondaryGlow: "rgba(236,72,153,0.4)",
    accent: "#f97316",
    accentSoft: "rgba(249,115,22,0.15)",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    gradient: "linear-gradient(135deg, #ef4444, #ec4899)",
    gradientWide: "linear-gradient(135deg, #7f1d1d 0%, #ef4444 40%, #ec4899 100%)",
    ring1: "rgba(239,68,68,0.08)",
    ring2: "rgba(236,72,153,0.06)",
    ring3: "rgba(249,115,22,0.07)",
    bg: "#0a0304",
    surface: "rgba(30,10,12,0.80)",
    surfaceBright: "rgba(50,18,22,0.60)",
  },
  violet: {
    name: "Violet Storm",
    primary: "#8b5cf6",
    primaryGlow: "rgba(139,92,246,0.6)",
    primarySoft: "rgba(139,92,246,0.12)",
    primaryBorder: "rgba(139,92,246,0.25)",
    secondary: "#a855f7",
    secondaryGlow: "rgba(168,85,247,0.4)",
    accent: "#ec4899",
    accentSoft: "rgba(236,72,153,0.15)",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    gradient: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    gradientWide: "linear-gradient(135deg, #3b0764 0%, #8b5cf6 40%, #a855f7 100%)",
    ring1: "rgba(139,92,246,0.08)",
    ring2: "rgba(168,85,247,0.06)",
    ring3: "rgba(236,72,153,0.07)",
    bg: "#06030d",
    surface: "rgba(20,10,35,0.80)",
    surfaceBright: "rgba(35,20,55,0.60)",
  },
  cyan: {
    name: "Cyan Aurora",
    primary: "#06b6d4",
    primaryGlow: "rgba(6,182,212,0.6)",
    primarySoft: "rgba(6,182,212,0.12)",
    primaryBorder: "rgba(6,182,212,0.25)",
    secondary: "#0ea5e9",
    secondaryGlow: "rgba(14,165,233,0.4)",
    accent: "#10b981",
    accentSoft: "rgba(16,185,129,0.15)",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    gradient: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
    gradientWide: "linear-gradient(135deg, #083344 0%, #06b6d4 40%, #0ea5e9 100%)",
    ring1: "rgba(6,182,212,0.08)",
    ring2: "rgba(14,165,233,0.06)",
    ring3: "rgba(16,185,129,0.07)",
    bg: "#020a0d",
    surface: "rgba(8,25,32,0.80)",
    surfaceBright: "rgba(12,38,48,0.60)",
  },
};

// ── Animated starfield ──
function StarCanvas({ theme }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = 2;
    c.width = c.offsetWidth * dpr;
    c.height = c.offsetHeight * dpr;
    const w = c.width, h = c.height;

    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    // Nebula clouds
    const drawCloud = (cx, cy, rx, ry, color) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
      g.addColorStop(0, color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCloud(w * 0.7, h * 0.3, w * 0.35, h * 0.25, theme.ring1);
    drawCloud(w * 0.2, h * 0.65, w * 0.25, h * 0.2, theme.ring2);
    drawCloud(w * 0.5, h * 0.5, w * 0.15, h * 0.15, theme.ring3);

    // Stars with color variation
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() < 0.05 ? Math.random() * 2 + 1 : Math.random() * 1 + 0.2;
      const brightness = Math.random() * 0.7 + 0.3;
      const colors = ["255,255,255", "200,220,255", "255,230,200", "180,200,255"];
      const col = colors[Math.floor(Math.random() * colors.length)];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col},${brightness})`;
      ctx.fill();
      // Glow for brighter stars
      if (r > 1.2) {
        const sg = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
        sg.addColorStop(0, `rgba(${col},0.15)`);
        sg.addColorStop(1, "transparent");
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.arc(x, y, r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [theme]);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

// ── Animated solar system ──
function SolarSystem({ theme }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => { setT(p => p + 0.002); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const planets = [
    { r: 52, sz: 3.5, color: "#a1a1aa", speed: 4.5, glow: 0 },
    { r: 78, sz: 5, color: "#fbbf24", speed: 3.2, glow: 0.1 },
    { r: 110, sz: 5.5, color: "#3b82f6", speed: 2.5, glow: 0.2, ring: true },
    { r: 142, sz: 4.5, color: "#ef4444", speed: 1.8, glow: 0.1 },
    { r: 195, sz: 13, color: "#d97706", speed: 1.0, glow: 0.25, hasStripes: true },
    { r: 245, sz: 11, color: "#eab308", speed: 0.7, glow: 0.2, saturnRing: true },
    { r: 290, sz: 7.5, color: "#67e8f9", speed: 0.45, glow: 0.15 },
    { r: 330, sz: 7, color: "#818cf8", speed: 0.3, glow: 0.15 },
  ];

  return (
    <svg viewBox="-380 -260 760 520" style={{
      position: "absolute", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)",
      width: "82%", height: "82%", zIndex: 1,
    }}>
      <defs>
        <radialGradient id="sunGlow">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
          <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glowStrong">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Sun */}
      <circle cx="0" cy="0" r="28" fill="url(#sunGlow)" filter="url(#glowStrong)" />
      <circle cx="0" cy="0" r="14" fill="#fde68a" />
      <circle cx="0" cy="0" r="10" fill="#fef3c7" />

      {planets.map((p, i) => {
        const angle = t * p.speed + i * 0.85;
        const x = Math.cos(angle) * p.r;
        const y = Math.sin(angle) * p.r * 0.38;
        const depth = Math.sin(angle) * 0.38;
        return (
          <g key={i} style={{ opacity: 0.5 + depth * 0.5 + 0.3 }}>
            <ellipse cx="0" cy="0" rx={p.r} ry={p.r * 0.38}
              fill="none" stroke={theme.primaryBorder} strokeWidth="0.4"
              strokeDasharray="4 3" opacity="0.3" />
            {p.glow > 0 && (
              <circle cx={x} cy={y} r={p.sz * 2.5} fill={p.color} opacity={p.glow * 0.3} filter="url(#glow)" />
            )}
            {p.saturnRing && (
              <ellipse cx={x} cy={y} rx={p.sz * 2.2} ry={p.sz * 0.5}
                fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.5"
                transform={`rotate(-15, ${x}, ${y})`} />
            )}
            <circle cx={x} cy={y} r={p.sz} fill={p.color} />
            {p.ring && (
              <circle cx={x} cy={y} r={p.sz + 1.5} fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity="0.5" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── HUD Rotating Ring ──
function HudRing({ size, speed, color, opacity = 0.06, dashes }) {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => { setAngle(a => a + speed); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed]);
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{
      position: "absolute", top: "50%", left: "50%",
      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      pointerEvents: "none", zIndex: 0,
    }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth="0.6" opacity={opacity}
        strokeDasharray={dashes || `${c * 0.02} ${c * 0.01}`} />
    </svg>
  );
}

// ── Arc gauge ──
function ArcGauge({ value, max, label, unit, color, size = 58 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.72;
  const gap = circ - arc;
  const filled = arc * (value / max);
  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.04)" strokeWidth="3"
          strokeDasharray={`${arc} ${gap}`} strokeLinecap="round"
          transform={`rotate(140, ${size / 2}, ${size / 2})`} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          transform={`rotate(140, ${size / 2}, ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        <text x={size / 2} y={size / 2 - 1} textAnchor="middle" fill="#f1f5f9"
          fontSize="13" fontWeight="700" fontFamily="'JetBrains Mono', monospace">{value}</text>
        <text x={size / 2} y={size / 2 + 11} textAnchor="middle" fill="rgba(255,255,255,0.35)"
          fontSize="8" fontFamily="Inter, sans-serif">{unit}</text>
      </svg>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: -2, letterSpacing: 1, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ── Main ──
export default function HorizonPro() {
  const [themeId, setThemeId] = useState("cosmic");
  const T = THEMES[themeId];
  const [showPanel, setShowPanel] = useState(true);
  const [activeFeatures, setActiveFeatures] = useState({ Atmosphere: true, Clouds: true, Oceans: true, "Night Lights": false, Rotation: true, Aurora: false, "Magnetic Field": false, "Moon Orbit": true });

  const toggleFeature = (f) => setActiveFeatures(prev => ({ ...prev, [f]: !prev[f] }));

  return (
    <div style={{
      position: "relative", width: "100%", height: "100vh", overflow: "hidden",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      color: "#e2e8f0", background: T.bg,
    }}>
      <StarCanvas theme={T} />
      <SolarSystem theme={T} />

      {/* HUD Rings */}
      <HudRing size={520} speed={0.08} color={T.primary} opacity={0.06} />
      <HudRing size={550} speed={-0.05} color={T.secondary} opacity={0.04} dashes="12 6 3 6" />
      <HudRing size={400} speed={0.12} color={T.accent} opacity={0.05} dashes="2 8" />
      <HudRing size={620} speed={0.03} color={T.primary} opacity={0.03} dashes="1 12" />

      {/* Corner brackets */}
      {["top-left","top-right","bottom-left","bottom-right"].map(pos => {
        const [v, h] = pos.split("-");
        return <div key={pos} style={{
          position: "absolute", [v]: 10, [h]: 10, width: 24, height: 24,
          [`border${v === "top" ? "Top" : "Bottom"}`]: `1px solid ${T.primaryBorder}`,
          [`border${h === "left" ? "Left" : "Right"}`]: `1px solid ${T.primaryBorder}`,
          pointerEvents: "none", zIndex: 2,
        }} />;
      })}

      {/* ═══ TOP HUD ═══ */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
        padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `linear-gradient(180deg, ${T.bg}ee, ${T.bg}00)`,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: T.primarySoft, border: `1px solid ${T.primaryBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 20px ${T.ring1}`,
          }}>
            <span style={{ fontSize: 16, filter: `drop-shadow(0 0 4px ${T.primaryGlow})` }}>✦</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 3, lineHeight: 1 }}>COSMOS</div>
            <div style={{ fontSize: 9, color: T.primary, letterSpacing: 2, fontWeight: 600, marginTop: 1 }}>COMMAND CENTER</div>
          </div>
          <div style={{
            marginLeft: 8, padding: "5px 14px", borderRadius: 4,
            background: T.primarySoft, border: `1px solid ${T.primaryBorder}`,
            fontSize: 10, fontWeight: 700, color: T.primary, letterSpacing: 1.5,
            boxShadow: `0 0 12px ${T.ring1}`,
          }}>EXPLORER MODE</div>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.03)", border: `1px solid ${T.primaryBorder}`,
          borderRadius: 28, padding: "9px 22px", width: 340,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03)`,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>Search 96 entity types...</span>
          <span style={{
            marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4,
          }}>⌘K</span>
        </div>

        {/* Gauges */}
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <ArcGauge value={60} max={60} label="FPS" unit="fps" color={T.success} />
          <ArcGauge value={384} max={1024} label="VRAM" unit="MB" color={T.accent} />
          <ArcGauge value={3} max={9} label="SCALE" unit="level" color={T.warning} />
        </div>
      </div>

      {/* ═══ LEFT HUD TOOLS ═══ */}
      <div style={{
        position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", zIndex: 20,
        display: "flex", flexDirection: "column", gap: 3,
        background: T.surface, backdropFilter: "blur(16px)",
        border: `1px solid ${T.primaryBorder}`, borderRadius: 14, padding: 6,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}>
        {[
          { icon: "🎯", label: "TOUR", active: true, color: T.warning },
          { icon: "🏷️", label: "LABELS", active: true, color: T.success },
          { icon: "◎", label: "ORBITS", active: true, color: T.primary },
          { icon: "🔊", label: "AUDIO", active: false },
          { icon: "⊞", label: "COMPARE", active: false },
          { icon: "📸", label: "CAPTURE", active: false },
          { icon: "⚙️", label: "CONFIG", active: false },
        ].map((b, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "9px 8px", borderRadius: 10, cursor: "pointer", minWidth: 56,
            background: b.active ? `${(b.color || T.primary)}10` : "transparent",
            border: `1px solid ${b.active ? (b.color || T.primary) + "30" : "transparent"}`,
            transition: "all 0.2s",
          }}>
            <span style={{
              fontSize: 16,
              filter: b.active ? `drop-shadow(0 0 6px ${b.color || T.primary})` : "none",
            }}>{b.icon}</span>
            <span style={{
              fontSize: 8, fontWeight: b.active ? 700 : 500, letterSpacing: 0.8,
              color: b.active ? (b.color || T.primary) : "rgba(255,255,255,0.25)",
            }}>{b.label}</span>
          </div>
        ))}
      </div>

      {/* ═══ RIGHT DETAIL PANEL ═══ */}
      {showPanel && (
        <div style={{
          position: "absolute", right: 18, top: 82, width: 310, zIndex: 20,
          background: T.surface, backdropFilter: "blur(20px)",
          border: `1px solid ${T.primaryBorder}`, borderRadius: 16,
          overflow: "hidden",
          boxShadow: `0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}>
          {/* Top glow line */}
          <div style={{
            height: 2, background: T.gradient,
            boxShadow: `0 0 12px ${T.primaryGlow}`,
          }} />

          {/* Header */}
          <div style={{
            padding: "18px 18px 14px",
            background: `linear-gradient(135deg, ${T.primarySoft}, ${T.ring2})`,
            borderBottom: `1px solid ${T.primaryBorder}`,
          }}>
            <div style={{
              fontSize: 9, color: T.primary, letterSpacing: 2, fontWeight: 700, marginBottom: 6,
              textShadow: `0 0 12px ${T.primaryGlow}`,
            }}>TARGET ACQUIRED</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.1 }}>Earth</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3, fontWeight: 400 }}>
                  Rocky Planet • Solar System
                </div>
              </div>
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 800,
                color: T.primary, padding: "5px 12px", borderRadius: 6,
                background: T.primarySoft, border: `1px solid ${T.primaryBorder}`,
                boxShadow: `0 0 8px ${T.ring1}`,
              }}>ENT-2003</div>
            </div>
          </div>

          {/* Data grid */}
          <div style={{
            padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "10px 20px",
          }}>
            {[
              ["MASS", "5.97×10²⁴ kg"],
              ["RADIUS", "6,371 km"],
              ["DISTANCE", "1.000 AU"],
              ["TEMP", "288 K"],
              ["MOONS", "1"],
              ["GRAVITY", "9.81 m/s²"],
            ].map(([k, v], i) => (
              <div key={i}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: 1, fontWeight: 600, marginBottom: 3 }}>{k}</div>
                <div style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "#f1f5f9", fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Toggle features */}
          <div style={{ padding: "10px 18px 14px", borderTop: `1px solid ${T.primaryBorder}` }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>ACTIVE FEATURES</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {Object.entries(activeFeatures).map(([f, on]) => (
                <span key={f} onClick={() => toggleFeature(f)} style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                  fontWeight: on ? 600 : 400, transition: "all 0.2s",
                  background: on ? `${T.success}12` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${on ? T.success + "30" : "rgba(255,255,255,0.06)"}`,
                  color: on ? T.success : "rgba(255,255,255,0.25)",
                  boxShadow: on ? `0 0 8px ${T.success}15` : "none",
                }}>
                  {on ? "●" : "○"} {f}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: "8px 18px 16px", display: "flex", gap: 8 }}>
            <button style={{
              flex: 1, padding: "12px 0", borderRadius: 10,
              background: T.gradient, border: "none",
              color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
              fontFamily: "inherit", letterSpacing: 1, textTransform: "uppercase",
              boxShadow: `0 4px 20px ${T.primaryGlow}`,
              transition: "all 0.2s",
            }}>▸ NAVIGATE</button>
            <button style={{
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(255,255,255,0.03)", border: `1px solid ${T.primaryBorder}`,
              color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer",
            }}>★</button>
            <button style={{
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(255,255,255,0.03)", border: `1px solid ${T.primaryBorder}`,
              color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer",
            }}>⊞</button>
          </div>
        </div>
      )}

      {/* ═══ BOTTOM HUD ═══ */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20,
        background: `linear-gradient(0deg, ${T.bg}ee, ${T.bg}00)`,
        padding: "36px 28px 18px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            {["Observable Universe", "Milky Way", "Solar System", "Earth"].map((s, i, a) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  color: i === a.length - 1 ? "#f1f5f9" : T.primary,
                  fontWeight: i === a.length - 1 ? 700 : 400,
                  cursor: i < a.length - 1 ? "pointer" : "default",
                  textShadow: i === a.length - 1 ? "none" : `0 0 8px ${T.ring1}`,
                }}>{s}</span>
                {i < a.length - 1 && <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 10 }}>›</span>}
              </span>
            ))}
          </div>

          {/* Scale dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {["1AU", "1ly", "100ly", "1kpc", "10kpc", "1Mpc", "100Mpc", "1Gpc", "46Gly"].map((s, i) => {
              const active = i <= 2;
              const current = i === 2;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: active ? 10 : 6, height: active ? 10 : 6, borderRadius: "50%",
                    background: active ? T.primary : "rgba(255,255,255,0.08)",
                    boxShadow: current ? `0 0 12px ${T.primaryGlow}, 0 0 4px ${T.primary}` : "none",
                    border: current ? `2px solid ${T.primary}` : "none",
                    transition: "all 0.3s",
                  }} />
                  <span style={{
                    fontSize: 8, fontFamily: "JetBrains Mono, monospace",
                    color: active ? T.primary : "rgba(255,255,255,0.15)", fontWeight: current ? 700 : 400,
                  }}>{s}</span>
                </div>
              );
            })}
          </div>

          {/* Coordinates */}
          <div style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 11,
            color: "rgba(255,255,255,0.3)", textAlign: "right", lineHeight: 1.8,
          }}>
            <div>RA: <span style={{ color: "rgba(255,255,255,0.55)" }}>06h 45m 08.9s</span></div>
            <div>Dec: <span style={{ color: "rgba(255,255,255,0.55)" }}>−16° 42′ 58″</span></div>
            <div>Dist: <span style={{ color: T.primary, textShadow: `0 0 8px ${T.ring1}` }}>1.000 AU</span></div>
          </div>
        </div>
      </div>

      {/* ═══ CATEGORY PILLS — bottom left ═══ */}
      <div style={{
        position: "absolute", bottom: 85, left: 28, zIndex: 20,
        display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 320,
      }}>
        {[
          { icon: "⭐", label: "Stars", count: 16, c: T.warning },
          { icon: "🪨", label: "Rocky", count: 7, c: "#f97316" },
          { icon: "🌀", label: "Gas", count: 9, c: "#d97706" },
          { icon: "🌌", label: "Nebulae", count: 6, c: T.secondary },
          { icon: "🔮", label: "Galaxies", count: 17, c: T.primary },
          { icon: "⚡", label: "Exotic", count: 17, c: T.danger },
        ].map((cat, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "6px 12px", borderRadius: 8, fontSize: 11,
            background: T.surface, border: `1px solid ${cat.c}18`,
            cursor: "pointer", color: "rgba(255,255,255,0.5)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 12 }}>{cat.icon}</span>
            <span style={{ fontWeight: 500 }}>{cat.label}</span>
            <span style={{
              fontFamily: "JetBrains Mono, monospace", fontSize: 10,
              color: cat.c, fontWeight: 700,
            }}>{cat.count}</span>
          </div>
        ))}
      </div>

      {/* ═══ THEME SWITCHER ═══ */}
      <div style={{
        position: "absolute", top: 82, left: "50%", transform: "translateX(-50%)",
        zIndex: 30, display: "flex", gap: 6,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(16px)",
        borderRadius: 12, padding: 6,
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}>
        {Object.entries(THEMES).map(([id, theme]) => (
          <button key={id} onClick={() => setThemeId(id)} title={theme.name} style={{
            width: themeId === id ? "auto" : 32, height: 32,
            borderRadius: 8, border: "none", cursor: "pointer",
            background: themeId === id ? theme.gradient : theme.primarySoft,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: themeId === id ? "0 14px" : 0,
            boxShadow: themeId === id ? `0 0 16px ${theme.primaryGlow}` : "none",
            transition: "all 0.3s",
          }}>
            <div style={{
              width: 12, height: 12, borderRadius: "50%",
              background: theme.primary,
              border: `2px solid ${themeId === id ? "#fff" : "transparent"}`,
              boxShadow: `0 0 6px ${theme.primaryGlow}`,
            }} />
            {themeId === id && (
              <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, letterSpacing: 0.5 }}>
                {theme.name}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ ONBOARDING TIP ═══ */}
      <div style={{
        position: "absolute", bottom: 64, left: "50%", transform: "translateX(-50%)",
        zIndex: 20, padding: "10px 24px", borderRadius: 24,
        background: T.surface, border: `1px solid ${T.primaryBorder}`,
        backdropFilter: "blur(12px)", fontSize: 13,
        display: "flex", alignItems: "center", gap: 12,
        boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
        color: "rgba(255,255,255,0.4)",
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: "50%", background: T.primary,
          boxShadow: `0 0 8px ${T.primaryGlow}`,
        }} />
        <span>Drag to rotate · Scroll to zoom · Click any object</span>
        <span style={{ cursor: "pointer", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>✕</span>
      </div>
    </div>
  );
}
