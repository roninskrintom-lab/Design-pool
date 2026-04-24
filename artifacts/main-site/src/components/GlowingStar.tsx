import { useEffect, useId, useRef } from "react";
import { getLightSourcePosition } from "@/lib/lightSource";
import { STAR_PATH } from "@/lib/starPath";

interface GlowingStarProps {
  size?: number;
  className?: string;
  /** Optional star rotation getter — used to keep rim light in world-space */
  getRotationDeg?: () => number;
  /**
   * If true (default), renders a built-in cyan back-light glow behind the star.
   * Set to false when an external StarBeams already provides the backlight
   * (e.g. in the hero), to avoid double-glow.
   */
  withBackdrop?: boolean;
}

/**
 * Dark navy 4-point star — a backlit silhouette in front of the bright cyan
 * back-light. Has subtle inner shading so the surface doesn't look flat,
 * plus a soft cyan rim highlight along the edge facing the moving light
 * source. The lit edge animates in sync with the back-light.
 */
export default function GlowingStar({
  size = 360,
  className = "",
  getRotationDeg,
  withBackdrop = true,
}: GlowingStarProps) {
  const startRef = useRef(performance.now());
  const rimGradRef = useRef<SVGLinearGradientElement>(null);
  const facetGradRef = useRef<SVGLinearGradientElement>(null);
  const shadowGradRef = useRef<SVGLinearGradientElement>(null);

  // Per-instance unique IDs for SVG paint servers — prevents cross-instance
  // gradient/filter binding collisions when multiple stars are on the page.
  const uid = useId().replace(/[:]/g, "");
  const shellId = `starShell-${uid}`;
  const midId = `starMid-${uid}`;
  const deepId = `starDeep-${uid}`;
  const coreId = `starCoreFill-${uid}`;
  const facetId = `starFacet-${uid}`;
  const shadowId = `starShadow-${uid}`;
  const rimId = `starRim-${uid}`;
  const blurId = `rimBlur-${uid}`;

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    let raf: number | null = null;

    const tick = () => {
      const t = (performance.now() - startRef.current) / 1000;
      const ls = getLightSourcePosition(t);

      // Compensate for star's own rotation
      const rotDeg = getRotationDeg ? getRotationDeg() : 0;
      const rotRad = (rotDeg * Math.PI) / 180;
      const cosR = Math.cos(-rotRad);
      const sinR = Math.sin(-rotRad);
      const lx = ls.x * cosR - ls.y * sinR;
      const ly = ls.x * sinR + ls.y * cosR;

      const len = Math.sqrt(lx * lx + ly * ly) || 1;
      const dirX = lx / len;
      const dirY = ly / len;

      // Rim highlight gradient endpoints — bright stop on lit side
      const x1 = (50 - dirX * 60).toFixed(1) + "%";
      const y1 = (50 - dirY * 60).toFixed(1) + "%";
      const x2 = (50 + dirX * 60).toFixed(1) + "%";
      const y2 = (50 + dirY * 60).toFixed(1) + "%";

      if (rimGradRef.current) {
        rimGradRef.current.setAttribute("x1", x1);
        rimGradRef.current.setAttribute("y1", y1);
        rimGradRef.current.setAttribute("x2", x2);
        rimGradRef.current.setAttribute("y2", y2);
      }
      if (facetGradRef.current) {
        facetGradRef.current.setAttribute("x1", x1);
        facetGradRef.current.setAttribute("y1", y1);
        facetGradRef.current.setAttribute("x2", x2);
        facetGradRef.current.setAttribute("y2", y2);
      }
      // Inner shadow gradient — opposite direction to facet (deepest shadow
      // sits on the side facing AWAY from the light, like a real solid object)
      if (shadowGradRef.current) {
        const sx1 = (50 + dirX * 60).toFixed(1) + "%";
        const sy1 = (50 + dirY * 60).toFixed(1) + "%";
        const sx2 = (50 - dirX * 60).toFixed(1) + "%";
        const sy2 = (50 - dirY * 60).toFixed(1) + "%";
        shadowGradRef.current.setAttribute("x1", sx1);
        shadowGradRef.current.setAttribute("y1", sy1);
        shadowGradRef.current.setAttribute("x2", sx2);
        shadowGradRef.current.setAttribute("y2", sy2);
      }

      if (!reducedMotion) {
        raf = requestAnimationFrame(tick);
      }
    };

    if (!reducedMotion) {
      raf = requestAnimationFrame(tick);
    } else {
      tick();
    }

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [getRotationDeg]);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Built-in soft cyan back-light glow — used when there is no external
          StarBeams behind the star (e.g. decorative stars in lower sections). */}
      {withBackdrop && (
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            width: size * 2.6,
            height: size * 2.6,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle at center," +
              " hsla(190, 100%, 90%, 0.55) 0%," +
              " hsla(195, 100%, 70%, 0.32) 12%," +
              " hsla(200, 100%, 55%, 0.18) 28%," +
              " hsla(210, 95%, 40%, 0.07) 50%," +
              " hsla(220, 90%, 25%, 0.02) 75%," +
              " transparent 100%)",
            filter: "blur(2px)",
          }}
        />
      )}

      <svg viewBox="0 0 200 200" className="relative w-full h-full overflow-visible">
        <defs>
          {/* Shell — lightest blue, the outer "rim" of the silhouette where
              the back-light wraps over the edge */}
          <linearGradient id={shellId} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(210 72% 42%)" />
            <stop offset="55%" stopColor="hsl(214 76% 33%)" />
            <stop offset="100%" stopColor="hsl(218 80% 25%)" />
          </linearGradient>

          {/* Mid layer — medium navy, sits one step inset from the shell */}
          <linearGradient id={midId} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(216 80% 26%)" />
            <stop offset="55%" stopColor="hsl(220 84% 19%)" />
            <stop offset="100%" stopColor="hsl(223 88% 14%)" />
          </linearGradient>

          {/* Deep layer — darker, gives the "two-step bevel" feel */}
          <linearGradient id={deepId} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(222 88% 14%)" />
            <stop offset="55%" stopColor="hsl(225 92% 10%)" />
            <stop offset="100%" stopColor="hsl(228 95% 7%)" />
          </linearGradient>

          {/* Core — deepest navy, the "well" at the center of the star */}
          <radialGradient id={coreId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(228 96% 5%)" />
            <stop offset="60%" stopColor="hsl(226 92% 8%)" />
            <stop offset="100%" stopColor="hsl(224 88% 12%)" />
          </radialGradient>

          {/* Facet light — subtle directional brightening on the lit EDGE
              only. Middle stop is fully transparent so the star's center
              never gets brightened by this overlay (no central hotspot). */}
          <linearGradient
            ref={facetGradRef}
            id={facetId}
            x1="20%"
            y1="80%"
            x2="80%"
            y2="20%"
          >
            <stop offset="0%" stopColor="hsla(220, 85%, 6%, 0)" />
            <stop offset="65%" stopColor="hsla(210, 60%, 25%, 0)" />
            <stop offset="100%" stopColor="hsla(200, 90%, 60%, 0.16)" />
          </linearGradient>

          {/* Inner shadow — deepens the side facing AWAY from the light, like
              a real solid object catching back-light from one direction */}
          <linearGradient
            ref={shadowGradRef}
            id={shadowId}
            x1="20%"
            y1="80%"
            x2="80%"
            y2="20%"
          >
            <stop offset="0%" stopColor="hsla(228, 95%, 3%, 0.55)" />
            <stop offset="55%" stopColor="hsla(224, 88%, 8%, 0.18)" />
            <stop offset="100%" stopColor="hsla(220, 80%, 15%, 0)" />
          </linearGradient>

          {/* Rim light — soft cyan glow confined to the lit EDGE only.
              Middle stop is transparent so it cannot bleed into the center. */}
          <linearGradient
            ref={rimGradRef}
            id={rimId}
            x1="20%"
            y1="80%"
            x2="80%"
            y2="20%"
          >
            <stop offset="0%" stopColor="hsla(200, 100%, 90%, 0)" />
            <stop offset="75%" stopColor="hsla(195, 100%, 88%, 0)" />
            <stop offset="100%" stopColor="hsla(190, 100%, 92%, 0.22)" />
          </linearGradient>

          {/* Soft outline blur for the rim */}
          <filter id={blurId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.7" />
          </filter>
        </defs>

        {/* ----- Multi-layer concentric body for 3D depth ----- */}

        {/* Layer 1 — Shell (full size) — lightest, the outer rim */}
        <path d={STAR_PATH} fill={`url(#${shellId})`} />

        {/* Layer 2 — Mid (scale 0.92) — first step inward */}
        <g transform="translate(100 100) scale(0.92) translate(-100 -100)">
          <path d={STAR_PATH} fill={`url(#${midId})`} />
        </g>

        {/* Layer 3 — Deep (scale 0.78) — second step inward */}
        <g transform="translate(100 100) scale(0.78) translate(-100 -100)">
          <path d={STAR_PATH} fill={`url(#${deepId})`} />
        </g>

        {/* Layer 4 — Core (scale 0.55) — innermost dark well */}
        <g transform="translate(100 100) scale(0.55) translate(-100 -100)">
          <path d={STAR_PATH} fill={`url(#${coreId})`} />
        </g>

        {/* ----- Directional shading overlays ----- */}

        {/* Layer 5 — Inner shadow on the side facing away from the light */}
        <path d={STAR_PATH} fill={`url(#${shadowId})`} />

        {/* Layer 6 — Subtle facet light on the side facing the light */}
        <path
          d={STAR_PATH}
          fill={`url(#${facetId})`}
          style={{ mixBlendMode: "screen" }}
        />

        {/* Layer 7 — Soft cyan rim highlight on the lit edge */}
        <path
          d={STAR_PATH}
          fill={`url(#${rimId})`}
          filter={`url(#${blurId})`}
          style={{ mixBlendMode: "screen" }}
        />
      </svg>
    </div>
  );
}
