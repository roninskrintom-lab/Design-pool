import { useEffect, useRef } from "react";

interface InteractiveGridProps {
  cellSize?: number;
  className?: string;
}

export default function InteractiveGrid({
  cellSize = 60,
  className = "",
}: InteractiveGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
      ctx.clearRect(0, 0, w, h);

      const cols = Math.ceil(w / cellSize);
      const rows = Math.ceil(h / cellSize);
      const radius = cellSize * 4;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * cellSize;
          const y = j * cellSize;

          const dx = x - m.x;
          const dy = y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / radius);

          // Base dot
          const baseAlpha = 0.08;
          const hotAlpha = 0.6;
          const alpha = baseAlpha + (hotAlpha - baseAlpha) * influence;

          // Color shift toward primary (gold) when close
          const r = Math.round(212 * influence + 255 * (1 - influence));
          const g = Math.round(175 * influence + 255 * (1 - influence));
          const b = Math.round(55 * influence + 255 * (1 - influence));

          const dotSize = 1 + influence * 2.5;

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw cell highlight under cursor
      if (m.x > -9000) {
        const cellX = Math.floor(m.x / cellSize) * cellSize;
        const cellY = Math.floor(m.y / cellSize) * cellSize;
        ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX, cellY, cellSize, cellSize);

        // Neighbor cells with decreasing alpha
        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            if (i === 0 && j === 0) continue;
            const dist = Math.sqrt(i * i + j * j);
            const a = Math.max(0, 0.18 - dist * 0.06);
            if (a <= 0) continue;
            ctx.strokeStyle = `rgba(212, 175, 55, ${a})`;
            ctx.strokeRect(
              cellX + i * cellSize,
              cellY + j * cellSize,
              cellSize,
              cellSize,
            );
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [cellSize]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
