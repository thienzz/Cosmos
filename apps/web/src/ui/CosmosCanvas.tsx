import { useEffect, useRef, useState } from 'react';

import type { QualityLevel } from '@/engine/performanceMonitor';
import { SceneManager, type SceneManagerOptions } from '@/engine/SceneManager';

interface CosmosCanvasProps {
  onQualityChange?: (quality: QualityLevel) => void;
  /**
   * T50 — SceneManager option overrides. Defaults now mount the unified
   * universe scene (solar system + star tiles + nebulae + galaxies +
   * cosmic web + CMB + LSS + MW interior + constellations), with
   * {@link DefaultSceneComposer} toggling per-layer visibility by scale
   * regime × app mode. Pass `showXxx: false` to disable a specific layer
   * for tests or single-renderer fixtures, or `attachDefaultScene: false`
   * to keep every mounted layer unconditionally visible (legacy demo
   * behaviour).
   */
  sceneOptions?: Partial<SceneManagerOptions>;
}

/**
 * React mount for the Three.js engine. Keeps the component thin: all render
 * state lives in SceneManager and Zustand stores (Doc 27 §6.1 — the
 * two-loop separation).
 *
 * Prior iterations routed `?demo=planets|solarsystem|starfield|nebulae|…`
 * URL flags to exclusive single-renderer galleries. T50 retired those
 * flags — the unified scene now shows every content layer with regime-driven
 * LOD handoff, so search-click + zoom is the canonical way to reach any
 * entity.
 */
export function CosmosCanvas({
  onQualityChange,
  sceneOptions,
}: CosmosCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let manager: SceneManager | null = null;
    try {
      manager = new SceneManager(canvas, {
        ...(onQualityChange ? { onQualityChange } : {}),
        ...(sceneOptions ?? {}),
      });
      manager.start();
      if (import.meta.env.DEV) {
        (window as unknown as { __cosmosEngine?: SceneManager }).__cosmosEngine = manager;
      }
    } catch (err) {
      console.error('[CosmosCanvas] failed to initialise engine', err);
      setError(err instanceof Error ? err.message : String(err));
    }

    return () => {
      if (import.meta.env.DEV) {
        delete (window as unknown as { __cosmosEngine?: SceneManager }).__cosmosEngine;
      }
      manager?.dispose();
    };
    // onQualityChange + sceneOptions are intentionally not dependencies —
    // the SceneManager owns a WebGL context for its lifetime and we don't
    // want an option change to remount (and pay the context-loss cost).
    // Route runtime settings through Zustand instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div role="alert" className="cosmos-canvas-error">
        <strong>3D engine failed to initialise.</strong>
        <pre>{error}</pre>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="cosmos-canvas"
      aria-label="Cosmos Explorer 3D viewport"
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        background: '#02030a',
      }}
    />
  );
}
