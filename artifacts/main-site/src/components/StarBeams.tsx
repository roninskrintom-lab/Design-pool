import { useEffect, useRef } from "react";
import { getLightSourcePosition } from "@/lib/lightSource";

interface StarBeamsProps {
  /** Number of radial beams */
  count?: number;
  /** Maximum beam length as fraction of viewport diagonal */
  reach?: number;
  /** Base intensity multiplier 0..1 */
  intensity?: number;
  className?: string;
}

interface Beam {
  baseAngle: number;
  jitter: number;
  width: number;
  lengthMul: number;
  intensityPhase: number;
  intensitySpeed: number;
  hue: number;
}

/**
 * Volumetric radial light beams that look like they're emanating from a
 * source point BEHIND the star. The source point drifts in a slow
 * lissajous pattern so the beams sweep across the scene like a
 * moving spotlight behind the focal element.
 */
export default function StarBeams({
  count = 28,
  reach = 0.75,
  intensity = 1,
  className = "",
}: StarBeamsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(performance.now());
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const beamsRef = useRef<Beam[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;

    const initBeams = () => {
      const palette = [195, 200, 205, 210, 215, 220, 190];
      const beams: Beam[] = [];
      for (let i = 0; i < count; i++) {
        beams.push({
          baseAngle: (i / count) * Math.PI * 2,
          jitter: (Math.random() - 0.5) * 0.12,
          width: 4 + Math.random() * 28,
          lengthMul: 0.55 + Math.random() * 0.55,
          intensityPhase: Math.random() * Math.PI * 2,
          intensitySpeed: 0.4 + Math.random() * 0.9,
          hue: palette[i % palette.length] + (Math.random() - 0.5) * 14,
        });
      }
      beamsRef.current = beams;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const { w, h } = sizeRef.current;
      const t = (performance.now() - startRef.current) / 1000;

      ctx.clearRect(0, 0, w, h);

      // Source point — drifts behind the star in a slow lissajous pattern.
      // Shared with GlowingStar so the star's facet shading stays in sync.
      const cx = w / 2;
      const cy = h / 2;
      const ls = getLightSourcePosition(t);
      const driftX = ls.x * w * 0.12;
      const driftY = ls.y * h * 0.1;
      const sx = cx + driftX;
      const sy = cy + driftY;

      // Slow global rotation for sweeping effect
      const globalRot = t * 0.03;

      // Distance from source to "viewer" (star) — controls perceived intensity
      const proximity = 1 - Math.min(1, Math.sqrt(driftX * driftX + driftY * driftY) / (w * 0.15));

      const maxLen = Math.sqrt(w * w + h * h) * reach;

      ctx.globalCompositeOperation = "lighter";

      for (const beam of beamsRef.current) {
        const angle = beam.baseAngle + globalRot + beam.jitter;
        // Per-beam flickering intensity
        const flicker =
          0.45 +
          0.55 * (0.5 + 0.5 * Math.sin(t * beam.intensitySpeed + beam.intensityPhase));

        const length = maxLen * beam.lengthMul;
        const alpha = flicker * intensity * (0.55 + proximity * 0.45);

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);

        // Linear gradient along beam direction (X axis after rotation)
        const grad = ctx.createLinearGradient(0, 0, length, 0);
        grad.addColorStop(0, `hsla(${beam.hue}, 100%, 92%, ${alpha * 0.9})`);
        grad.addColorStop(0.05, `hsla(${beam.hue}, 100%, 80%, ${alpha * 0.7})`);
        grad.addColorStop(0.25, `hsla(${beam.hue}, 100%, 60%, ${alpha * 0.32})`);
        grad.addColorStop(0.55, `hsla(${beam.hue}, 90%, 45%, ${alpha * 0.12})`);
        grad.addColorStop(1, `hsla(${beam.hue}, 80%, 30%, 0)`);

        ctx.fillStyle = grad;

        // Trapezoid: starts narrow at source, flares out to width at far end (godray look)
        const nearW = 0.5;
        const farW = beam.width;
        ctx.beginPath();
        ctx.moveTo(0, -nearW);
        ctx.lineTo(0, nearW);
        ctx.lineTo(length, farW);
        ctx.lineTo(length, -farW);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // Bright bloom at the source point (the "light source itself" peeking from behind the star)
      const bloomR = 220 + Math.sin(t * 1.3) * 30;
      const bloomGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, bloomR);
      bloomGrad.addColorStop(0, `hsla(195, 100%, 92%, ${0.5 * intensity})`);
      bloomGrad.addColorStop(0.3, `hsla(200, 100%, 65%, ${0.25 * intensity})`);
      bloomGrad.addColorStop(1, "hsla(210, 80%, 30%, 0)");
      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, bloomR, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";

      if (visible && !reducedMotion) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        rafRef.current = null;
      }
    };

    initBeams();
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
  }, [count, reach, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
