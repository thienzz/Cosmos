import { useState, useEffect, useRef } from "react";

// ============================================================
// CONCEPT C: "HORIZON" — Radial Command Center
// Futuristic HUD-style, circular/radial elements,
// sci-fi command center inspired
// ============================================================

const COLORS = {
  deepSpace: "#050510",
  cosmicBlue: "#2563eb",
  nebulaPurple: "#8b5cf6",
  supernovaGold: "#f59e0b",
  auroraGreen: "#10b981",
  solarOrange: "#f97316",
  redGiant: "#ef4444",
  cyan: "#06b6d4",
  hudLine: "rgba(37, 99, 235, 0.25)",
  hudGlow: "rgba(37, 99, 235, 0.08)",
};

function StarField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = canvas.offsetWidth * 2);
    const h = (canvas.height = canvas.offsetHeight * 2);
    ctx.fillStyle = COLORS.deepSpace;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 1.3 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5 + 0.1})`;
      ctx.fill();
    }
    // Blue vignette
    const grd = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(5,5,16,0.7)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

function SolarSystemViz() {
  const [time, setTime] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => { setTime((t) => t + 0.003); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const planets = [
    { r: 45, size: 4, color: "#9ca3af", speed: 4.2 },
    { r: 68, size: 6, color: "#f59e0b", speed: 3.1 },
    { r: 95, size: 7, color: "#3b82f6", speed: 2.5 },
    { r: 120, size: 5, color: "#ef4444", speed: 2.0 },
    { r: 160, size: 14, color: "#d97706", speed: 1.2 },
    { r: 200, size: 12, color: "#eab308", speed: 0.9 },
    { r: 235, size: 8, color: "#67e8f9", speed: 0.6 },
    { r: 265, size: 7, color: "#6366f1", speed: 0.4 },
  ];
  return (
    <svg viewBox="-300 -300 600 600" style={{ width: "100%", height: "100%", position: "absolute" }}>
      <circle cx="0" cy="0" r="15" fill="#fbbf24" opacity="0.85" />
      <circle cx="0" cy="0" r="22" fill="none" stroke="#fbbf24" strokeWidth="0.3" opacity="0.2" />
      {planets.map((p, i) => {
        const angle = time * p.speed + i * 0.7;
        return (
          <g key={i}>
            <ellipse cx="0" cy="0" rx={p.r} ry={p.r * 0.38} fill="none" stroke="rgba(37,99,235,0.06)" strokeWidth="0.5" />
            <circle cx={Math.cos(angle) * p.r} cy={Math.sin(angle) * p.r * 0.38} r={p.size / 2} fill={p.color} opacity="0.8" />
          </g>
        );
      })}
    </svg>
  );
}

// HUD ring decorative element
function HudRing({ size, rotation, opacity, color }) {
  const dashArray = `${size * 0.1} ${size * 0.05}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        opacity: opacity || 0.15,
        pointerEvents: "none",
      }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 2}
        fill="none"
        stroke={color || COLORS.cosmicBlue}
        strokeWidth="0.5"
        strokeDasharray={dashArray}
      />
    </svg>
  );
}

