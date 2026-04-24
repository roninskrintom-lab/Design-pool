import { useEffect, useRef } from "react";
import { getLightSourcePosition } from "@/lib/lightSource";

// Same 4-point star silhouette as GlowingStar (200x200 viewBox)
const STAR_PATH_STR =
  "M 100 0 C 100 60, 140 100, 200 100 C 140 100, 100 140, 100 200 C 100 140, 60 100, 0 100 C 60 100, 100 60, 100 0 Z";

interface StarBeamsProps {
  /** Visible star size in pixels — silhouette scales to match */
  starSize?: number;
  /** Radius of the bright back-glow (px) */
  glowReach?: number;
  /** How many silhouette stamps build up the soft shadow rays */
  shadowLayers?: number;
  /** Maximum scale multiplier the silhouette stretches to (away from light) */
  shadowReach?: number;
  /** 0..1 — overall brightness of the bright back-glow */
  brightness?: number;
  className?: string;
}

/**
 * Volumetric back-light for the star: renders a bright radial halo BEHIND
 * the star (the "light source") and casts soft shadow rays outward by
 * stamping the star silhouette many times, each stamp scaled outward from
 * the light source position. As the light source drifts, the silhouette
 * stamps re-aim — the shadows sweep across the scene in real time, like
 * the star is a real 3D object occluding a moving lamp behind it.
 */
export default function StarBeams({
  starSize = 680,
  glowReach = 580,
  shadowLayers = 55,
  shadowReach = 10,
  brightness = 0.7,
  className = "",
}: StarBeamsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(performance.now());
  const sizeRef = useRef({ w: 0, h: 0 });
  const pathRef = useRef<Path2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    pathRef.current = new Path2D(STAR_PATH_STR);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // If RAF isn't running (reduced motion or paused), redraw a single frame
      // so the canvas isn't stale/blank after viewport resize.
      if (rafRef.current === null) draw();
    };

    const draw = () => {
      const { w, h } = sizeRef.current;
      const t = (performance.now() - startRef.current) / 1000;
      const path = pathRef.current!;

      // Star is centered in the canvas
      const cx = w / 2;
      const cy = h / 2;

      // Light source drifts in a slow lissajous BEHIND the star.
      // Drift is intentionally small so rays mostly fan out in all
      // directions and only subtly bias toward one side as the source moves.
      const ls = getLightSourcePosition(t);
      const driftStrength = starSize * 0.12;
      const lx = cx + ls.x * driftStrength;
      const ly = cy + ls.y * driftStrength;

      ctx.clearRect(0, 0, w, h);

      // ===== 1. Bright radial back-glow (the light source itself) =====
      const bgGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, glowReach);
      bgGrad.addColorStop(0, `hsla(195, 100%, 78%, ${0.95 * brightness})`);
      bgGrad.addColorStop(0.06, `hsla(198, 100%, 68%, ${0.85 * brightness})`);
      bgGrad.addColorStop(0.18, `hsla(205, 100%, 55%, ${0.6 * brightness})`);
      bgGrad.addColorStop(0.4, `hsla(215, 95%, 38%, ${0.28 * brightness})`);
      bgGrad.addColorStop(0.7, `hsla(225, 85%, 22%, ${0.08 * brightness})`);
      bgGrad.addColorStop(1, "hsla(225, 80%, 12%, 0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // ===== 2. Soft shadow rays — punch out the bright bg with =====
      // ===== silhouette stamps zoomed outward from the light source =====
      ctx.globalCompositeOperation = "destination-out";

      const baseScale = starSize / 200; // 200x200 viewBox -> starSize px

      for (let i = 0; i < shadowLayers; i++) {
        const u = i / (shadowLayers - 1 || 1);
        // Easing — most stamps near the source, sparser toward the edge
        const eased = u * u;
        const expand = 1 + eased * (shadowReach - 1);
        // Alpha drops with distance — softens the ray edges
        const alpha = (1 - u) * 0.085;

        ctx.save();
        // Scale around the light source position, then draw star centered at (cx, cy)
        ctx.translate(lx, ly);
        ctx.scale(expand, expand);
        ctx.translate(-lx, -ly);
        ctx.translate(cx, cy);
        ctx.scale(baseScale, baseScale);
        ctx.translate(-100, -100);

        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fill(path);
        ctx.restore();
      }

      // ===== 3. A second, much softer pass with a wider blur for atmospheric =====
      // ===== haze around the shadow rays =====
      ctx.globalCompositeOperation = "destination-out";
      ctx.save();
      // Use a slight blur via filter for the outermost soft halo
      // (filter is supported in all modern browsers; gracefully ignored otherwise)
      try {
        ctx.filter = "blur(6px)";
      } catch {
        /* ignore */
      }
      for (let i = 0; i < 8; i++) {
        const u = i / 7;
        const expand = 1.2 + u * (shadowReach * 1.4);
        const alpha = (1 - u) * 0.04;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.scale(expand, expand);
        ctx.translate(-lx, -ly);
        ctx.translate(cx, cy);
        ctx.scale(baseScale, baseScale);
        ctx.translate(-100, -100);
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.fill(path);
        ctx.restore();
      }
      ctx.restore();
      ctx.filter = "none";

      ctx.globalCompositeOperation = "source-over";

      if (visible && !reducedMotion) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        rafRef.current = null;
      }
    };

    resize();
    draw();

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
  }, [starSize, glowReach, shadowLayers, shadowReach, brightness]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
