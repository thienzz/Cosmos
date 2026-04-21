import { useState, useEffect, useRef } from "react";

// ============================================================
// CONCEPT B: "OBSERVATORY" — Panel-Based Professional
// Structured panels, data-rich sidebars, scientific app layout
// ============================================================

const COLORS = {
  deepSpace: "#0a0a1a",
  cosmicBlue: "#2563eb",
  nebulaPurple: "#8b5cf6",
  supernovaGold: "#f59e0b",
  auroraGreen: "#10b981",
  solarOrange: "#f97316",
  redGiant: "#ef4444",
  panelBg: "rgba(15, 23, 42, 0.92)",
  border: "rgba(37, 99, 235, 0.15)",
  surfaceHover: "rgba(37, 99, 235, 0.08)",
};

function StarField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = canvas.offsetWidth * 2);
    const h = (canvas.height = canvas.offsetHeight * 2);
    ctx.fillStyle = "#060610";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 1.2 + 0.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.6 + 0.1})`;
      ctx.fill();
    }
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
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
    { r: 40, size: 4, color: "#9ca3af", speed: 4.2 },
    { r: 62, size: 6, color: "#f59e0b", speed: 3.1 },
    { r: 88, size: 7, color: "#3b82f6", speed: 2.5 },
    { r: 112, size: 5, color: "#ef4444", speed: 2.0 },
    { r: 150, size: 14, color: "#d97706", speed: 1.2 },
    { r: 190, size: 12, color: "#eab308", speed: 0.9 },
    { r: 225, size: 8, color: "#67e8f9", speed: 0.6 },
    { r: 255, size: 7, color: "#6366f1", speed: 0.4 },
  ];
  return (
    <svg viewBox="-280 -280 560 560" style={{ width: "100%", height: "100%", position: "absolute" }}>
      <circle cx="0" cy="0" r="15" fill="#fbbf24" opacity="0.85" />
      {planets.map((p, i) => {
        const angle = time * p.speed + i * 0.7;
        return (
          <g key={i}>
            <ellipse cx="0" cy="0" rx={p.r} ry={p.r * 0.38} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            <circle cx={Math.cos(angle) * p.r} cy={Math.sin(angle) * p.r * 0.38} r={p.size / 2} fill={p.color} opacity="0.8" />
          </g>
        );
      })}
    </svg>
  );
}

function PanelSection({ title, children, color, collapsed, onToggle }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "rgba(255,255,255,0.02)",
          cursor: "pointer",
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          color: color || "#64748b",
          borderLeft: `2px solid ${color || "#334155"}`,
          userSelect: "none",
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: 10, color: "#475569" }}>{collapsed ? "▸" : "▾"}</span>
      </div>
      {!collapsed && <div style={{ padding: "12px 16px" }}>{children}</div>}
    </div>
  );
}

function DataRow({ label, value, mono }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit", fontSize: mono ? 11 : 12, color: "#cbd5e1" }}>{value}</span>
    </div>
  );
}

function ToggleSwitch({ label, active, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0" }}>
      <span style={{ fontSize: 12, color: "#94a3b8" }}>{label}</span>
      <div style={{
        width: 32, height: 18, borderRadius: 9, background: active ? `${color}55` : "rgba(255,255,255,0.08)",
        border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`, position: "relative", cursor: "pointer", transition: "all 0.2s",
      }}>
        <div style={{
          width: 12, height: 12, borderRadius: "50%", background: active ? color : "#475569",
          position: "absolute", top: 2, left: active ? 16 : 2, transition: "left 0.2s",
        }} />
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 16px", fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: "inherit",
      background: active ? "rgba(37,99,235,0.12)" : "transparent", color: active ? COLORS.cosmicBlue : "#64748b",
      border: "none", borderBottom: active ? `2px solid ${COLORS.cosmicBlue}` : "2px solid transparent",
      cursor: "pointer", transition: "all 0.15s",
    }}>
      {label}
    </button>
  );
}

