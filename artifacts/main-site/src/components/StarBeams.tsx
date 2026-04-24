import { useEffect, useRef } from "react";
import { getLightSourcePosition } from "@/lib/lightSource";

const STAR_PATH_STR =
  "M 100 0 C 100 60, 140 100, 200 100 C 140 100, 100 140, 100 200 C 100 140, 60 100, 0 100 C 60 100, 100 60, 100 0 Z";

interface StarBeamsProps {
  starSize?: number;
  glowReach?: number;
  shadowLayers?: number;
  shadowReach?: number;
  brightness?: number;
  /** Number of bright god-ray streaks fanning out from the source */
  rayCount?: number;
  /** Multiplier for the bright god-rays' intensity */
  rayIntensity?: number;
  className?: string;
}

interface Beam {
  baseAngle: number;
  jitter: number;
  width: number;
  lengthMul: number;
  intensityPhase: number;
  intensitySpeed: number;
  intensityBase: number;
  hue: number;
}

/**
 * Cinematic back-light for the star:
 *   1. Wide bright cyan halo behind the scene (the "lamp")
 *   2. Long bright god-ray streaks emanating from the moving light source
 *   3. Star silhouette punches out a dark hole + dark trails (shadow rays)
 *      revealing the deep navy background — soft, smooth, never sharp.
 *
 * The light source position is shared with `GlowingStar` via
 * `getLightSourcePosition(t)`, so all light/shadow direction stays in sync.
 */
export default function StarBeams({
  starSize = 680,
  glowReach = 720,
  shadowLayers = 50,
  shadowReach = 9,
  brightness = 0.95,
  rayCount = 44,
  rayIntensity = 0.85,
  className = "",
}: StarBeamsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(performance.now());
  const sizeRef = useRef({ w: 0, h: 0 });
  const pathRef = useRef<Path2D | null>(null);
  const beamsRef = useRef<Beam[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    pathRef.current = new Path2D(STAR_PATH_STR);

    // Initialize the bright god-ray beams with varied params
    const palette = [188, 195, 200, 205, 210, 215, 220];
    const beams: Beam[] = [];
    for (let i = 0; i < rayCount; i++) {
      beams.push({
        baseAngle: (i / rayCount) * Math.PI * 2,
        jitter: (Math.random() - 0.5) * 0.18,
        width: 8 + Math.random() * 60,
        lengthMul: 0.55 + Math.random() * 0.55,
        intensityPhase: Math.random() * Math.PI * 2,
        intensitySpeed: 0.35 + Math.random() * 0.85,
        intensityBase: 0.4 + Math.random() * 0.7,
        hue: palette[i % palette.length] + (Math.random() - 0.5) * 12,
      });
    }
    beamsRef.current = beams;

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
      const path = pathRef.current!;
      const beamsArr = beamsRef.current;

      const cx = w / 2;
      const cy = h / 2;

      // Light source drifts in a slow lissajous BEHIND the star
      const ls = getLightSourcePosition(t);
      const driftStrength = starSize * 0.16;
      const lx = cx + ls.x * driftStrength;
      const ly = cy + ls.y * driftStrength;

      // Slow global rotation so god-rays subtly sweep over time
      const globalRot = t * 0.022;

      const maxLen = Math.sqrt(w * w + h * h) * 0.85;

      ctx.clearRect(0, 0, w, h);

      // ========= 1. Wide bright back-glow (the "lamp" behind everything) =========
      const bgGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, glowReach);
      bgGrad.addColorStop(0, `hsla(193, 100%, 88%, ${0.95 * brightness})`);
      bgGrad.addColorStop(0.06, `hsla(196, 100%, 75%, ${0.9 * brightness})`);
      bgGrad.addColorStop(0.18, `hsla(202, 100%, 60%, ${0.7 * brightness})`);
      bgGrad.addColorStop(0.36, `hsla(212, 100%, 45%, ${0.45 * brightness})`);
      bgGrad.addColorStop(0.6, `hsla(220, 95%, 30%, ${0.18 * brightness})`);
      bgGrad.addColorStop(0.85, `hsla(225, 85%, 18%, ${0.05 * brightness})`);
      bgGrad.addColorStop(1, "hsla(225, 80%, 12%, 0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // ========= 2. Bright god-ray streaks emanating from the source =========
      ctx.globalCompositeOperation = "lighter";
      for (const beam of beamsArr) {
        const angle = beam.baseAngle + globalRot + beam.jitter;
        const length = maxLen * beam.lengthMul;
        const flicker =
          0.55 + 0.45 * Math.sin(t * beam.intensitySpeed + beam.intensityPhase);
        const alpha = beam.intensityBase * flicker * rayIntensity;

        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle);

        const grad = ctx.createLinearGradient(0, 0, length, 0);
        grad.addColorStop(0, `hsla(${beam.hue}, 100%, 92%, ${alpha * 0.95})`);
        grad.addColorStop(0.04, `hsla(${beam.hue}, 100%, 80%, ${alpha * 0.78})`);
        grad.addColorStop(0.18, `hsla(${beam.hue}, 100%, 62%, ${alpha * 0.4})`);
        grad.addColorStop(0.45, `hsla(${beam.hue}, 95%, 45%, ${alpha * 0.16})`);
        grad.addColorStop(0.75, `hsla(${beam.hue}, 90%, 30%, ${alpha * 0.04})`);
        grad.addColorStop(1, `hsla(${beam.hue}, 85%, 20%, 0)`);

        ctx.fillStyle = grad;

        // Trapezoid: narrow at source, flares out (god-ray look)
        const nearW = 0.6;
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

      // ========= 3. A small bright "lamp bulb" at the source itself =========
      const bulbR = 90 + Math.sin(t * 1.2) * 18;
      const bulb = ctx.createRadialGradient(lx, ly, 0, lx, ly, bulbR);
      bulb.addColorStop(0, `hsla(190, 100%, 95%, ${0.7 * brightness})`);
      bulb.addColorStop(0.4, `hsla(200, 100%, 70%, ${0.35 * brightness})`);
      bulb.addColorStop(1, "hsla(210, 95%, 50%, 0)");
      ctx.fillStyle = bulb;
      ctx.beginPath();
      ctx.arc(lx, ly, bulbR, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";

      // ========= 4. Star silhouette occlusion — punches out dark shadow trails =========
      ctx.globalCompositeOperation = "destination-out";
      const baseScale = starSize / 200;

      for (let i = 0; i < shadowLayers; i++) {
        const u = i / (shadowLayers - 1 || 1);
        const eased = u * u;
        const expand = 1 + eased * (shadowReach - 1);
        const alpha = (1 - u) * 0.085;

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

      // ========= 5. Atmospheric soft outer haze (extra blurred shadow) =========
      ctx.save();
      try {
        ctx.filter = "blur(8px)";
      } catch {
        /* ignore */
      }
      for (let i = 0; i < 8; i++) {
        const u = i / 7;
        const expand = 1.4 + u * (shadowReach * 1.5);
        const alpha = (1 - u) * 0.045;
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

    // resize() already kicks off the first draw when no RAF is scheduled,
    // so we must not call draw() again here — that would start a second loop.
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
  }, [starSize, glowReach, shadowLayers, shadowReach, brightness, rayCount, rayIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
