import { useEffect, useId, useRef } from "react";
import { getLightSourcePosition } from "@/lib/lightSource";

interface GlowingStarProps {
  size?: number;
  className?: string;
  /** Optional star rotation getter — used to keep rim light in world-space */
  getRotationDeg?: () => number;
}

const STAR_PATH =
  "M 100 0 C 100 60, 140 100, 200 100 C 140 100, 100 140, 100 200 C 100 140, 60 100, 0 100 C 60 100, 100 60, 100 0 Z";

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
}: GlowingStarProps) {
  const startRef = useRef(performance.now());
  const rimGradRef = useRef<SVGLinearGradientElement>(null);
  const innerGradRef = useRef<SVGLinearGradientElement>(null);
  const coreGlowRef = useRef<SVGRadialGradientElement>(null);

  // Per-instance unique IDs for SVG paint servers — prevents cross-instance
  // gradient/filter binding collisions when multiple stars are on the page.
  const uid = useId().replace(/[:]/g, "");
  const baseId = `starBase-${uid}`;
  const innerId = `starInner-${uid}`;
  const rimId = `starRim-${uid}`;
  const coreId = `starCore-${uid}`;
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
      if (innerGradRef.current) {
        innerGradRef.current.setAttribute("x1", x1);
        innerGradRef.current.setAttribute("y1", y1);
        innerGradRef.current.setAttribute("x2", x2);
        innerGradRef.current.setAttribute("y2", y2);
      }

      // Tiny bright "core" highlight follows the light direction subtly
      if (coreGlowRef.current) {
        const cx = (50 + dirX * 12).toFixed(1) + "%";
        const cy = (50 + dirY * 12).toFixed(1) + "%";
        coreGlowRef.current.setAttribute("cx", cx);
        coreGlowRef.current.setAttribute("cy", cy);
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
      <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
        <defs>
          {/* Outer star — slightly lighter blue (the "rim" / outline) */}
          <linearGradient id={baseId} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(212 75% 38%)" />
            <stop offset="55%" stopColor="hsl(215 78% 30%)" />
            <stop offset="100%" stopColor="hsl(220 82% 22%)" />
          </linearGradient>

          {/* Inner concentric star — darker, gives the "double outline" depth */}
          <linearGradient id={`${baseId}-inner`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(220 85% 22%)" />
            <stop offset="55%" stopColor="hsl(222 88% 16%)" />
            <stop offset="100%" stopColor="hsl(225 90% 11%)" />
          </linearGradient>

          {/* Subtle directional shading — adds barely-there facet lighting */}
          <linearGradient
            ref={innerGradRef}
            id={innerId}
            x1="20%"
            y1="80%"
            x2="80%"
            y2="20%"
          >
            <stop offset="0%" stopColor="hsl(225 90% 5%)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(220 80% 12%)" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(200 95% 50%)" stopOpacity="0.1" />
          </linearGradient>

          {/* Rim light — barely-there cyan edge glow tracking light direction */}
          <linearGradient
            ref={rimGradRef}
            id={rimId}
            x1="20%"
            y1="80%"
            x2="80%"
            y2="20%"
          >
            <stop offset="0%" stopColor="hsla(200, 100%, 90%, 0)" />
            <stop offset="65%" stopColor="hsla(195, 100%, 88%, 0.06)" />
            <stop offset="100%" stopColor="hsla(190, 100%, 92%, 0.18)" />
          </linearGradient>

          {/* Subtle cyan core — represents the backlight bleeding through the
              center of the star. Softer than before because the StarBeams lamp
              now provides the main "light from behind" sensation. */}
          <radialGradient
            ref={coreGlowRef}
            id={coreId}
            cx="50%"
            cy="50%"
            r="28%"
          >
            <stop offset="0%" stopColor="hsla(192, 100%, 92%, 0.55)" />
            <stop offset="30%" stopColor="hsla(196, 100%, 78%, 0.32)" />
            <stop offset="65%" stopColor="hsla(202, 100%, 60%, 0.12)" />
            <stop offset="100%" stopColor="hsla(208, 100%, 50%, 0)" />
          </radialGradient>

          {/* Soft outline blur */}
          <filter id={blurId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>

        {/* Layer 1 — outer star (lighter blue rim/shell) */}
        <path d={STAR_PATH} fill={`url(#${baseId})`} />

        {/* Layer 2 — inner concentric star (darker, slightly inset) */}
        <g transform="translate(100 100) scale(0.86) translate(-100 -100)">
          <path d={STAR_PATH} fill={`url(#${baseId}-inner)`} />
        </g>

        {/* Layer 3 — subtle directional facet shading on top */}
        <path
          d={STAR_PATH}
          fill={`url(#${innerId})`}
          style={{ mixBlendMode: "screen" }}
        />

        {/* Layer 4 — barely-there rim highlight on the lit side */}
        <path
          d={STAR_PATH}
          fill={`url(#${rimId})`}
          filter={`url(#${blurId})`}
          style={{ mixBlendMode: "screen" }}
        />

        {/* Layer 5 — bright core showing through the star's center */}
        <g transform="translate(100 100) scale(0.5) translate(-100 -100)">
          <path d={STAR_PATH} fill={`url(#${coreId})`} />
        </g>
      </svg>
    </div>
  );
}