export default function ConceptBObservatory() {
  const [leftTab, setLeftTab] = useState("catalog");
  const [collapsed, setCollapsed] = useState({});
  const [rightTab, setRightTab] = useState("details");

  const toggle = (k) => setCollapsed((c) => ({ ...c, [k]: !c[k] }));

  const categories = [
    { icon: "⭐", name: "Stars", count: 16, color: COLORS.supernovaGold },
    { icon: "🪨", name: "Rocky Planets", count: 7, color: COLORS.solarOrange },
    { icon: "🌀", name: "Gas Giants", count: 9, color: "#d97706" },
    { icon: "🌙", name: "Moons", count: 6, color: "#94a3b8" },
    { icon: "☄️", name: "Small Bodies", count: 11, color: "#78716c" },
    { icon: "🌌", name: "Nebulae", count: 6, color: COLORS.nebulaPurple },
    { icon: "🔮", name: "Galaxies", count: 17, color: COLORS.cosmicBlue },
    { icon: "🕸", name: "Large-Scale", count: 7, color: COLORS.auroraGreen },
    { icon: "⚡", name: "Exotic", count: 17, color: COLORS.redGiant },
  ];

  return (
    <div style={{
      position: "relative", width: "100%", height: "100vh", overflow: "hidden",
      fontFamily: "'Inter', system-ui, sans-serif", color: "#e2e8f0", background: COLORS.deepSpace,
      display: "flex", flexDirection: "column",
    }}>
      {/* === TOP BAR — Full width, structured === */}
      <div style={{
        height: 48, background: COLORS.panelBg, borderBottom: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", padding: "0 16px", gap: 16, flexShrink: 0, zIndex: 20,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>✦</span>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>COSMOS</span>
          <span style={{ fontSize: 10, color: "#475569", fontWeight: 400, marginLeft: 4 }}>EXPLORER</span>
        </div>
        <div style={{ width: 1, height: 24, background: COLORS.border }} />
        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 2 }}>
          {["Explorer", "Educator", "Creator", "Observer", "Research"].map((m, i) => (
            <button key={m} style={{
              padding: "6px 12px", fontSize: 11, fontWeight: i === 0 ? 600 : 400, fontFamily: "inherit",
              background: i === 0 ? "rgba(37,99,235,0.12)" : "transparent", borderRadius: 6,
              color: i === 0 ? COLORS.cosmicBlue : "#64748b", border: "none", cursor: "pointer",
            }}>
              {m}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)",
          border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 12px", width: 260,
        }}>
          <span style={{ fontSize: 13, opacity: 0.5 }}>🔍</span>
          <span style={{ fontSize: 12, color: "#475569" }}>Search entities... (⌘K)</span>
        </div>
        {/* Right icons */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 14, cursor: "pointer", opacity: 0.5 }}>📷</span>
          <span style={{ fontSize: 14, cursor: "pointer", opacity: 0.5 }}>🔗</span>
          <span style={{ fontSize: 14, cursor: "pointer", opacity: 0.5 }}>❓</span>
          <span style={{ fontSize: 14, cursor: "pointer", opacity: 0.5 }}>⚙</span>
        </div>
      </div>

      {/* === MAIN BODY — Three columns === */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* LEFT SIDEBAR — Catalog browser */}
        <div style={{
          width: 280, background: COLORS.panelBg, borderRight: `1px solid ${COLORS.border}`,
          display: "flex", flexDirection: "column", flexShrink: 0,
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}` }}>
            <TabButton label="Catalog" active={leftTab === "catalog"} onClick={() => setLeftTab("catalog")} />
            <TabButton label="Tours" active={leftTab === "tours"} onClick={() => setLeftTab("tours")} />
            <TabButton label="Bookmarks" active={leftTab === "bookmarks"} onClick={() => setLeftTab("bookmarks")} />
          </div>
          {/* Category list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {leftTab === "catalog" && categories.map((cat, i) => (
              <PanelSection
                key={i}
                title={`${cat.icon}  ${cat.name} (${cat.count})`}
                color={cat.color}
                collapsed={collapsed[cat.name] !== false ? true : false}
                onToggle={() => toggle(cat.name)}
              >
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {cat.count} entity types with toggle features
                </div>
                {i === 1 && !collapsed[cat.name] && (
                  <div style={{ marginTop: 8 }}>
                    {["Mercury-type", "Venus-type", "Earth-type", "Mars-type", "Super-Earth", "Lava World", "Ocean World"].map((e, j) => (
                      <div key={j} style={{
                        padding: "6px 10px", fontSize: 12, color: j === 2 ? COLORS.cosmicBlue : "#94a3b8",
                        borderRadius: 6, cursor: "pointer", background: j === 2 ? "rgba(37,99,235,0.08)" : "transparent",
                        marginBottom: 2, display: "flex", justifyContent: "space-between",
                      }}>
                        <span>{e}</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#475569" }}>
                          ENT-{2000 + j + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </PanelSection>
            ))}
            {leftTab === "tours" && (
              <div style={{ padding: 16 }}>
                {["Solar System 101", "Life Cycle of Stars", "Galactic Zoo", "Cosmic Scale Journey", "Black Hole Safari"].map((t, i) => (
                  <div key={i} style={{
                    padding: "12px 14px", borderRadius: 8, marginBottom: 6, cursor: "pointer",
                    background: i === 0 ? "rgba(37,99,235,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${i === 0 ? COLORS.cosmicBlue + "30" : "rgba(255,255,255,0.04)"}`,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: i === 0 ? COLORS.cosmicBlue : "#cbd5e1" }}>{t}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{5 + i * 2} waypoints • ~{3 + i} min</div>
                  </div>
                ))}
              </div>
            )}
            {leftTab === "bookmarks" && (
              <div style={{ padding: 16, textAlign: "center", color: "#475569", fontSize: 13, marginTop: 32 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>★</div>
                No bookmarks yet.<br />Click ★ on any object to save it.
              </div>
            )}
          </div>
          {/* Stats footer */}
          <div style={{
            padding: "10px 16px", borderTop: `1px solid ${COLORS.border}`, fontSize: 10,
            color: "#475569", display: "flex", justifyContent: "space-between",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <span>96 entities</span>
            <span>~2,477 features</span>
            <span>9 categories</span>
          </div>
        </div>

        {/* CENTER — 3D Viewport */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <StarField />
          <SolarSystemViz />

          {/* Breadcrumb bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 36,
            background: "rgba(15,23,42,0.7)", borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", padding: "0 16px", gap: 6, fontSize: 12, zIndex: 5,
            backdropFilter: "blur(8px)",
          }}>
            <span style={{ color: COLORS.cosmicBlue, cursor: "pointer" }}>Observable Universe</span>
            <span style={{ color: "#334155" }}>›</span>
            <span style={{ color: COLORS.cosmicBlue, cursor: "pointer" }}>Milky Way</span>
            <span style={{ color: "#334155" }}>›</span>
            <span style={{ color: COLORS.cosmicBlue, cursor: "pointer" }}>Solar System</span>
            <span style={{ color: "#334155" }}>›</span>
            <span style={{ color: "#e2e8f0" }}>Earth</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#475569" }}>
              Scale 3/9 • 1 AU
            </span>
          </div>

          {/* Concept label */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", zIndex: 2, pointerEvents: "none" }}>
            <div style={{ fontSize: 10, letterSpacing: 4, color: "#475569", textTransform: "uppercase", marginBottom: 8 }}>Concept B</div>
            <div style={{ fontSize: 28, fontWeight: 200, color: "rgba(255,255,255,0.12)", letterSpacing: 8 }}>OBSERVATORY</div>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 6 }}>Panel-Based Professional</div>
          </div>

          {/* Bottom toolbar */}
          <div style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 5,
            display: "flex", gap: 4, background: COLORS.panelBg, borderRadius: 10, padding: 4,
            border: `1px solid ${COLORS.border}`, backdropFilter: "blur(8px)",
          }}>
            {[
              { icon: "⏪", label: "Rewind" },
              { icon: "⏸", label: "Pause" },
              { icon: "⏩", label: "Forward" },
              { icon: "—", label: "Divider" },
              { icon: "🏷", label: "Labels" },
              { icon: "🔲", label: "Orbits" },
              { icon: "🌫", label: "Atmosphere" },
              { icon: "📏", label: "Grid" },
            ].map((b, i) => b.icon === "—" ? (
              <div key={i} style={{ width: 1, margin: "4px 4px", background: COLORS.border }} />
            ) : (
              <button key={i} title={b.label} style={{
                width: 36, height: 36, borderRadius: 8, background: "transparent", border: "none",
                color: "#94a3b8", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: "inherit",
              }}>
                {b.icon}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT SIDEBAR — Object details */}
        <div style={{
          width: 340, background: COLORS.panelBg, borderLeft: `1px solid ${COLORS.border}`,
          display: "flex", flexDirection: "column", flexShrink: 0,
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}` }}>
            <TabButton label="Details" active={rightTab === "details"} onClick={() => setRightTab("details")} />
            <TabButton label="Features" active={rightTab === "features"} onClick={() => setRightTab("features")} />
            <TabButton label="Compare" active={rightTab === "compare"} onClick={() => setRightTab("compare")} />
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {rightTab === "details" && (
              <>
                {/* Object header */}
                <div style={{
                  padding: "20px 16px 16px",
                  background: "linear-gradient(180deg, rgba(37,99,235,0.08), transparent)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: "linear-gradient(135deg, #3b82f6, #1e40af)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                    }}>
                      🌍
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>Earth</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Rocky Planet • ENT-2003</div>
                    </div>
                  </div>
                </div>

                {/* Orbital data */}
                <PanelSection title="Physical Properties" color={COLORS.cosmicBlue} collapsed={false} onToggle={() => {}}>
                  <DataRow label="Mass" value="5.972 × 10²⁴ kg" mono />
                  <DataRow label="Radius" value="6,371 km" mono />
                  <DataRow label="Density" value="5.514 g/cm³" mono />
                  <DataRow label="Surface Gravity" value="9.807 m/s²" mono />
                  <DataRow label="Escape Velocity" value="11.186 km/s" mono />
                </PanelSection>

                <PanelSection title="Orbital Elements" color={COLORS.supernovaGold} collapsed={collapsed.orbital !== false ? true : false} onToggle={() => toggle("orbital")}>
                  <DataRow label="Semi-major axis" value="1.000 AU" mono />
                  <DataRow label="Eccentricity" value="0.0167" mono />
                  <DataRow label="Inclination" value="0.000°" mono />
                  <DataRow label="Period" value="365.256 days" mono />
                </PanelSection>

                <PanelSection title="Atmosphere" color={COLORS.auroraGreen} collapsed={collapsed.atmo !== false ? true : false} onToggle={() => toggle("atmo")}>
                  <DataRow label="N₂" value="78.08%" mono />
                  <DataRow label="O₂" value="20.95%" mono />
                  <DataRow label="Ar" value="0.93%" mono />
                  <DataRow label="CO₂" value="0.04%" mono />
                </PanelSection>
              </>
            )}

            {rightTab === "features" && (
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 12 }}>25 toggle features for Earth-type</div>
                <ToggleSwitch label="Atmosphere" active={true} color={COLORS.auroraGreen} />
                <ToggleSwitch label="Cloud Layer" active={true} color={COLORS.cosmicBlue} />
                <ToggleSwitch label="Ocean Specular" active={true} color={COLORS.cosmicBlue} />
                <ToggleSwitch label="Night Lights" active={false} color={COLORS.supernovaGold} />
                <ToggleSwitch label="Axial Tilt Indicator" active={false} color={COLORS.nebulaPurple} />
                <ToggleSwitch label="Magnetic Field Lines" active={false} color={COLORS.redGiant} />
                <ToggleSwitch label="Tectonic Plates" active={false} color={COLORS.solarOrange} />
                <ToggleSwitch label="Rotation Animation" active={true} color={COLORS.auroraGreen} />
                <ToggleSwitch label="Aurora Borealis" active={false} color={COLORS.auroraGreen} />
                <ToggleSwitch label="Moon Orbit" active={true} color="#94a3b8" />
              </div>
            )}

            {rightTab === "compare" && (
              <div style={{ padding: 16, textAlign: "center", color: "#475569", fontSize: 13, marginTop: 32 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⊞</div>
                Select two objects to compare.<br />Right-click → "Add to comparison"
              </div>
            )}
          </div>

          {/* Actions footer */}
          <div style={{
            padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`,
            display: "flex", gap: 8,
          }}>
            <button style={{
              flex: 1, padding: "10px 0", borderRadius: 8, fontFamily: "inherit",
              background: `linear-gradient(135deg, ${COLORS.cosmicBlue}, #1d4ed8)`,
              border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              Fly to Earth →
            </button>
            <button style={{
              padding: "10px 14px", borderRadius: 8, fontFamily: "inherit",
              background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.border}`,
              color: "#9ca3af", fontSize: 14, cursor: "pointer",
            }}>
              ★
            </button>
            <button style={{
              padding: "10px 14px", borderRadius: 8, fontFamily: "inherit",
              background: "rgba(255,255,255,0.05)", border: `1px solid ${COLORS.border}`,
              color: "#9ca3af", fontSize: 14, cursor: "pointer",
            }}>
              🔗
            </button>
          </div>
        </div>
      </div>

      {/* === STATUS BAR — Bottom === */}
      <div style={{
        height: 28, background: "rgba(15,23,42,0.95)", borderTop: `1px solid ${COLORS.border}`,
        display: "flex", alignItems: "center", padding: "0 16px", gap: 20,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#475569", flexShrink: 0,
      }}>
        <span>FPS: <span style={{ color: COLORS.auroraGreen }}>60</span></span>
        <span>Draw Calls: <span style={{ color: "#94a3b8" }}>142</span></span>
        <span>Triangles: <span style={{ color: "#94a3b8" }}>2.4M</span></span>
        <span>VRAM: <span style={{ color: "#94a3b8" }}>384 MB</span></span>
        <div style={{ flex: 1 }} />
        <span>Three.js r184</span>
        <span>WebGL 2.0</span>
        <span>ICRS J2000.0</span>
      </div>
    </div>
  );
}
