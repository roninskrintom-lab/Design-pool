import { useEffect, useRef } from "react";

interface InteractiveGridProps {
  cellSize?: number;
  gap?: number;
  className?: string;
  baseAlpha?: number;
  hotAlpha?: number;
  randomPulse?: boolean;
}

export default function InteractiveGrid({
  cellSize = 32,
  gap = 4,
  className = "",
  baseAlpha = 0.04,
  hotAlpha = 0.95,
  randomPulse = true,
}: InteractiveGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const seedsRef = useRef<number[]>([]);
  const startRef = useRef(performance.now());

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

      const cols = Math.ceil(rect.width / (cellSize + gap)) + 1;
      const rows = Math.ceil(rect.height / (cellSize + gap)) + 1;
      const total = cols * rows;
      const seeds: number[] = [];
      for (let i = 0; i < total; i++) seeds.push(Math.random());
      seedsRef.current = seeds;
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    const draw = () => {
      const { w, h } = sizeRef.current;
      const m = mouseRef.current;
      const t = (performance.now() - startRef.current) / 1000;
      ctx.clearRect(0, 0, w, h);

      const step = cellSize + gap;
      const cols = Math.ceil(w / step) + 1;
      const rows = Math.ceil(h / step) + 1;
      const radius = cellSize * 6;

      let idx = 0;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * step;
          const y = j * step;
          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;

          const dx = cx - m.x;
          const dy = cy - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const proximity = Math.max(0, 1 - dist / radius);
          const easedProx = proximity * proximity;

          const seed = seedsRef.current[idx++] ?? 0;
          const pulse = randomPulse
            ? 0.5 + 0.5 * Math.sin(t * 0.7 + seed * 6.28)
            : 0;
          const ambient = baseAlpha + pulse * 0.06;

          const alpha = Math.min(1, ambient + (hotAlpha - ambient) * easedProx);

          // Color: deep blue at rest -> bright cyan/white at hot
          const hot = easedProx;
          const r = Math.round(40 * (1 - hot) + 220 * hot);
          const g = Math.round(80 * (1 - hot) + 240 * hot);
          const b = Math.round(180 * (1 - hot) + 255 * hot);

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fillRect(x, y, cellSize, cellSize);

          // Inner brighter core for hot cells
          if (hot > 0.4) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(hot - 0.4) * 0.9})`;
            const inset = cellSize * 0.25;
            ctx.fillRect(x + inset, y + inset, cellSize - inset * 2, cellSize - inset * 2);
          }
        }
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
      { rootMargin: "100px" }
    );
    io.observe(canvas);

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [cellSize, gap, baseAlpha, hotAlpha, randomPulse]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
