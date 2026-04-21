import { useState } from "react";

// ============================================================
// COSMOS EXPLORER — 3 UI/UX CONCEPT COMPARISON
// Switch between Nebula / Observatory / Horizon
// ============================================================

// === Lazy imports via dynamic rendering ===
import ConceptANebula from "./concept-a-nebula";
import ConceptBObservatory from "./concept-b-observatory";
import ConceptCHorizon from "./concept-c-horizon";

const concepts = [
  {
    id: "nebula",
    label: "A — Nebula",
    subtitle: "Minimal Immersive",
    color: "#8b5cf6",
    description: "Maximum viewport. Floating glassmorphic controls hover over full-screen 3D canvas. Info panel slides in/out. Best for: immersive exploration, casual users, cinematic presentations.",
    pros: ["Maximum immersion — 3D viewport fills entire screen", "Floating controls feel weightless and futuristic", "Info panel appears only on demand", "Best for screenshots, videos, presentations", "Mobile-friendly: easily collapsible"],
    cons: ["Less data density — info panel only shows 1 object", "No persistent catalog browsing", "Mode switching buried in dropdown", "Power users may want more persistent panels"],
    Component: ConceptANebula,
  },
  {
    id: "observatory",
    label: "B — Observatory",
    subtitle: "Panel-Based Professional",
    color: "#2563eb",
    description: "Structured 3-column layout: catalog sidebar + 3D viewport + detail panel. Tabbed navigation, status bar with performance metrics. Best for: researchers, educators, data-heavy exploration.",
    pros: ["All 96 entities browsable in persistent sidebar", "Tabbed details panel: Properties / Features / Compare", "Status bar shows FPS, VRAM, draw calls in real-time", "Tour + Bookmark tabs always accessible", "Most familiar layout for desktop apps"],
    cons: ["3D viewport is smaller due to side panels", "Can feel crowded on smaller screens", "Less cinematic — more utilitarian", "May overwhelm first-time casual users"],
    Component: ConceptBObservatory,
  },
  {
    id: "horizon",
    label: "C — Horizon",
    subtitle: "Radial Command Center",
    color: "#06b6d4",
    description: "Futuristic HUD-style interface with radial gauges, scanning effects, and gradient overlays. Data grid layout in info panel. Best for: sci-fi aesthetic, advanced users, wow factor.",
    pros: ["Strongest visual identity — unmistakable sci-fi aesthetic", "Arc gauges show FPS/VRAM/Scale at a glance", "Decorative HUD rings add depth and motion", "Scale navigation as interactive dot sequence", "Category quick-access pills at bottom-left"],
    cons: ["HUD decorations reduce usable viewport", "Rotating rings can distract from content", "Harder to adapt to mobile/accessibility", "\"TARGET ACQUIRED\" tone may not suit educators"],
    Component: ConceptCHorizon,
  },
];

export default function AllConceptsComparison() {
  const [active, setActive] = useState("nebula");
  const [view, setView] = useState("preview"); // "preview" or "details"

  const current = concepts.find((c) => c.id === active);

  return (
    <div style={{
      width: "100%", height: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "'Inter', system-ui, sans-serif", background: "#0a0a1a", color: "#e2e8f0",
      overflow: "hidden",
    }}>
      {/* === SELECTOR BAR === */}
      <div style={{
        display: "flex", alignItems: "center", padding: "12px 24px", gap: 12,
        background: "rgba(15,23,42,0.95)", borderBottom: "1px solid rgba(37,99,235,0.15)",
        flexShrink: 0, zIndex: 100,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>
          <span style={{ color: "#8b5cf6" }}>COSMOS</span> UI CONCEPTS
        </div>
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)", margin: "0 8px" }} />

        {/* Concept tabs */}
        {concepts.map((c) => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: active === c.id ? 700 : 400,
              fontFamily: "inherit", cursor: "pointer", transition: "all 0.2s",
              background: active === c.id ? `${c.color}18` : "transparent",
              border: active === c.id ? `1px solid ${c.color}40` : "1px solid transparent",
              color: active === c.id ? c.color : "#64748b",
            }}
          >
            {c.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* View toggle */}
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 3 }}>
          <button onClick={() => setView("preview")} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
            background: view === "preview" ? "rgba(37,99,235,0.15)" : "transparent",
            border: "none", color: view === "preview" ? "#2563eb" : "#64748b", fontWeight: view === "preview" ? 600 : 400,
          }}>
            Preview
          </button>
          <button onClick={() => setView("details")} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", cursor: "pointer",
            background: view === "details" ? "rgba(37,99,235,0.15)" : "transparent",
            border: "none", color: view === "details" ? "#2563eb" : "#64748b", fontWeight: view === "details" ? 600 : 400,
          }}>
            Compare Details
          </button>
        </div>
      </div>

      {/* === CONTENT === */}
      {view === "preview" ? (
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <current.Component />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          {/* Comparison cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, maxWidth: 1200, margin: "0 auto" }}>
            {concepts.map((c) => (
              <div key={c.id} style={{
                background: "rgba(15,23,42,0.7)", border: `1px solid ${active === c.id ? c.color + "40" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 16, overflow: "hidden", transition: "border-color 0.3s",
              }}>
                {/* Mini preview */}
                <div style={{
                  height: 200, position: "relative", overflow: "hidden",
                  borderBottom: `1px solid rgba(255,255,255,0.06)`,
                  cursor: "pointer",
                }} onClick={() => { setActive(c.id); setView("preview"); }}>
                  <div style={{ transform: "scale(0.35)", transformOrigin: "top left", width: "286%", height: "286%", pointerEvents: "none" }}>
                    <c.Component />
                  </div>
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(180deg, transparent 50%, rgba(15,23,42,0.9))",
                    display: "flex", alignItems: "flex-end", padding: 16,
                  }}>
                    <span style={{ fontSize: 12, color: c.color, fontWeight: 600 }}>Click to preview full size →</span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{c.subtitle}</div>
                  <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 12, lineHeight: 1.6 }}>{c.description}</p>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#10b981", marginBottom: 8, letterSpacing: 0.5 }}>STRENGTHS</div>
                    {c.pros.map((p, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "4px 0", display: "flex", gap: 8 }}>
                        <span style={{ color: "#10b981" }}>+</span> {p}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", marginBottom: 8, letterSpacing: 0.5 }}>TRADE-OFFS</div>
                    {c.cons.map((p, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "4px 0", display: "flex", gap: 8 }}>
                        <span style={{ color: "#f59e0b" }}>−</span> {p}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div style={{
            maxWidth: 1200, margin: "32px auto 0", padding: 24, borderRadius: 12,
            background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.15)",
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2563eb", marginBottom: 12 }}>Recommendation</div>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>
              All three concepts use the same design system (Deep Space Black, Cosmic Blue, glassmorphism, Inter + JetBrains Mono).
              You can also mix elements — for example, use Nebula's immersive viewport as the default Explorer mode,
              Observatory's panel layout for Research/Observer modes, and Horizon's HUD gauges as an optional overlay.
              The 5-mode system in the PRD naturally supports adaptive layouts per persona.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