// Arc progress indicator
function ArcGauge({ value, max, label, unit, color, size = 64 }) {
  const pct = value / max;
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dashoffset = circ * (1 - pct * 0.75);
  return (
    <div style={{ textAlign: "center", width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeLinecap="round"
          transform={`rotate(135, ${size / 2}, ${size / 2})`} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={dashoffset}
          strokeLinecap="round" transform={`rotate(135, ${size / 2}, ${size / 2})`} opacity="0.8" />
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" fill="#e2e8f0"
          fontSize="12" fontWeight="600" fontFamily="'JetBrains Mono', monospace">
          {value}
        </text>
        <text x={size / 2} y={size / 2 + 10} textAnchor="middle" fill="#475569"
          fontSize="8" fontFamily="'Inter', sans-serif">
          {unit}
        </text>
      </svg>
      <div style={{ fontSize: 9, color: "#64748b", marginTop: -4, letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

// Corner bracket decorative
function CornerBracket({ position }) {
  const isTop = position.includes("top");
  const isLeft = position.includes("left");
  return (
    <div style={{
      position: "absolute",
      [isTop ? "top" : "bottom"]: 8,
      [isLeft ? "left" : "right"]: 8,
      width: 20,
      height: 20,
      borderTop: isTop ? `1px solid ${COLORS.hudLine}` : "none",
      borderBottom: !isTop ? `1px solid ${COLORS.hudLine}` : "none",
      borderLeft: isLeft ? `1px solid ${COLORS.hudLine}` : "none",
      borderRight: !isLeft ? `1px solid ${COLORS.hudLine}` : "none",
      pointerEvents: "none",
    }} />
  );
}

function HudButton({ icon, label, active, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        cursor: "pointer", padding: "8px 6px", borderRadius: 8,
        background: active ? `${color || COLORS.cosmicBlue}12` : "transparent",
        border: active ? `1px solid ${color || COLORS.cosmicBlue}30` : "1px solid transparent",
        transition: "all 0.2s", minWidth: 52,
      }}
    >
      <span style={{ fontSize: 16, filter: active ? `drop-shadow(0 0 4px ${color || COLORS.cosmicBlue})` : "none" }}>{icon}</span>
      <span style={{ fontSize: 9, color: active ? (color || COLORS.cosmicBlue) : "#475569", fontWeight: active ? 600 : 400 }}>{label}</span>
    </div>
  );
}

export default function ConceptCHorizon() {
  const [selectedObj, setSelectedObj] = useState("Earth");
  const [showDetail, setShowDetail] = useState(true);
  const [rotAngle, setRotAngle] = useState(0);

  useEffect(() => {
    let raf;
    const tick = () => { setRotAngle((a) => a + 0.15); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{
      position: "relative", width: "100%", height: "100vh", overflow: "hidden",
      fontFamily: "'Inter', system-ui, sans-serif", color: "#e2e8f0", background: COLORS.deepSpace,
    }}>
      <StarField />
      <SolarSystemViz />

      {/* Decorative HUD rings */}
      <HudRing size={500} rotation={rotAngle} opacity={0.06} color={COLORS.cosmicBlue} />
      <HudRing size={520} rotation={-rotAngle * 0.7} opacity={0.04} color={COLORS.nebulaPurple} />
      <HudRing size={380} rotation={rotAngle * 1.3} opacity={0.05} color={COLORS.cyan} />

      {/* Corner brackets */}
      <CornerBracket position="top-left" />
      <CornerBracket position="top-right" />
      <CornerBracket position="bottom-left" />
      <CornerBracket position="bottom-right" />

      {/* === TOP HUD BAR === */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px",
        background: "linear-gradient(180deg, rgba(5,5,16,0.85), rgba(5,5,16,0))",
      }}>
        {/* Left: Logo + mode */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              border: `1px solid ${COLORS.cosmicBlue}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `${COLORS.cosmicBlue}10`,
            }}>
              <span style={{ fontSize: 14 }}>✦</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>COSMOS</div>
              <div style={{ fontSize: 9, color: COLORS.cosmicBlue, letterSpacing: 1.5, marginTop: -2 }}>COMMAND CENTER</div>
            </div>
          </div>
          <div style={{
            padding: "4px 12px", borderRadius: 4, fontSize: 10, fontWeight: 600,
            background: `${COLORS.cosmicBlue}15`, border: `1px solid ${COLORS.cosmicBlue}30`,
            color: COLORS.cosmicBlue, letterSpacing: 1,
          }}>
            EXPLORER MODE
          </div>
        </div>

        {/* Center: Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.hudLine}`,
          borderRadius: 24, padding: "7px 18px", width: 320,
        }}>
          <span style={{ fontSize: 12, opacity: 0.4 }}>⌕</span>
          <span style={{ fontSize: 12, color: "#334155" }}>Search 96 entity types... ⌘K</span>
        </div>

        {/* Right: Performance gauges */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <ArcGauge value={60} max={60} label="FPS" unit="fps" color={COLORS.auroraGreen} size={52} />
          <ArcGauge value={384} max={1024} label="VRAM" unit="MB" color={COLORS.cyan} size={52} />
          <ArcGauge value={3} max={9} label="SCALE" unit="lvl" color={COLORS.supernovaGold} size={52} />
        </div>
      </div>

      {/* === LEFT HUD — Navigation tools === */}
      <div style={{
        position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", zIndex: 10,
        display: "flex", flexDirection: "column", gap: 4,
        background: "rgba(5,5,16,0.6)", backdropFilter: "blur(8px)",
        border: `1px solid ${COLORS.hudLine}`, borderRadius: 12, padding: 6,
      }}>
        <HudButton icon="🎯" label="TOUR" active color={COLORS.supernovaGold} />
        <HudButton icon="🏷" label="LABELS" active color={COLORS.auroraGreen} />
        <HudButton icon="◎" label="ORBITS" active color={COLORS.cosmicBlue} />
        <HudButton icon="🔊" label="AUDIO" color={COLORS.nebulaPurple} />
        <HudButton icon="⊞" label="COMPARE" color={COLORS.solarOrange} />
        <HudButton icon="📷" label="CAPTURE" color="#94a3b8" />
        <HudButton icon="⚙" label="CONFIG" color="#64748b" />
      </div>

      {/* === BOTTOM HUD — Scale navigation + breadcrumb === */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
        background: "linear-gradient(0deg, rgba(5,5,16,0.85), rgba(5,5,16,0))",
        padding: "32px 24px 16px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
            {["Observable Universe", "Milky Way", "Solar System", "Earth"].map((s, i, arr) => (
              <span key={i}>
                <span style={{
                  color: i === arr.length - 1 ? "#e2e8f0" : COLORS.cosmicBlue,
                  cursor: i < arr.length - 1 ? "pointer" : "default",
                  fontWeight: i === arr.length - 1 ? 600 : 400,
                }}>
                  {s}
                </span>
                {i < arr.length - 1 && <span style={{ color: "#1e293b", margin: "0 4px" }}>›</span>}
              </span>
            ))}
          </div>

          {/* Scale visualization — radial dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: i <= 2 ? 10 : 6, height: i <= 2 ? 10 : 6,
                  borderRadius: "50%",
                  background: i <= 2 ? COLORS.cosmicBlue : "rgba(255,255,255,0.1)",
                  border: i === 2 ? `2px solid ${COLORS.cosmicBlue}` : "none",
                  boxShadow: i === 2 ? `0 0 8px ${COLORS.cosmicBlue}` : "none",
                  transition: "all 0.3s",
                }} />
                <span style={{
                  fontSize: 8, color: i === 2 ? COLORS.cosmicBlue : "#334155",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {["1AU", "1ly", "100ly", "1kpc", "10kpc", "1Mpc", "100Mpc", "1Gpc", "46Gly"][i]}
                </span>
              </div>
            ))}
          </div>

          {/* Coordinates */}
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#475569",
            textAlign: "right", lineHeight: 1.6,
          }}>
            <div>RA: <span style={{ color: "#94a3b8" }}>06h 45m 08.9s</span></div>
            <div>Dec: <span style={{ color: "#94a3b8" }}>-16° 42' 58"</span></div>
            <div>Dist: <span style={{ color: COLORS.cosmicBlue }}>1.000 AU</span></div>
          </div>
        </div>
      </div>

      {/* === RIGHT HUD — Object detail panel === */}
      {showDetail && (
        <div style={{
          position: "absolute", right: 16, top: 80, width: 300, zIndex: 10,
          background: "rgba(5,5,16,0.75)", backdropFilter: "blur(12px)",
          border: `1px solid ${COLORS.hudLine}`, borderRadius: 12,
          overflow: "hidden",
        }}>
          {/* Header with scanning effect */}
          <div style={{
            padding: "16px 16px 12px",
            borderBottom: `1px solid ${COLORS.hudLine}`,
            background: `linear-gradient(135deg, ${COLORS.cosmicBlue}08, ${COLORS.nebulaPurple}06)`,
            position: "relative",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${COLORS.cosmicBlue}40, transparent)`,
            }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 10, color: COLORS.cosmicBlue, letterSpacing: 1.5, fontWeight: 600, marginBottom: 4 }}>
                  TARGET ACQUIRED
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>Earth</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Rocky Planet • Solar System</div>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700,
                color: COLORS.cosmicBlue, padding: "4px 10px", borderRadius: 4,
                background: `${COLORS.cosmicBlue}12`, border: `1px solid ${COLORS.cosmicBlue}25`,
              }}>
                ENT-2003
              </div>
            </div>
          </div>

          {/* Data grid */}
          <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
            {[
              ["Mass", "5.97×10²⁴ kg"],
              ["Radius", "6,371 km"],
              ["Dist.", "1.000 AU"],
              ["Temp.", "288 K"],
              ["Moons", "1"],
              ["Gravity", "9.81 m/s²"],
            ].map(([k, v], i) => (
              <div key={i}>
                <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "#cbd5e1" }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Feature toggles — pill style */}
          <div style={{ padding: "8px 16px 12px", borderTop: `1px solid ${COLORS.hudLine}` }}>
            <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>ACTIVE FEATURES</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {[
                { label: "Atmosphere", on: true },
                { label: "Clouds", on: true },
                { label: "Oceans", on: true },
                { label: "Night Lights", on: false },
                { label: "Rotation", on: true },
                { label: "Aurora", on: false },
              ].map((f, i) => (
                <span key={i} style={{
                  padding: "3px 8px", borderRadius: 4, fontSize: 10, cursor: "pointer",
                  background: f.on ? `${COLORS.auroraGreen}12` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${f.on ? COLORS.auroraGreen + "30" : "rgba(255,255,255,0.06)"}`,
                  color: f.on ? COLORS.auroraGreen : "#475569",
                }}>
                  {f.on ? "● " : "○ "}{f.label}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding: "8px 16px 14px", display: "flex", gap: 6 }}>
            <button style={{
              flex: 1, padding: "10px 0", borderRadius: 6, fontFamily: "inherit",
              background: `linear-gradient(135deg, ${COLORS.cosmicBlue}, ${COLORS.nebulaPurple})`,
              border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
              letterSpacing: 0.5, textTransform: "uppercase",
            }}>
              ▸ Navigate
            </button>
            <button style={{
              padding: "10px 12px", borderRadius: 6, fontFamily: "inherit",
              background: "transparent", border: `1px solid ${COLORS.hudLine}`,
              color: "#64748b", fontSize: 12, cursor: "pointer",
            }}>★</button>
            <button style={{
              padding: "10px 12px", borderRadius: 6, fontFamily: "inherit",
              background: "transparent", border: `1px solid ${COLORS.hudLine}`,
              color: "#64748b", fontSize: 12, cursor: "pointer",
            }}>⊞</button>
          </div>
        </div>
      )}

      {/* === CATEGORY WHEEL — Bottom left === */}
      <div style={{
        position: "absolute", bottom: 80, left: 24, zIndex: 10,
        display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 280,
      }}>
        {[
          { icon: "⭐", label: "Stars", count: 16, color: COLORS.supernovaGold },
          { icon: "🪨", label: "Rocky", count: 7, color: COLORS.solarOrange },
          { icon: "🌀", label: "Gas", count: 9, color: "#d97706" },
          { icon: "🌌", label: "Nebulae", count: 6, color: COLORS.nebulaPurple },
          { icon: "🔮", label: "Galaxies", count: 17, color: COLORS.cosmicBlue },
          { icon: "⚡", label: "Exotic", count: 17, color: COLORS.redGiant },
        ].map((c, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 10px", borderRadius: 6, fontSize: 10,
            background: "rgba(5,5,16,0.5)", border: `1px solid ${c.color}20`,
            cursor: "pointer", color: "#94a3b8",
            backdropFilter: "blur(4px)",
          }}>
            <span>{c.icon}</span>
            <span>{c.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: c.color, fontSize: 9 }}>{c.count}</span>
          </div>
        ))}
      </div>

      {/* === CONCEPT LABEL === */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        textAlign: "center", zIndex: 2, pointerEvents: "none",
      }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#334155", textTransform: "uppercase", marginBottom: 8 }}>Concept C</div>
        <div style={{ fontSize: 28, fontWeight: 200, color: "rgba(255,255,255,0.1)", letterSpacing: 10 }}>HORIZON</div>
        <div style={{ fontSize: 11, color: "#1e293b", marginTop: 6 }}>Radial Command Center</div>
      </div>

      {/* Onboarding */}
      <div style={{
        position: "absolute", bottom: 60, left: "50%", transform: "translateX(-50%)", zIndex: 10,
        padding: "8px 20px", borderRadius: 20, fontSize: 12,
        background: "rgba(5,5,16,0.6)", border: `1px solid ${COLORS.hudLine}`,
        backdropFilter: "blur(8px)", color: "#64748b", display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ color: COLORS.cosmicBlue, fontSize: 8 }}>●</span>
        Drag to rotate • Scroll to zoom • Click any object
        <span style={{ cursor: "pointer", color: "#334155" }}>✕</span>
      </div>
    </div>
  );
}
