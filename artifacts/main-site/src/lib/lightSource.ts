/**
 * Shared light-source position used by StarBeams (the volumetric beams behind
 * the star) and GlowingStar (the star's facet shading). Both consume the same
 * function so the visual effects stay in sync — the star's bright facet always
 * faces the same direction the beams are coming from, and the shadow falls on
 * the opposite side.
 *
 * Returns normalized offset from center in roughly the range -0.85..0.85.
 * `t` is seconds.
 */
export function getLightSourcePosition(t: number): { x: number; y: number } {
  const x = Math.sin(t * 0.22) * 0.55 + Math.cos(t * 0.13) * 0.28;
  const y = Math.cos(t * 0.18) * 0.42 + Math.sin(t * 0.11) * 0.28;
  return { x, y };
}
