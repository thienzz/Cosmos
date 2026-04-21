import { useState, useEffect, useRef } from "react";

// ============================================================
// CONCEPT A: "NEBULA" — Minimal Immersive
// Maximum viewport space, floating translucent controls,
// cinematic feel with glassmorphism
// ============================================================

const COLORS = {
  deepSpace: "#0a0a1a",
  cosmicBlue: "#2563eb",
  nebulaPurple: "#8b5cf6",
  supernovaGold: "#f59e0b",
  auroraGreen: "#10b981",
  solarOrange: "#f97316",
  redGiant: "#ef4444",
  glass: "rgba(15, 23, 42, 0.75)",
  glassBorder: "rgba(37, 99, 235, 0.2)",
};

// Star background
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
    // Static stars
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 1.5 + 0.3;
      const a = Math.random() * 0.8 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
    }
    // Nebula glow
    const grd = ctx.createRadialGradient(w * 0.65, h * 0.35, 0, w * 0.65, h * 0.35, w * 0.4);
    grd.addColorStop(0, "rgba(139,92,246,0.08)");
    grd.addColorStop(0.5, "rgba(37,99,235,0.04)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    const grd2 = ctx.createRadialGradient(w * 0.25, h * 0.7, 0, w * 0.25, h * 0.7, w * 0.3);
    grd2.addColorStop(0, "rgba(245,158,11,0.05)");
    grd2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd2;
    ctx.fillRect(0, 0, w, h);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
    />
  );
}

// Orbiting planet system (center of viewport)
function SolarSystemViz() {
  const [time, setTime] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => {
      setTime((t) => t + 0.004);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const planets = [
    { r: 50, size: 5, color: "#9ca3af", speed: 4.2, name: "Mercury" },
    { r: 75, size: 7, color: "#f59e0b", speed: 3.1, name: "Venus" },
    { r: 105, size: 8, color: "#3b82f6", speed: 2.5, name: "Earth" },
    { r: 135, size: 6, color: "#ef4444", speed: 2.0, name: "Mars" },
    { r: 180, size: 16, color: "#d97706", speed: 1.2, name: "Jupiter" },
    { r: 225, size: 14, color: "#eab308", speed: 0.9, name: "Saturn" },
    { r: 265, size: 10, color: "#67e8f9", speed: 0.6, name: "Uranus" },
    { r: 300, size: 9, color: "#6366f1", speed: 0.4, name: "Neptune" },
  ];

  return (
    <svg
      viewBox="-340 -340 680 680"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(90vw, 680px)",
        height: "min(90vh, 680px)",
        zIndex: 1,
        opacity: 0.9,
      }}
    >
      {/* Sun */}
      <circle cx="0" cy="0" r="18" fill="#fbbf24" opacity="0.9" />
      <circle cx="0" cy="0" r="24" fill="none" stroke="#fbbf24" strokeWidth="0.5" opacity="0.3" />
      {/* Orbits & planets */}
      {planets.map((p, i) => {
        const angle = time * p.speed + i * 0.8;
        const x = Math.cos(angle) * p.r;
        const y = Math.sin(angle) * p.r * 0.4; // perspective
        return (
          <g key={i}>
            <ellipse
              cx="0"
              cy="0"
              rx={p.r}
              ry={p.r * 0.4}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="0.5"
            />
            <circle cx={x} cy={y} r={p.size / 2} fill={p.color} opacity="0.85" />
          </g>
        );
      })}
    </svg>
  );
}

