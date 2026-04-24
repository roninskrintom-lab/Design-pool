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
          {/* Base dark navy fill — saturated deep blue, subtle vertical gradient */}
          <linearGradient id={baseId} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="hsl(218 85% 22%)" />
            <stop offset="50%" stopColor="hsl(220 88% 16%)" />
            <stop offset="100%" stopColor="hsl(224 90% 10%)" />
          </linearGradient>

          {/* Inner facet shading — very subtle lit/shadow gradient */}
          <linearGradient
            ref={innerGradRef}
            id={innerId}
            x1="20%"
            y1="80%"
            x2="80%"
            y2="20%"
          >
            <stop offset="0%" stopColor="hsl(225 90% 6%)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="hsl(220 80% 12%)" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(205 95% 38%)" stopOpacity="0.18" />
          </linearGradient>

          {/* Rim light — soft cyan edge highlight on lit side, very subtle */}
          <linearGradient
            ref={rimGradRef}
            id={rimId}
            x1="20%"
            y1="80%"
            x2="80%"
            y2="20%"
          >
            <stop offset="0%" stopColor="hsla(200, 100%, 90%, 0)" />
            <stop offset="60%" stopColor="hsla(195, 100%, 88%, 0.12)" />
            <stop offset="100%" stopColor="hsla(190, 100%, 92%, 0.4)" />
          </linearGradient>

          {/* Tiny bright core — small luminous dot near the center,
              like a pinhole of the backlight showing through */}
          <radialGradient
            ref={coreGlowRef}
            id={coreId}
            cx="50%"
            cy="50%"
            r="18%"
          >
            <stop offset="0%" stopColor="hsla(195, 100%, 95%, 0.85)" />
            <stop offset="35%" stopColor="hsla(198, 100%, 78%, 0.4)" />
            <stop offset="100%" stopColor="hsla(205, 100%, 55%, 0)" />
          </radialGradient>

          {/* Soft outline blur — adds the "backlit edge bleed" */}
          <filter id={blurId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
        </defs>

        {/* Layer 1 — base dark navy star */}
        <path d={STAR_PATH} fill={`url(#${baseId})`} />

        {/* Layer 2 — inner facet shading (subtle lit/shadow gradient) */}
        <path
          d={STAR_PATH}
          fill={`url(#${innerId})`}
          style={{ mixBlendMode: "screen" }}
        />

        {/* Layer 3 — bright rim highlight on the lit side */}
        <path
          d={STAR_PATH}
          fill={`url(#${rimId})`}
          filter={`url(#${blurId})`}
          style={{ mixBlendMode: "screen" }}
        />

        {/* Layer 4 — small bright core showing through the star's center */}
        <g transform="translate(100 100) scale(0.42) translate(-100 -100)">
          <path d={STAR_PATH} fill={`url(#${coreId})`} />
        </g>
      </svg>
    </div>
  );
}
