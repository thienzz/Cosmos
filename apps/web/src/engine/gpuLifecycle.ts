/**
 * Shared GPU-lifecycle contract for engine components that own WebGL
 * resources (buffers, textures, ShaderMaterials).
 *
 * Lives in its own file so PostProcessingChain / BlackHoleLensingPass can
 * import the type without tripping the SceneManager ↔ chain cycle that
 * arises from importing directly from SceneManager.ts.
 */
export interface GpuLifecycleHook {
  /** Called after `webglcontextrestored` fires; restore GPU state. */
  rebuildAfterContextRestore(): void;
}
