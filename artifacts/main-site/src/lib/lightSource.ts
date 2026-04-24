/**
 * Shared light-source position used by StarBeams (the volumetric beams behind
 * the star) and GlowingStar (the star's facet shading). Both consume the same
 * function so the visual effects stay in sync — the star's bright facet always
 * faces the same direction the beams are coming from, and the shadow falls on
 * the opposite side.
 *
 * Returns normalized offset from center in roughly the range -0.85..0.85.
 * Cycle is roughly 10–14 seconds for premium, calm motion.
 * `t` is seconds.
 */
export function getLightSourcePosition(t: number): { x: number; y: number } {
  // Smaller amplitudes — the bright zone should stay roughly centered behind
  // the star, only subtly drifting (otherwise the hero looks lopsided).
  const x = Math.sin(t * 0.55) * 0.32 + Math.cos(t * 0.34) * 0.14;
  const y = Math.cos(t * 0.46) * 0.22 + Math.sin(t * 0.29) * 0.12;
  return { x, y };
}
