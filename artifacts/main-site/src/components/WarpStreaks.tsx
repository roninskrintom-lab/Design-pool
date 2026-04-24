import { useEffect, useRef } from "react";

/**
 * Warp-speed light streaks emanating from a central vanishing point.
 * Matches the "tunnel of light" frame in the reference video.
 */
export default function WarpStreaks({
  density = 80,
  className = "",
}: {
  density?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const rafRef = useRef<number | null>(null);
  const streaksRef = useRef<
    { angle: number; radius: number; speed: number; length: number; alpha: number }[]
  >([]);

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
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Initialize streaks
      const arr = [];
      for (let i = 0; i < density; i++) {
        arr.push({
          angle: Math.random() * Math.PI * 2,
          radius: Math.random() * Math.max(rect.width, rect.height) * 0.5,
          speed: 0.4 + Math.random() * 1.6,
          length: 30 + Math.random() * 120,
          alpha: 0.3 + Math.random() * 0.6,
        });
      }
      streaksRef.current = arr;
    };

    const draw = () => {
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy);

      ctx.clearRect(0, 0, w, h);

      for (const s of streaksRef.current) {
        s.radius += s.speed * (1 + s.radius / 200);

        if (s.radius > maxR + 100) {
          s.radius = 0;
          s.angle = Math.random() * Math.PI * 2;
          s.speed = 0.4 + Math.random() * 1.6;
          s.length = 30 + Math.random() * 120;
          s.alpha = 0.3 + Math.random() * 0.6;
        }

        const x1 = cx + Math.cos(s.angle) * s.radius;
        const y1 = cy + Math.sin(s.angle) * s.radius;
        const x2 = cx + Math.cos(s.angle) * Math.max(0, s.radius - s.length);
        const y2 = cy + Math.sin(s.angle) * Math.max(0, s.radius - s.length);

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        const distFactor = Math.min(1, s.radius / maxR);
        grad.addColorStop(0, `rgba(190, 230, 255, ${s.alpha * distFactor})`);
        grad.addColorStop(1, `rgba(60, 140, 255, 0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1 + distFactor * 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

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
          if (visible && rafRef.current === null && !reducedMotion) {
            draw();
          }
        }
      },
      { rootMargin: "150px" }
    );
    io.observe(canvas);

    window.addEventListener("resize", resize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
