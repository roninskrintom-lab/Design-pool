import { motion } from "framer-motion";

interface GlowingStarProps {
  size?: number;
  className?: string;
}

const STAR_PATH =
  "M 100 0 C 100 60, 140 100, 200 100 C 140 100, 100 140, 100 200 C 100 140, 60 100, 0 100 C 60 100, 100 60, 100 0 Z";

/**
 * Volumetric, layered 4-point star with realistic depth, faceted shading
 * and crisp light spikes — inspired by the Trillion Digital reference.
 */
export default function GlowingStar({ size = 360, className = "" }: GlowingStarProps) {
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
            {/* Deepest outer faceted gradient — directional lighting top-right */}
            <linearGradient id="starOuter" x1="20%" y1="80%" x2="80%" y2="20%">
              <stop offset="0%" stopColor="hsl(225 80% 18%)" />
              <stop offset="40%" stopColor="hsl(220 85% 32%)" />
              <stop offset="100%" stopColor="hsl(210 90% 55%)" />
            </linearGradient>

            {/* Mid layer — brighter blue */}
            <linearGradient id="starMid" x1="20%" y1="80%" x2="80%" y2="20%">
              <stop offset="0%" stopColor="hsl(215 90% 45%)" />
              <stop offset="50%" stopColor="hsl(205 100% 65%)" />
              <stop offset="100%" stopColor="hsl(195 100% 80%)" />
            </linearGradient>

            {/* Inner layer — cyan to light */}
            <radialGradient id="starInner" cx="55%" cy="42%" r="60%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="40%" stopColor="hsl(190 100% 88%)" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(200 100% 60%)" stopOpacity="0.8" />
            </radialGradient>

            {/* Edge rim highlight */}
            <linearGradient id="starRim" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(220 90% 35%)" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(195 100% 90%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(180 100% 95%)" stopOpacity="0" />
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
        </svg>
      </motion.div>

      {/* ============ SPECULAR HIGHLIGHT (drifting) ============ */}
      <motion.div
        className="absolute"
        style={{
          left: "52%",
          top: "44%",
          width: size * 0.08,
          height: size * 0.08,
          background:
            "radial-gradient(circle, white 0%, hsl(190 100% 90% / 0.8) 40%, transparent 70%)",
          filter: "blur(2px)",
          mixBlendMode: "screen",
        }}
        animate={{
          x: [0, -size * 0.02, 0],
          y: [0, size * 0.015, 0],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
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
      {/* Small refraction dot offset */}
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
