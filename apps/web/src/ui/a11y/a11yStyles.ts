/**
 * T33 — global accessibility stylesheet (Doc 16 §Focus Indicators, Doc 24
 * §17.2 / §17.5).
 *
 * Injected once at app mount via {@link mountA11yStyles}. Split out of the
 * components so:
 *
 *   - Focus rings live in one place (3 px accent-cyan outline + 2 px offset;
 *     Doc 24 §17.2 says 2 px but Doc 16's focus-ring checklist mandates 3 px
 *     min — we pick the stricter spec).
 *   - High-contrast mode flips the whole palette through CSS variables.
 *     Components read the variables via `var(--cosmos-bg)` etc. when they
 *     want to opt in; today the HUDs ship hard-coded AETHER V4 tokens and
 *     the HC rules override their computed values selectively.
 *   - `prefers-reduced-motion` kills CSS animations/transitions app-wide
 *     without requiring every component to inspect the media query.
 *   - `sr-only` class hides visuals while staying in the a11y tree
 *     (Doc 16 §Hidden Text Descriptions).
 *
 * Mount is idempotent (checks for an existing `#cosmos-a11y-styles` tag).
 */

const STYLE_ID = 'cosmos-a11y-styles';

/**
 * The raw CSS string — exported so tests can assert its contents without
 * mounting a DOM.
 */
export const A11Y_CSS = `
/* Screen-reader-only: keep in a11y tree, hide visually. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus indicator (Doc 24 §17.2). Use :focus-visible so pointer users
   don't see the ring on click, but keyboard users always do. */
:where(button, a, input, select, textarea, [role="button"], [role="option"],
       [role="tab"], [tabindex]):focus-visible {
  outline: 3px solid #00e5ff;
  outline-offset: 2px;
  /* Phosphor glow so the ring survives on dark bg. */
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.45);
}

/* Fallback for browsers without :focus-visible support. */
:where(button, a, input, select, textarea, [role="button"]):focus:not(:focus-visible) {
  outline: none;
}

/* --- Skip links (Doc 16 §Skip Navigation Links) -------------------- */
.cosmos-skip-link {
  position: absolute;
  top: -100px;
  left: 8px;
  background: #0a0a14;
  color: #00e5ff;
  padding: 8px 12px;
  border: 2px solid #00e5ff;
  border-radius: 2px;
  font-family: "Press Start 2P", "Space Mono", monospace;
  font-size: 10px;
  letter-spacing: 0.5px;
  z-index: 2000;
  text-decoration: none;
}
.cosmos-skip-link:focus,
.cosmos-skip-link:focus-visible {
  top: 8px;
  outline: 3px solid #00e5ff;
  outline-offset: 2px;
}

/* --- High-contrast mode (Doc 24 §17.5) ----------------------------- */
[data-high-contrast="true"] {
  /* WCAG AAA (7:1) tokens. Background pure black, text pure white. */
  --cosmos-bg: #000000;
  --cosmos-text: #ffffff;
  --cosmos-accent: #ffff00;
  --cosmos-border: #ffffff;
}
[data-high-contrast="true"] body {
  background: #000000 !important;
  color: #ffffff !important;
}
[data-high-contrast="true"] :where(button, [role="button"], input, select, textarea) {
  border-width: 2px !important;
  border-color: #ffffff !important;
  color: #ffffff !important;
  background: #000000 !important;
}
[data-high-contrast="true"] :where(button, [role="button"])[aria-pressed="true"],
[data-high-contrast="true"] :where(button, [role="button"])[aria-selected="true"],
[data-high-contrast="true"] :where(button, [role="button"]).is-active {
  background: #ffff00 !important;
  color: #000000 !important;
  border-color: #ffff00 !important;
}
[data-high-contrast="true"] :where(section, aside, header, footer, div[role="region"],
                                   div[role="dialog"], div[role="complementary"]) {
  border-width: 2px !important;
}
[data-high-contrast="true"] :where(button, a, input, select, textarea, [role="button"])
    :focus-visible {
  outline: 3px solid #ffff00 !important;
  outline-offset: 2px;
  box-shadow: none !important;
}
[data-high-contrast="true"] :where(.cosmos-skip-link) {
  background: #000000;
  color: #ffff00;
  border-color: #ffff00;
}
/* Kill decorative effects in HC per Doc 24 §17.5 ("Removes CRT overlay"). */
[data-high-contrast="true"] * {
  text-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  box-shadow: none !important;
}

/* --- Reduced motion (Doc 16 §Reduced Motion, Doc 24 §17.4) --------- */
[data-reduced-motion="true"] *,
[data-reduced-motion="true"] *::before,
[data-reduced-motion="true"] *::after {
  animation-duration: 0.001ms !important;
  animation-delay: 0ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  transition-delay: 0ms !important;
  scroll-behavior: auto !important;
}

/* Also respect the OS media query directly for consumers who haven't
   opted into the setting UI yet. */
@media (prefers-reduced-motion: reduce) {
  * , *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    transition-delay: 0ms !important;
  }
}
`;

/**
 * Inject the T33 stylesheet into `<head>`. Safe to call multiple times —
 * subsequent calls are no-ops. Returns a disposer that removes the tag.
 */
export function mountA11yStyles(
  target: Document | ShadowRoot = typeof document === 'undefined'
    ? ({} as Document)
    : document,
): () => void {
  if (typeof document === 'undefined') return () => undefined;
  // Support both Document and ShadowRoot for tests.
  const existing = (target as Document).getElementById?.(STYLE_ID);
  if (existing) return () => existing.remove();
  const tag = document.createElement('style');
  tag.id = STYLE_ID;
  tag.setAttribute('data-source', 't33-a11y');
  tag.textContent = A11Y_CSS;
  const head =
    'head' in target
      ? (target as Document).head
      : (target as unknown as ShadowRoot);
  (head as HTMLElement | ShadowRoot).appendChild(tag);
  return () => tag.remove();
}
