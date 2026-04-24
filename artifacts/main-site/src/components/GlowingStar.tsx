import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { getLightSourcePosition } from "@/lib/lightSource";

interface GlowingStarProps {
  size?: number;
  className?: string;
  /**
   * Optional getter that returns the star's current rotation in degrees
   * (used to counter-rotate light direction so highlights stay in world space).
   * Provide this only if the star is wrapped in a rotating motion.div.
   */
  getRotationDeg?: () => number;
}

const STAR_PATH =
  "M 100 0 C 100 60, 140 100, 200 100 C 140 100, 100 140, 100 200 C 100 140, 60 100, 0 100 C 60 100, 100 60, 100 0 Z";

/**
 * Volumetric, layered 4-point star with realistic depth, faceted shading
 * and crisp light spikes. Lighting (highlights + shadow facets) tracks the
 * shared moving light source so the star looks like a real 3D object lit
 * from a drifting source behind it.
 */
export default function GlowingStar({
  size = 360,
  className = "",
  getRotationDeg,
}: GlowingStarProps) {
  const startRef = useRef(performance.now());

  // Refs to live SVG gradient/path elements — mutated each frame in RAF
  // (no React re-renders).
  const outerGradRef = useRef<SVGLinearGradientElement>(null);
  const midGradRef = useRef<SVGLinearGradientElement>(null);
  const innerGradRef = useRef<SVGRadialGradientElement>(null);
  const shadowGradRef = useRef<SVGLinearGradientElement>(null);
  const shadowPathRef = useRef<SVGPathElement>(null);
  const specularRef = useRef<HTMLDivElement>(null);
  const rimGradRef = useRef<SVGLinearGradientElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf: number | null = null;

    const tick = () => {
      const t = (performance.now() - startRef.current) / 1000;
      const ls = getLightSourcePosition(t);

      // Compensate for star's own rotation (so the lit facet stays
      // pointed at the world-space light source, not the rotated frame).
      const rotDeg = getRotationDeg ? getRotationDeg() : 0;
      const rotRad = (rotDeg * Math.PI) / 180;
      const cosR = Math.cos(-rotRad);
      const sinR = Math.sin(-rotRad);
      const lx = ls.x * cosR - ls.y * sinR;
      const ly = ls.x * sinR + ls.y * cosR;

      // Direction normalized: where the light is coming FROM, in star-local space.
      const len = Math.sqrt(lx * lx + ly * ly) || 1;
      const dirX = lx / len;
      const dirY = ly / len;

      // SVG gradient endpoints (% strings).
      // Bright stop should sit on the lit side, dark stop on the opposite side.
      // (x1,y1) = dark/origin, (x2,y2) = bright/light side.
      const x1 = (50 - dirX * 60).toFixed(1) + "%";
      const y1 = (50 - dirY * 60).toFixed(1) + "%";
      const x2 = (50 + dirX * 60).toFixed(1) + "%";
      const y2 = (50 + dirY * 60).toFixed(1) + "%";

      if (outerGradRef.current) {
        outerGradRef.current.setAttribute("x1", x1);
        outerGradRef.current.setAttribute("y1", y1);
        outerGradRef.current.setAttribute("x2", x2);
        outerGradRef.current.setAttribute("y2", y2);
      }
      if (midGradRef.current) {
        midGradRef.current.setAttribute("x1", x1);
        midGradRef.current.setAttribute("y1", y1);
        midGradRef.current.setAttribute("x2", x2);
        midGradRef.current.setAttribute("y2", y2);
      }
      if (rimGradRef.current) {
        rimGradRef.current.setAttribute("x1", x1);
        rimGradRef.current.setAttribute("y1", y1);
        rimGradRef.current.setAttribute("x2", x2);
        rimGradRef.current.setAttribute("y2", y2);
      }

      // Inner radial gradient — bright spot follows light direction
      if (innerGradRef.current) {
        const cx = (50 + dirX * 30).toFixed(1) + "%";
        const cy = (50 + dirY * 30).toFixed(1) + "%";
        innerGradRef.current.setAttribute("cx", cx);
        innerGradRef.current.setAttribute("cy", cy);
      }

      // Shadow facet — dark on the side opposite to the light.
      // Gradient: from lit side (transparent) to shadow side (dark).
      if (shadowGradRef.current) {
        const sx1 = (50 + dirX * 70).toFixed(1) + "%"; // lit side (transparent)
        const sy1 = (50 + dirY * 70).toFixed(1) + "%";
        const sx2 = (50 - dirX * 70).toFixed(1) + "%"; // shadow side (dark)
        const sy2 = (50 - dirY * 70).toFixed(1) + "%";
        shadowGradRef.current.setAttribute("x1", sx1);
        shadowGradRef.current.setAttribute("y1", sy1);
        shadowGradRef.current.setAttribute("x2", sx2);
        shadowGradRef.current.setAttribute("y2", sy2);
      }

      // Specular drifting highlight — small bright spot on the lit edge
      if (specularRef.current) {
        const px = 50 + dirX * 18;
        const py = 50 + dirY * 18;
        specularRef.current.style.left = `${px}%`;
        specularRef.current.style.top = `${py}%`;
      }

      if (!reducedMotion) {
        raf = requestAnimationFrame(tick);
      }
    };

    if (!reducedMotion) {
      raf = requestAnimationFrame(tick);
    } else {
      // Run once to set initial state
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
      {/* ============ AMBIENT GLOW (BACK LAYERS) ============ */}

      {/* Wide outer halo */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle, hsl(200 100% 65% / 0.55) 0%, hsl(215 90% 45% / 0.28) 22%, hsl(225 80% 25% / 0.15) 45%, transparent 70%)",
          filter: "blur(24px)",
        }}
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Mid halo */}
      <motion.div
        className="absolute inset-[10%]"
        style={{
          background:
            "radial-gradient(circle, hsl(195 100% 80% / 0.85) 0%, hsl(200 100% 55% / 0.5) 25%, transparent 65%)",
          filter: "blur(14px)",
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{ duration: 3.8, ease: "easeInOut", repeat: Infinity }}
      />

      {/* ============ LIGHT SPIKES (CROSS BEAMS) ============ */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
      >
        {/* Horizontal main spike */}
        <div
          className="absolute"
          style={{
            width: "180%",
            height: 1.5,
            background:
              "linear-gradient(90deg, transparent 0%, transparent 25%, hsl(195 100% 92% / 0.95) 50%, transparent 75%, transparent 100%)",
            filter: "blur(0.5px)",
          }}
        />
        {/* Horizontal soft spike */}
        <div
          className="absolute"
          style={{
            width: "180%",
            height: 8,
            background:
              "linear-gradient(90deg, transparent 0%, transparent 30%, hsl(200 100% 75% / 0.45) 50%, transparent 70%, transparent 100%)",
            filter: "blur(4px)",
          }}
        />
        {/* Vertical main spike */}
        <div
          className="absolute"
          style={{
            width: 1.5,
            height: "180%",
            background:
              "linear-gradient(180deg, transparent 0%, transparent 25%, hsl(195 100% 92% / 0.95) 50%, transparent 75%, transparent 100%)",
            filter: "blur(0.5px)",
          }}
        />
        {/* Vertical soft spike */}
        <div
          className="absolute"
          style={{
            width: 8,
            height: "180%",
            background:
              "linear-gradient(180deg, transparent 0%, transparent 30%, hsl(200 100% 75% / 0.45) 50%, transparent 70%, transparent 100%)",
            filter: "blur(4px)",
          }}
        />
      </motion.div>

      {/* ============ THE STAR — STACKED VOLUMETRIC LAYERS ============ */}
      <motion.div
        className="absolute inset-[18%]"
        animate={{
          scale: [1, 1.04, 1],
        }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            {/* Deepest outer faceted gradient — direction tracks live light source */}
            <linearGradient ref={outerGradRef} id="starOuter" x1="20%" y1="80%" x2="80%" y2="20%">
              <stop offset="0%" stopColor="hsl(225 80% 18%)" />
              <stop offset="40%" stopColor="hsl(220 85% 32%)" />
              <stop offset="100%" stopColor="hsl(210 90% 55%)" />
            </linearGradient>

            {/* Mid layer — brighter blue */}
            <linearGradient ref={midGradRef} id="starMid" x1="20%" y1="80%" x2="80%" y2="20%">
              <stop offset="0%" stopColor="hsl(215 90% 45%)" />
              <stop offset="50%" stopColor="hsl(205 100% 65%)" />
              <stop offset="100%" stopColor="hsl(195 100% 80%)" />
            </linearGradient>

            {/* Inner layer — radial bright spot tracks light source */}
            <radialGradient ref={innerGradRef} id="starInner" cx="55%" cy="42%" r="60%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="40%" stopColor="hsl(190 100% 88%)" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(200 100% 60%)" stopOpacity="0.8" />
            </radialGradient>

            {/* Edge rim highlight — direction tracks light */}
            <linearGradient ref={rimGradRef} id="starRim" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(220 90% 35%)" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(195 100% 90%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(180 100% 95%)" stopOpacity="0" />
            </linearGradient>

            {/* Shadow facet gradient — darkens the side opposite the light */}
            <linearGradient ref={shadowGradRef} id="starShadow" x1="80%" y1="20%" x2="20%" y2="80%">
              <stop offset="0%" stopColor="rgba(0,5,30,0)" />
              <stop offset="35%" stopColor="rgba(0,5,30,0)" />
              <stop offset="65%" stopColor="rgba(0,5,30,0.35)" />
              <stop offset="100%" stopColor="rgba(0,5,30,0.85)" />
            </linearGradient>

            {/* Soft Gaussian blur for back layer */}
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>

            <filter id="harderGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1" />
            </filter>
          </defs>

          {/* Layer 1 — softly blurred outermost, deep blue */}
          <g style={{ filter: "drop-shadow(0 0 18px hsl(200 100% 60% / 0.7))" }}>
            <path d={STAR_PATH} fill="url(#starOuter)" filter="url(#softGlow)" />
          </g>

          {/* Layer 2 — concentric mid star, brighter blue */}
          <g transform="translate(100 100) scale(0.78) translate(-100 -100)">
            <path d={STAR_PATH} fill="url(#starMid)" filter="url(#harderGlow)" opacity="0.95" />
          </g>

          {/* Layer 3 — inner cyan star, sharp */}
          <g transform="translate(100 100) scale(0.55) translate(-100 -100)">
            <path d={STAR_PATH} fill="url(#starInner)" />
          </g>

          {/* Layer 4 — bright tiny core star (lens-flare effect) */}
          <g transform="translate(100 100) scale(0.22) translate(-100 -100)">
            <path d={STAR_PATH} fill="white" />
          </g>

          {/* Rim highlight overlay — adds the "facet" sheen */}
          <g opacity="0.9" style={{ mixBlendMode: "screen" }}>
            <path d={STAR_PATH} fill="url(#starRim)" />
          </g>

          {/* Shadow facet overlay — clipped to the star shape, side opposite light */}
          <g style={{ mixBlendMode: "multiply" }}>
            <path ref={shadowPathRef} d={STAR_PATH} fill="url(#starShadow)" />
          </g>
        </svg>
      </motion.div>

      {/* ============ SPECULAR HIGHLIGHT (tracks light source) ============ */}
      <div
        ref={specularRef}
        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: "60%",
          top: "40%",
          width: size * 0.09,
          height: size * 0.09,
          background:
            "radial-gradient(circle, white 0%, hsl(190 100% 90% / 0.85) 35%, transparent 70%)",
          filter: "blur(2px)",
          mixBlendMode: "screen",
        }}
      />

      {/* ============ BRIGHT CORE ============ */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{
          width: size * 0.045,
          height: size * 0.045,
          boxShadow:
            "0 0 24px 8px white, 0 0 50px 18px hsl(195 100% 80% / 0.9), 0 0 100px 36px hsl(200 100% 60% / 0.55)",
        }}
        animate={{
          scale: [1, 1.55, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
      />

      {/* ============ LENS FLARE ARTIFACTS ============ */}
      <motion.div
        className="absolute"
        style={{
          left: "62%",
          top: "62%",
          width: size * 0.025,
          height: size * 0.025,
          background:
            "radial-gradient(circle, hsl(180 100% 90% / 0.9), transparent 70%)",
          filter: "blur(1px)",
          mixBlendMode: "screen",
        }}
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.3, 1] }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute"
        style={{
          left: "38%",
          top: "38%",
          width: size * 0.02,
          height: size * 0.02,
          background:
            "radial-gradient(circle, hsl(200 100% 80% / 0.85), transparent 70%)",
          filter: "blur(1px)",
          mixBlendMode: "screen",
        }}
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
        transition={{ duration: 3.5, ease: "easeInOut", repeat: Infinity, delay: 0.7 }}
      />
    </div>
  );
}
