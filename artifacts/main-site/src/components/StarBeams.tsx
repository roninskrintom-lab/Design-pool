import { useEffect, useRef } from "react";
import { getLightSourcePosition } from "@/lib/lightSource";

interface StarBeamsProps {
  /** Outer reach of the soft glow in CSS pixels */
  glowReach?: number;
  /** Overall brightness multiplier (0..1) */
  brightness?: number;
  /** Horizontal stretch of the glow (1 = circular, >1 = wider) */
  spread?: number;
  /** Vertical bias of the glow center relative to canvas center (negative = up) */
  yBias?: number;
  className?: string;
}

/**
 * Big, soft, cinematic cyan back-light — one diffuse glow (like a softbox)
 * positioned behind the star. The light source slowly drifts so the brightest
 * zone shifts smoothly from frame to frame, giving a calm "play with light"
 * feel without any visible discrete rays.
 *
 * The light position is shared with `GlowingStar` via `getLightSourcePosition`
 * so the star's rim highlight stays on the side the light is coming from.
 */
export default function StarBeams({
  glowReach = 1100,
  brightness = 1,
  spread = 1.35,
  yBias = 0,
  className = "",
}: StarBeamsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(performance.now());
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (rafRef.current === null) draw();
    };

    const draw = () => {
      const { w, h } = sizeRef.current;
      const t = (performance.now() - startRef.current) / 1000;

      const cx = w / 2;
      const cy = h / 2 + yBias;

      // Light source drifts in a slow lissajous behind the star
      const ls = getLightSourcePosition(t);
      const driftStrength = Math.min(w, h) * 0.14;
      const lx = cx + ls.x * driftStrength;
      const ly = cy + ls.y * driftStrength * 0.55;

      // Subtle slow "breathing" of the glow
      const pulse = 1 + Math.sin(t * 0.45) * 0.05;
      const reach = glowReach * pulse;

      ctx.clearRect(0, 0, w, h);

      // ===== Layer 1: huge atmospheric haze (very wide, very faint) =====
      // Gives the glow its soft falloff into the navy bg
      const haze = ctx.createRadialGradient(lx, ly, 0, lx, ly, reach * 1.3);
      haze.addColorStop(0, `hsla(205, 100%, 50%, ${0.18 * brightness})`);
      haze.addColorStop(0.4, `hsla(215, 95%, 35%, ${0.1 * brightness})`);
      haze.addColorStop(0.75, `hsla(222, 90%, 22%, ${0.035 * brightness})`);
      haze.addColorStop(1, "hsla(225, 80%, 12%, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);

      // ===== Layer 2: main soft cyan glow (the "softbox") =====
      // Slightly stretched horizontally so it fills the hero better
      ctx.save();
      ctx.translate(lx, ly);
      ctx.scale(spread, 1);
      ctx.translate(-lx, -ly);

      const main = ctx.createRadialGradient(lx, ly, 0, lx, ly, reach);
      main.addColorStop(0, `hsla(195, 95%, 70%, ${0.7 * brightness})`);
      main.addColorStop(0.08, `hsla(198, 95%, 62%, ${0.6 * brightness})`);
      main.addColorStop(0.2, `hsla(204, 100%, 52%, ${0.42 * brightness})`);
      main.addColorStop(0.4, `hsla(212, 95%, 42%, ${0.22 * brightness})`);
      main.addColorStop(0.65, `hsla(220, 90%, 28%, ${0.08 * brightness})`);
      main.addColorStop(0.9, `hsla(225, 85%, 18%, ${0.02 * brightness})`);
      main.addColorStop(1, "hsla(225, 80%, 12%, 0)");
      ctx.fillStyle = main;
      // Generous fillRect — covers the canvas under the scale transform
      ctx.fillRect(lx - reach * 2, ly - reach * 2, reach * 4, reach * 4);
      ctx.restore();

      // ===== Layer 3: subtle inner brightness lift =====
      // Adds a touch of luminance near the source without creating a hot bulb
      const core = ctx.createRadialGradient(lx, ly, 0, lx, ly, reach * 0.35);
      core.addColorStop(0, `hsla(190, 100%, 82%, ${0.35 * brightness})`);
      core.addColorStop(0.4, `hsla(198, 100%, 65%, ${0.18 * brightness})`);
      core.addColorStop(1, "hsla(205, 100%, 50%, 0)");
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, w, h);

      if (visible && !reducedMotion) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        rafRef.current = null;
      }
    };

    // resize() kicks off the first draw — don't call draw() again here.
    resize();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible = e.isIntersecting;
          if (visible && rafRef.current === null && !reducedMotion) draw();
        }
      },
      { rootMargin: "100px" }
    );
    io.observe(canvas);

    window.addEventListener("resize", resize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [glowReach, brightness, spread, yBias]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
