import { useEffect, useRef } from "react";

interface InteractiveGridProps {
  cellSize?: number;
  gap?: number;
  className?: string;
  baseAlpha?: number;
  hotAlpha?: number;
  randomPulse?: boolean;
  /**
   * How many autonomous moving light sources travel across the grid.
   * They produce specular highlights and color accents independent
   * of the cursor.
   */
  lightCount?: number;
}

interface LightSource {
  speedX: number;
  speedY: number;
  phaseX: number;
  phaseY: number;
  ampX: number;
  ampY: number;
  cx: number;
  cy: number;
  hue: number;
  radius: number;
  intensity: number;
}

export default function InteractiveGrid({
  cellSize = 32,
  gap = 4,
  className = "",
  baseAlpha = 0.04,
  hotAlpha = 0.95,
  randomPulse = true,
  lightCount = 3,
}: InteractiveGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const seedsRef = useRef<number[]>([]);
  const lightsRef = useRef<LightSource[]>([]);
  const startRef = useRef(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;

    const initLights = () => {
      const palette = [195, 215, 230, 180, 200];
      const arr: LightSource[] = [];
      for (let i = 0; i < lightCount; i++) {
        arr.push({
          speedX: 0.18 + Math.random() * 0.25,
          speedY: 0.14 + Math.random() * 0.22,
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          ampX: 0.32 + Math.random() * 0.18,
          ampY: 0.28 + Math.random() * 0.18,
          cx: 0.5,
          cy: 0.5,
          hue: palette[i % palette.length],
          radius: 220 + Math.random() * 180,
          intensity: 0.85 + Math.random() * 0.4,
        });
      }
      lightsRef.current = arr;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
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
        active:
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom,
      };
    };

    const onLeave = () => {
      mouseRef.current.active = false;
    };

    const draw = () => {
      const { w, h } = sizeRef.current;
      const m = mouseRef.current;
      const t = (performance.now() - startRef.current) / 1000;
      ctx.clearRect(0, 0, w, h);

      // Update light source positions (bouncing harmonic motion)
      for (const L of lightsRef.current) {
        L.cx = w * (0.5 + L.ampX * Math.sin(t * L.speedX + L.phaseX));
        L.cy = h * (0.5 + L.ampY * Math.cos(t * L.speedY + L.phaseY));
      }

      const step = cellSize + gap;
      const cols = Math.ceil(w / step) + 1;
      const rows = Math.ceil(h / step) + 1;

      const cursorRadius = cellSize * 7;

      let idx = 0;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * step;
          const y = j * step;
          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;

          // ===== ACCUMULATE LIGHT FROM ALL SOURCES =====
          let lightR = 0;
          let lightG = 0;
          let lightB = 0;
          let totalI = 0;
          // Direction (where light "comes from" — vector from cell to brightest light)
          let dirX = 0;
          let dirY = 0;

          for (const L of lightsRef.current) {
            const dx = L.cx - cx;
            const dy = L.cy - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > L.radius) continue;
            let intensity = 1 - dist / L.radius;
            intensity = intensity * intensity * L.intensity;

            // HSL hue -> approx RGB for the cyan-blue palette
            // hue range 180-230 -> we'll just use precomputed mapping
            const h = L.hue;
            const sat = 0.95;
            const lit = 0.7;
            const c = (1 - Math.abs(2 * lit - 1)) * sat;
            const xC = c * (1 - Math.abs(((h / 60) % 2) - 1));
            const mC = lit - c / 2;
            let r = 0, g = 0, b = 0;
            if (h < 60) { r = c; g = xC; b = 0; }
            else if (h < 120) { r = xC; g = c; b = 0; }
            else if (h < 180) { r = 0; g = c; b = xC; }
            else if (h < 240) { r = 0; g = xC; b = c; }
            else if (h < 300) { r = xC; g = 0; b = c; }
            else { r = c; g = 0; b = xC; }
            const R = Math.round((r + mC) * 255);
            const G = Math.round((g + mC) * 255);
            const B = Math.round((b + mC) * 255);

            lightR += R * intensity;
            lightG += G * intensity;
            lightB += B * intensity;
            totalI += intensity;

            const inv = 1 / Math.max(dist, 0.001);
            dirX += (dx * inv) * intensity;
            dirY += (dy * inv) * intensity;
          }

          // Cursor adds a strong white-cyan light
          if (m.active) {
            const dx = m.x - cx;
            const dy = m.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < cursorRadius) {
              let intensity = 1 - dist / cursorRadius;
              intensity = intensity * intensity * 1.4;
              lightR += 230 * intensity;
              lightG += 245 * intensity;
              lightB += 255 * intensity;
              totalI += intensity;
              const inv = 1 / Math.max(dist, 0.001);
              dirX += (dx * inv) * intensity * 1.5;
              dirY += (dy * inv) * intensity * 1.5;
            }
          }

          const seed = seedsRef.current[idx++] ?? 0;
          const pulse = randomPulse ? 0.5 + 0.5 * Math.sin(t * 0.7 + seed * 6.28) : 0;

          // ===== BASE TILE (dark navy with subtle gradient) =====
          // Gradient TL -> BR for that "raised glass tile" base
          const baseGrad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
          const baseTop = baseAlpha + pulse * 0.04;
          const baseBot = Math.max(0, baseAlpha - 0.015);
          baseGrad.addColorStop(0, `rgba(80, 130, 220, ${baseTop + 0.03})`);
          baseGrad.addColorStop(0.5, `rgba(40, 80, 180, ${baseTop})`);
          baseGrad.addColorStop(1, `rgba(20, 40, 100, ${baseBot})`);
          ctx.fillStyle = baseGrad;
          ctx.fillRect(x, y, cellSize, cellSize);

          // ===== LIGHT FILL (averaged tinted glow inside the tile) =====
          if (totalI > 0.001) {
            const avgR = Math.min(255, lightR);
            const avgG = Math.min(255, lightG);
            const avgB = Math.min(255, lightB);
            const fillAlpha = Math.min(hotAlpha, totalI * 0.55);
            ctx.fillStyle = `rgba(${avgR}, ${avgG}, ${avgB}, ${fillAlpha})`;
            ctx.fillRect(x, y, cellSize, cellSize);
          }

          // ===== BEVEL: bright top + left edges (always visible — gives 3D feel) =====
          const bevelBase = 0.18 + totalI * 0.5;
          const bevelAlpha = Math.min(1, bevelBase);
          ctx.fillStyle = `rgba(255, 255, 255, ${bevelAlpha * 0.45})`;
          ctx.fillRect(x, y, cellSize, 1);
          ctx.fillRect(x, y, 1, cellSize);

          // ===== BEVEL: dark bottom + right edges =====
          ctx.fillStyle = `rgba(0, 5, 30, ${0.5})`;
          ctx.fillRect(x, y + cellSize - 1, cellSize, 1);
          ctx.fillRect(x + cellSize - 1, y, 1, cellSize);

          // ===== SPECULAR HIGHLIGHT — small bright streak on edge facing dominant light =====
          if (totalI > 0.25) {
            // Normalize direction
            const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
            const nx = dirX / len;
            const ny = dirY / len;

            // Pick which edge gets the highlight by largest absolute component
            const half = cellSize / 2;
            const sx = cx + nx * half * 0.95;
            const sy = cy + ny * half * 0.95;

            const specAlpha = Math.min(1, (totalI - 0.25) * 1.1);
            // Bright specular dot
            const r = Math.max(1.5, cellSize * 0.12);
            const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2);
            grad.addColorStop(0, `rgba(255, 255, 255, ${specAlpha})`);
            grad.addColorStop(0.5, `rgba(220, 240, 255, ${specAlpha * 0.5})`);
            grad.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(sx, sy, r * 2, 0, Math.PI * 2);
            ctx.fill();

            // Inner glass core glow (top-left highlight)
            if (totalI > 0.5) {
              const inset = cellSize * 0.18;
              const innerAlpha = Math.min(1, (totalI - 0.5) * 0.9);
              ctx.fillStyle = `rgba(255, 255, 255, ${innerAlpha * 0.7})`;
              ctx.fillRect(x + inset, y + inset, cellSize * 0.25, cellSize * 0.25);
            }
          }
        }
      }

      if (visible && !reducedMotion) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        rafRef.current = null;
      }
    };

    initLights();
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
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [cellSize, gap, baseAlpha, hotAlpha, randomPulse, lightCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
