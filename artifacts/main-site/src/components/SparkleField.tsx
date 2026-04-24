import { useEffect, useRef } from "react";

interface SparkleFieldProps {
  count?: number;
  className?: string;
}

/**
 * Lightweight starfield with twinkling sparkles.
 * Single canvas, IO-paused when offscreen.
 */
export default function SparkleField({ count = 60, className = "" }: SparkleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef<number | null>(null);
  const sparklesRef = useRef<
    { x: number; y: number; r: number; phase: number; speed: number; baseAlpha: number }[]
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const arr = [];
      for (let i = 0; i < count; i++) {
        arr.push({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          r: 0.6 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 1.6,
          baseAlpha: 0.3 + Math.random() * 0.7,
        });
      }
      sparklesRef.current = arr;
    };

    const start = performance.now();
    const draw = () => {
      const { w, h } = sizeRef.current;
      const t = (performance.now() - start) / 1000;
      ctx.clearRect(0, 0, w, h);

      for (const s of sparklesRef.current) {
        const tw = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        const a = s.baseAlpha * (0.3 + 0.7 * tw);

        // Soft halo
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 6);
        grad.addColorStop(0, `rgba(190, 230, 255, ${a * 0.7})`);
        grad.addColorStop(1, "rgba(190, 230, 255, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 6, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (visible && !reduced) {
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
          if (visible && rafRef.current === null && !reduced) draw();
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
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
