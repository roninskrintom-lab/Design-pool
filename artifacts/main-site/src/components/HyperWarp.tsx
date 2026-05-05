import { useEffect, useRef } from "react";

type Streak = {
  angle: number;
  dist: number;
  speed: number;
  hue: number;
  alpha: number;
  thickness: number;
};

type Square = {
  angle: number;
  dist: number;
  speed: number;
  size: number;
  rot: number;
  rotSpeed: number;
};

/**
 * Hyperspace warp section — long radial streaks in cyan + magenta,
 * 4 bright squares flying outward, dark central void for text overlay.
 *
 * Per-particle lifecycle ~9–14s so streaks visibly elongate and
 * accelerate, matching the reference's slow build-up.
 */
export default function HyperWarp({
  streakCount = 240,
  intensity = 1,
  voidRadiusFactor = 0.28,
  className = "",
}: {
  streakCount?: number;
  intensity?: number;
  voidRadiusFactor?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef<number | null>(null);
  const streaksRef = useRef<Streak[]>([]);
  const squaresRef = useRef<Square[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;

    const initStreak = (s: Streak, maxR: number, fresh = false) => {
      s.angle = Math.random() * Math.PI * 2;
      // Stagger initial dist on first init so we see streaks at all stages.
      // Cap respawn dist at 56 so even on small viewports the streak still
      // travels far enough to satisfy the ~9s minimum lifetime budget.
      s.dist = fresh
        ? 26 + Math.random() * (maxR * 0.6)
        : 22 + Math.random() * 34;
      s.speed = 0.35 + Math.random() * 0.65;
      // 55% cyan-blue range, 45% pink-magenta range
      s.hue =
        Math.random() < 0.55
          ? 188 + Math.random() * 30 // 188–218 cyan / electric blue
          : 305 + Math.random() * 28; // 305–333 magenta / hot pink
      s.alpha = 0.75 + Math.random() * 0.25;
      // Beefier base thickness — closer to the reference's chunky neon look.
      s.thickness = 2.2 + Math.random() * 2.8;
    };

    const initSquare = (sq: Square, idx: number) => {
      // Fixed cardinal-diagonal anchors — like the reference
      const baseAngles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
      sq.angle = baseAngles[idx] + (Math.random() - 0.5) * 0.15;
      sq.dist = 70 + Math.random() * 40;
      sq.speed = 0.8 + Math.random() * 0.4;
      sq.size = 9 + Math.random() * 4;
      sq.rot = Math.random() * Math.PI;
      sq.rotSpeed = (Math.random() - 0.5) * 0.012;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const maxR = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;

      const arr: Streak[] = [];
      for (let i = 0; i < streakCount; i++) {
        const s: Streak = { angle: 0, dist: 0, speed: 0, hue: 0, alpha: 0, thickness: 0 };
        initStreak(s, maxR, true);
        arr.push(s);
      }
      streaksRef.current = arr;

      const sqArr: Square[] = [];
      for (let i = 0; i < 4; i++) {
        const sq: Square = { angle: 0, dist: 0, speed: 0, size: 0, rot: 0, rotSpeed: 0 };
        initSquare(sq, i);
        sqArr.push(sq);
      }
      squaresRef.current = sqArr;

      if (rafRef.current === null) draw();
    };

    const draw = () => {
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy) + 80;

      // Hard clear — clean streaks, no motion-blur smear
      ctx.clearRect(0, 0, w, h);

      // ===== Streaks =====
      ctx.lineCap = "round";
      for (const s of streaksRef.current) {
        const prevDist = s.dist;
        // Exponential perspective acceleration — slow start, fast finish.
        // Bumped per user feedback ("particles must move faster"): lifetime
        // now ~4–5.6s (max→min speed) — closer to the reference video pace.
        s.dist *= 1.008 + s.speed * 0.006;

        if (s.dist > maxR) {
          initStreak(s, maxR);
          continue;
        }

        const distFactor = Math.min(1, s.dist / maxR);
        // Trail length: max of "instantaneous velocity" and "perspective length".
        // Long near edge, short near center → classic warp look.
        const trailLen = Math.max(s.dist - prevDist, s.dist * 0.45);

        const ca = Math.cos(s.angle);
        const sa = Math.sin(s.angle);
        const x1 = cx + ca * s.dist;
        const y1 = cy + sa * s.dist;
        const x2 = cx + ca * Math.max(0, s.dist - trailLen);
        const y2 = cy + sa * Math.max(0, s.dist - trailLen);

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        const a = s.alpha * distFactor * intensity;
        grad.addColorStop(0, `hsla(${s.hue}, 100%, 82%, ${a})`);
        grad.addColorStop(0.32, `hsla(${s.hue}, 100%, 65%, ${a * 0.7})`);
        grad.addColorStop(1, `hsla(${s.hue}, 95%, 45%, 0)`);

        ctx.strokeStyle = grad;
        // Fatter near the edge — perspective makes "close" particles thick.
        ctx.lineWidth = s.thickness * (0.7 + distFactor * 1.8);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // ===== 4 white glowing squares =====
      for (const sq of squaresRef.current) {
        // Slower than streaks but still snappy — squares linger ~6–8s.
        sq.dist *= 1.0048 + sq.speed * 0.0035;
        sq.rot += sq.rotSpeed;

        if (sq.dist > maxR * 0.92) {
          // Reset closer to center, slight angle wobble
          sq.dist = 60 + Math.random() * 30;
          sq.angle += (Math.random() - 0.5) * 0.05;
        }

        const distFactor = Math.min(1, sq.dist / (maxR * 0.92));
        const sz = sq.size * (0.45 + distFactor * 1.4);
        const alpha = Math.min(1, 0.25 + distFactor * 1.05) * intensity;

        const x = cx + Math.cos(sq.angle) * sq.dist;
        const y = cy + Math.sin(sq.angle) * sq.dist;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(sq.rot);

        // Wide soft halo
        const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 4.5);
        halo.addColorStop(0, `hsla(195, 100%, 90%, ${alpha * 0.55})`);
        halo.addColorStop(0.35, `hsla(200, 100%, 75%, ${alpha * 0.22})`);
        halo.addColorStop(1, `hsla(210, 100%, 55%, 0)`);
        ctx.fillStyle = halo;
        ctx.fillRect(-sz * 4.5, -sz * 4.5, sz * 9, sz * 9);

        // Bright white square core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(-sz, -sz, sz * 2, sz * 2);

        // Inner highlight to keep it crisp
        ctx.fillStyle = `rgba(220, 245, 255, ${alpha * 0.85})`;
        ctx.fillRect(-sz * 0.55, -sz * 0.55, sz * 1.1, sz * 1.1);

        ctx.restore();
      }

      // ===== Central dark void (where the text sits) =====
      const vr = Math.min(w, h) * voidRadiusFactor;
      const voidGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, vr * 1.7);
      voidGrad.addColorStop(0, "rgba(2, 6, 17, 1)");
      voidGrad.addColorStop(0.55, "rgba(2, 6, 17, 0.96)");
      voidGrad.addColorStop(0.78, "rgba(2, 6, 17, 0.55)");
      voidGrad.addColorStop(1, "rgba(2, 6, 17, 0)");
      ctx.fillStyle = voidGrad;
      ctx.fillRect(0, 0, w, h);

      if (visible && !reducedMotion) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        rafRef.current = null;
      }
    };

    resize();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible = e.isIntersecting;
          if (visible && rafRef.current === null && !reducedMotion) draw();
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
  }, [streakCount, intensity, voidRadiusFactor]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
