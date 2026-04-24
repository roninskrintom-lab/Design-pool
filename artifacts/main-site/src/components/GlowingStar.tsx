import { motion } from "framer-motion";

interface GlowingStarProps {
  size?: number;
  className?: string;
}

/**
 * 4-pointed star with intense radial glow, like the hero of the reference video.
 * Pulses, breathes, and emits soft beams.
 */
export default function GlowingStar({ size = 360, className = "" }: GlowingStarProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Wide outer halo */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle, hsl(200 100% 65% / 0.55) 0%, hsl(215 90% 50% / 0.25) 25%, transparent 60%)",
          filter: "blur(20px)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Mid halo */}
      <motion.div
        className="absolute inset-[12%]"
        style={{
          background:
            "radial-gradient(circle, hsl(195 100% 80% / 0.85) 0%, hsl(200 100% 60% / 0.45) 30%, transparent 65%)",
          filter: "blur(12px)",
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{ duration: 3.5, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Light beams (cross) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          rotate: [0, 360],
        }}
        transition={{ duration: 60, ease: "linear", repeat: Infinity }}
      >
        <div
          className="absolute"
          style={{
            width: "150%",
            height: 2,
            background:
              "linear-gradient(90deg, transparent 0%, hsl(195 100% 85% / 0.0) 20%, hsl(195 100% 90% / 0.9) 50%, hsl(195 100% 85% / 0.0) 80%, transparent 100%)",
            filter: "blur(1px)",
          }}
        />
        <div
          className="absolute"
          style={{
            width: 2,
            height: "150%",
            background:
              "linear-gradient(180deg, transparent 0%, hsl(195 100% 85% / 0.0) 20%, hsl(195 100% 90% / 0.9) 50%, hsl(195 100% 85% / 0.0) 80%, transparent 100%)",
            filter: "blur(1px)",
          }}
        />
      </motion.div>

      {/* The 4-point star shape */}
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-[20%]"
        animate={{
          scale: [1, 1.06, 1],
          rotate: [0, 4, 0, -4, 0],
        }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
        style={{ filter: "drop-shadow(0 0 30px hsl(200 100% 70% / 0.9)) drop-shadow(0 0 80px hsl(200 100% 60% / 0.6))" }}
      >
        <defs>
          <radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="40%" stopColor="hsl(195 100% 90%)" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(200 100% 60%)" stopOpacity="0.8" />
          </radialGradient>
        </defs>
        <path
          d="M 100 0 C 100 60, 140 100, 200 100 C 140 100, 100 140, 100 200 C 100 140, 60 100, 0 100 C 60 100, 100 60, 100 0 Z"
          fill="url(#starGradient)"
        />
      </motion.svg>

      {/* Bright core */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
        style={{
          width: size * 0.06,
          height: size * 0.06,
          boxShadow:
            "0 0 30px 10px white, 0 0 60px 20px hsl(195 100% 80%), 0 0 120px 40px hsl(200 100% 60% / 0.6)",
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
      />
    </div>
  );
}
