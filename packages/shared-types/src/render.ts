/**
 * Optional per-entity render-block that lets the backend (or seed data) steer
 * the client's MaterialFactory without changing the entity contract. Added in
 * T-V-00 for the viz-visuals.md 262-shader rollout.
 *
 * The block is purely advisory: if absent, MaterialFactory derives the shader
 * from the entity `object_type`/`kind` via its built-in kind→shader table.
 * When present, it overrides:
 *   - shader:   string key into MaterialFactory's bundled shader registry
 *   - defines:  compile-time `#define` flags applied to the ShaderMaterial
 *   - uniforms: runtime uniform values (scalars or numeric vector arrays)
 */
export interface EntityRenderBlock {
  /** Registry key — must match a shader bundled under apps/web/src/shaders. */
  shader: string;
  /** Compile-time `#define` map. Values are emitted verbatim (`0`/`1`/int). */
  defines?: Readonly<Record<string, boolean | number>>;
  /** Runtime uniform values. Scalars or fixed-length numeric tuples. */
  uniforms?: Readonly<Record<string, number | readonly number[]>>;
}