// Glassmorphic card
function Glass({ children, style, className, onClick, hover }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: COLORS.glass,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${hovered && hover ? "rgba(37,99,235,0.5)" : COLORS.glassBorder}`,
        borderRadius: 12,
        transition: "all 0.3s ease",
        transform: hovered && hover ? "scale(1.02)" : "scale(1)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Floating action button
function Fab({ icon, label, color, onClick, active }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: active ? `${color}33` : "rgba(15,23,42,0.6)",
        border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
        color: active ? color : "#9ca3af",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: 18,
        transition: "all 0.2s",
        backdropFilter: "blur(8px)",
      }}
    >
      {icon}
    </button>
  );
}

export default function ConceptANebula() {
  const [selectedPlanet, setSelectedPlanet] = useState("Earth");
  const [showInfo, setShowInfo] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [activeMode, setActiveMode] = useState("explorer");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showScaleBar, setShowScaleBar] = useState(true);

  const modes = [
    { id: "explorer", label: "Explorer", icon: "🔭", color: COLORS.cosmicBlue },
    { id: "educator", label: "Educator", icon: "📚", color: COLORS.auroraGreen },
    { id: "creator", label: "Creator", icon: "🎬", color: COLORS.nebulaPurple },
    { id: "observer", label: "Observer", icon: "📊", color: COLORS.supernovaGold },
    { id: "research", label: "Research", icon: "🔬", color: COLORS.redGiant },
  ];

  const planetData = {
    Earth: {
      type: "Rocky Planet",
      mass: "5.972 × 10²⁴ kg",
      radius: "6,371 km",
      distance: "1.0 AU",
      temp: "288 K (15°C)",
      moons: "1",
      entId: "ENT-2003",
    },
    Jupiter: {
      type: "Gas Giant",
      mass: "1.898 × 10²⁷ kg",
      radius: "69,911 km",
      distance: "5.2 AU",
      temp: "165 K (-108°C)",
      moons: "95",
      entId: "ENT-2201",
    },
  };

  const info = planetData[selectedPlanet] || planetData.Earth;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#e2e8f0",
        background: COLORS.deepSpace,
      }}
    >
      <StarField />
      <SolarSystemViz />

      {/* === TOP NAV — Ultra minimal, floating === */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* Logo + mode */}
        <Glass style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 12, pointerEvents: "auto" }}>
          <span style={{ fontSize: 20 }}>✦</span>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: 1 }}>COSMOS</span>
          <div
            style={{
              marginLeft: 8,
              padding: "3px 10px",
              borderRadius: 20,
              background: `${modes.find((m) => m.id === activeMode).color}22`,
              border: `1px solid ${modes.find((m) => m.id === activeMode).color}44`,
              fontSize: 11,
              fontWeight: 500,
              color: modes.find((m) => m.id === activeMode).color,
              cursor: "pointer",
              position: "relative",
            }}
            onClick={() => setShowModeMenu(!showModeMenu)}
          >
            {modes.find((m) => m.id === activeMode).icon} {modes.find((m) => m.id === activeMode).label}
          </div>
        </Glass>

        {/* Search */}
        <Glass
          style={{
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: showSearch ? 320 : 44,
            transition: "min-width 0.3s",
            pointerEvents: "auto",
          }}
        >
          <span
            style={{ cursor: "pointer", fontSize: 16, opacity: 0.7 }}
            onClick={() => setShowSearch(!showSearch)}
          >
            🔍
          </span>
          {showSearch && (
            <input
              autoFocus
              placeholder="Search 96 entity types..."
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "#e2e8f0",
                fontSize: 14,
                width: "100%",
                fontFamily: "inherit",
              }}
            />
          )}
        </Glass>

        {/* Right controls */}
        <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
          <Fab icon="📷" label="Screenshot" color={COLORS.cosmicBlue} />
          <Fab icon="🔗" label="Share" color={COLORS.nebulaPurple} />
          <Fab icon="⚙" label="Settings" color="#9ca3af" />
        </div>
      </div>

      {/* === MODE DROPDOWN === */}
      {showModeMenu && (
        <Glass
          style={{
            position: "absolute",
            top: 64,
            left: 16,
            zIndex: 20,
            padding: 8,
            width: 200,
          }}
        >
          {modes.map((m) => (
            <div
              key={m.id}
              onClick={() => {
                setActiveMode(m.id);
                setShowModeMenu(false);
              }}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: activeMode === m.id ? `${m.color}18` : "transparent",
                border: activeMode === m.id ? `1px solid ${m.color}33` : "1px solid transparent",
                fontSize: 13,
                fontWeight: activeMode === m.id ? 600 : 400,
                color: activeMode === m.id ? m.color : "#9ca3af",
                transition: "all 0.15s",
              }}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </div>
          ))}
        </Glass>
      )}

      {/* === SCALE BREADCRUMB — Bottom left === */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 16,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "#64748b",
        }}
      >
        <span style={{ cursor: "pointer", color: COLORS.cosmicBlue }}>Observable Universe</span>
        <span>›</span>
        <span style={{ cursor: "pointer", color: COLORS.cosmicBlue }}>Milky Way</span>
        <span>›</span>
        <span style={{ cursor: "pointer", color: COLORS.cosmicBlue }}>Solar System</span>
        <span>›</span>
        <span style={{ color: "#e2e8f0" }}>{selectedPlanet}</span>
      </div>

      {/* === SCALE SLIDER — Bottom center === */}
      <Glass
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 11,
        }}
      >
        <span style={{ color: "#64748b" }}>1 AU</span>
        <div
          style={{
            width: 240,
            height: 3,
            background: "rgba(255,255,255,0.1)",
            borderRadius: 2,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "15%",
              top: -5,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: COLORS.cosmicBlue,
              border: "2px solid #fff",
              cursor: "pointer",
            }}
          />
        </div>
        <span style={{ color: "#64748b" }}>46.5 Gly</span>
        <span style={{ color: "#475569", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
          Scale 3/9
        </span>
      </Glass>

      {/* === FLOATING TOOL BUTTONS — Left edge === */}
      <div
        style={{
          position: "absolute",
          left: 16,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <Fab icon="🎯" label="Tour" color={COLORS.supernovaGold} active />
        <Fab icon="🏷" label="Labels" color={COLORS.auroraGreen} active />
        <Fab icon="🔲" label="Orbits" color={COLORS.cosmicBlue} active />
        <Fab
          icon="ℹ"
          label="Info Panel"
          color={COLORS.nebulaPurple}
          active={showInfo}
          onClick={() => setShowInfo(!showInfo)}
        />
        <Fab icon="⊞" label="Compare" color={COLORS.solarOrange} />
      </div>

      {/* === OBJECT SELECTOR — Bottom right quick access === */}
      <div
        style={{
          position: "absolute",
          bottom: 72,
          right: 16,
          zIndex: 10,
          display: "flex",
          gap: 6,
        }}
      >
        {["Earth", "Jupiter"].map((p) => (
          <Glass
            key={p}
            hover
            onClick={() => setSelectedPlanet(p)}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: selectedPlanet === p ? 600 : 400,
              color: selectedPlanet === p ? COLORS.cosmicBlue : "#9ca3af",
              border: selectedPlanet === p
                ? `1px solid ${COLORS.cosmicBlue}55`
                : `1px solid ${COLORS.glassBorder}`,
              cursor: "pointer",
            }}
          >
            {p}
          </Glass>
        ))}
      </div>

      {/* === INFO PANEL — Right side, floating, minimal === */}
      {showInfo && (
        <Glass
          style={{
            position: "absolute",
            top: 80,
            right: 16,
            width: 320,
            zIndex: 10,
            padding: 0,
            overflow: "hidden",
          }}
        >
          {/* Header gradient */}
          <div
            style={{
              padding: "20px 20px 16px",
              background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(139,92,246,0.1))",
              borderBottom: `1px solid ${COLORS.glassBorder}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>
                  {selectedPlanet}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{info.type}</div>
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  color: COLORS.cosmicBlue,
                  background: `${COLORS.cosmicBlue}15`,
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: `1px solid ${COLORS.cosmicBlue}30`,
                }}
              >
                {info.entId}
              </div>
            </div>
          </div>
          {/* Data rows */}
          <div style={{ padding: "12px 20px 20px" }}>
            {[
              ["Mass", info.mass],
              ["Radius", info.radius],
              ["Distance", info.distance],
              ["Surface Temp", info.temp],
              ["Moons", info.moons],
            ].map(([k, v], i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "#64748b", fontWeight: 400 }}>{k}</span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: "#e2e8f0",
                  }}
                >
                  {v}
                </span>
              </div>
            ))}
            {/* Toggle features preview */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                Toggle Features
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Atmosphere", "Clouds", "Oceans", "Night Lights", "Rotation"].map((f, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      background: i < 3 ? `${COLORS.auroraGreen}18` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${i < 3 ? `${COLORS.auroraGreen}30` : "rgba(255,255,255,0.08)"}`,
                      color: i < 3 ? COLORS.auroraGreen : "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    {i < 3 ? "✓ " : ""}{f}
                  </span>
                ))}
              </div>
            </div>
            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${COLORS.cosmicBlue}, #1d4ed8)`,
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Fly Here →
              </button>
              <button
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#9ca3af",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ★
              </button>
            </div>
          </div>
        </Glass>
      )}

      {/* === CONCEPT LABEL === */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 5,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#475569", textTransform: "uppercase", marginBottom: 8 }}>
          Concept A
        </div>
        <div style={{ fontSize: 28, fontWeight: 200, color: "rgba(255,255,255,0.15)", letterSpacing: 8 }}>
          NEBULA
        </div>
        <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>Minimal Immersive</div>
      </div>

      {/* === ONBOARDING TOOLTIP === */}
      <Glass
        style={{
          position: "absolute",
          bottom: 120,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 13,
          maxWidth: 400,
        }}
      >
        <span style={{ fontSize: 18 }}>💡</span>
        <span style={{ color: "#94a3b8" }}>
          Drag to rotate • Scroll to zoom • Click any object for details
        </span>
        <span style={{ cursor: "pointer", color: "#475569", marginLeft: 8 }}>✕</span>
      </Glass>
    </div>
  );
}
