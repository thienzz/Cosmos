/**
 * T31 audio module — public surface.
 *
 * Production callers should use {@link createDefaultAudioEngine} which wires
 * an {@link AudioEngine} on top of the {@link ToneAudioBackend}. Tests can
 * import {@link AudioEngine} directly and pass a stub backend.
 */

export type { AudioBackend, AudioVolumeState } from './AudioBackend';
export { AudioEngine, type AudioEngineOptions } from './AudioEngine';
export { ToneAudioBackend, type ToneAudioBackendOptions } from './ToneAudioBackend';
export {
  SOUNDSCAPE_CROSSFADE_MS,
  SOUNDSCAPE_PROFILES,
  type SoundscapeProfile,
} from './soundscape';

import { AudioEngine } from './AudioEngine';
import { ToneAudioBackend } from './ToneAudioBackend';

/**
 * Construct an AudioEngine backed by the production Tone.js synthesis graph.
 * Returns the engine; the caller is responsible for invoking `.start()` from
 * a user-gesture handler (Doc 22 §15.4 AUD-001).
 */
export function createDefaultAudioEngine(): AudioEngine {
  const backend = new ToneAudioBackend();
  return new AudioEngine({ backend });
}
