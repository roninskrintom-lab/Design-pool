import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Soft glowing dot that follows the cursor with a delay,
 * casting a wide cyan halo. Uses motion values to avoid React renders.
 */
export default function CursorGlow() {
  const mx = useMotionValue(-9999);
  const my = useMotionValue(-9999);
  const sx = useSpring(mx, { stiffness: 80, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 80, damping: 20, mass: 0.6 });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX - 300);
      my.set(e.clientY - 300);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <motion.div
      className="pointer-events-none fixed z-[100] h-[600px] w-[600px] rounded-full"
      style={{
        background:
          "radial-gradient(circle, hsl(200 100% 65% / 0.18) 0%, hsl(215 90% 55% / 0.08) 30%, transparent 60%)",
        mixBlendMode: "screen",
        left: sx,
        top: sy,
      }}
    />
  );
}
