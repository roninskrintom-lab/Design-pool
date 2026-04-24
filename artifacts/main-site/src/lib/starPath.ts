/**
 * Shared 4-point star path used by GlowingStar (SVG silhouette) and
 * StarBeams (canvas occlusion shadow). The path is defined in a 200x200
 * coordinate space. To render at a different size, scale by size/200.
 */
export const STAR_PATH =
  "M 100 0 C 100 60, 140 100, 200 100 C 140 100, 100 140, 100 200 C 100 140, 60 100, 0 100 C 60 100, 100 60, 100 0 Z";
