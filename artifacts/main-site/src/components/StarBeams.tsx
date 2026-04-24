import { useEffect, useMemo, useRef } from "react";
import { getLightSourcePosition } from "@/lib/lightSource";
import { STAR_PATH } from "@/lib/starPath";

interface StarBeamsProps {
  /** Outer reach of the soft drifting ambient glow in CSS pixels */
  glowReach?: number;
  /** Overall brightness multiplier (0..1) */
  brightness?: number;
  /** Horizontal stretch of the ambient glow (1 = circular, >1 = wider) */
  spread?: number;
  /** Vertical bias of the glow center relative to canvas center (negative = up) */
  yBias?: number;
  /** Radius of the fixed bright "lamp" sitting directly behind the star */
  lampRadius?: number;
  /** Brightness of the fixed lamp (0..1+) */
  lampIntensity?: number;
  /**
   * Length of the four diagonal glow streaks that bleed out between the
   * star's points (45°, 135°, 225°, 315°). They emulate light wrapping
   * around the star silhouette rather than rays from its center.
   */
  streakReach?: number;
  /** Strength of the directional streaks (0 = none, 1 = strong) */
  streakStrength?: number;
  /**
   * Size (px) of the soft volumetric shadow drawn in the star's silhouette
   * over the back-light. Emulates the penumbra around an occluder. Set to 0
   * to disable. Should roughly match the actual star size.
   */
  starShadowSize?: number;
  /** Gaussian blur amount applied to the shadow shape (px) */
  starShadowBlur?: number;
  /** Opacity of the shadow shape (0..1) */
  starShadowOpacity?: number;
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
  lampRadius = 380,
  lampIntensity = 1,
  streakReach = 720,
  streakStrength = 1,
  starShadowSize = 0,
  starShadowBlur = 32,
  starShadowOpacity = 0.55,
  className = "",
}: StarBeamsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(performance.now());
  const sizeRef = useRef({ w: 0, h: 0 });

  // Build the star Path2D once — used for the shadow halo (cheap & reusable)
  const starPath = useMemo(() => new Path2D(STAR_PATH), []);

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

      // ===== Layer 1: very faint atmospheric haze =====
      // Gives the scene a slight cyan ambient tint without competing with
      // the star or text. Drifts with the ambient light source.
      const haze = ctx.createRadialGradient(lx, ly, 0, lx, ly, reach * 1.3);
      haze.addColorStop(0, `hsla(205, 100%, 50%, ${0.08 * brightness})`);
      haze.addColorStop(0.45, `hsla(215, 95%, 35%, ${0.04 * brightness})`);
      haze.addColorStop(0.8, `hsla(222, 90%, 22%, ${0.012 * brightness})`);
      haze.addColorStop(1, "hsla(225, 80%, 12%, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);

      // ===== Layer 2: subtle drifting softbox (ambient back-light) =====
      // Slightly stretched horizontally — adds the "play with light" feel
      // without dominating. Much subtler than the fixed lamp.
      ctx.save();
      ctx.translate(lx, ly);
      ctx.scale(spread, 1);
      ctx.translate(-lx, -ly);

      const main = ctx.createRadialGradient(lx, ly, 0, lx, ly, reach);
      main.addColorStop(0, `hsla(195, 95%, 70%, ${0.22 * brightness})`);
      main.addColorStop(0.15, `hsla(198, 95%, 62%, ${0.16 * brightness})`);
      main.addColorStop(0.35, `hsla(204, 100%, 52%, ${0.1 * brightness})`);
      main.addColorStop(0.6, `hsla(212, 95%, 42%, ${0.05 * brightness})`);
      main.addColorStop(0.85, `hsla(220, 90%, 28%, ${0.02 * brightness})`);
      main.addColorStop(1, "hsla(225, 80%, 12%, 0)");
      ctx.fillStyle = main;
      ctx.fillRect(lx - reach * 2, ly - reach * 2, reach * 4, reach * 4);
      ctx.restore();

      // ===== Layer 3: 4 diagonal glow streaks between the star's points =====
      // The star has 4 points along the cardinal axes (N/E/S/W); the gaps
      // between them sit on the diagonals (NE/SE/SW/NW). Light "leaks" out
      // through these gaps, forming 4 elongated cyan streaks. Each streak's
      // opacity is modulated by where the drifting source is — when the
      // source moves toward NE, the NE streak brightens; the opposite (SW)
      // dims, giving the "play with light" rotation feel.
      const streakAngles = [45, 135, 225, 315];
      const streakOff = lampRadius * 0.55;
      for (const deg of streakAngles) {
        const a = (deg * Math.PI) / 180;
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        // Dot product with light direction → -1..1 → modulation 0.45..1.0
        const dot = ls.x * dx + ls.y * dy;
        const mod = 0.45 + (dot * 0.5 + 0.5) * 0.55;

        ctx.save();
        ctx.translate(cx + dx * streakOff, cy + dy * streakOff);
        ctx.rotate(a);
        ctx.scale(2.2, 0.65); // elongated along its diagonal axis

        const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, streakReach);
        sg.addColorStop(0, `hsla(192, 100%, 78%, ${0.55 * mod * streakStrength * brightness})`);
        sg.addColorStop(0.18, `hsla(196, 100%, 66%, ${0.38 * mod * streakStrength * brightness})`);
        sg.addColorStop(0.45, `hsla(204, 100%, 52%, ${0.18 * mod * streakStrength * brightness})`);
        sg.addColorStop(0.75, `hsla(214, 95%, 38%, ${0.06 * mod * streakStrength * brightness})`);
        sg.addColorStop(1, "hsla(222, 88%, 22%, 0)");
        ctx.fillStyle = sg;
        ctx.fillRect(-streakReach * 1.5, -streakReach * 1.5, streakReach * 3, streakReach * 3);
        ctx.restore();
      }

      // ===== Layer 4: FIXED bright "lamp" centered behind the star =====
      // The actual light source — fixed (no drift), so the bright wraparound
      // at the star's edges stays symmetric. Pulses gently in time.
      const lampPulse = 1 + Math.sin(t * 0.6) * 0.08;
      const lr = lampRadius * lampPulse;
      const lamp = ctx.createRadialGradient(cx, cy, 0, cx, cy, lr);
      lamp.addColorStop(0, `hsla(190, 100%, 92%, ${0.85 * lampIntensity * brightness})`);
      lamp.addColorStop(0.12, `hsla(192, 100%, 80%, ${0.7 * lampIntensity * brightness})`);
      lamp.addColorStop(0.3, `hsla(196, 100%, 65%, ${0.45 * lampIntensity * brightness})`);
      lamp.addColorStop(0.55, `hsla(202, 100%, 52%, ${0.22 * lampIntensity * brightness})`);
      lamp.addColorStop(0.8, `hsla(210, 95%, 40%, ${0.08 * lampIntensity * brightness})`);
      lamp.addColorStop(1, "hsla(218, 90%, 25%, 0)");
      ctx.fillStyle = lamp;
      ctx.fillRect(cx - lr, cy - lr, lr * 2, lr * 2);

      // ===== Layer 5: tiny intense hot core right at lamp center =====
      const hot = ctx.createRadialGradient(cx, cy, 0, cx, cy, lampRadius * 0.18);
      hot.addColorStop(0, `hsla(185, 100%, 98%, ${0.95 * lampIntensity * brightness})`);
      hot.addColorStop(0.4, `hsla(192, 100%, 85%, ${0.55 * lampIntensity * brightness})`);
      hot.addColorStop(1, "hsla(200, 100%, 65%, 0)");
      ctx.fillStyle = hot;
      ctx.fillRect(cx - lampRadius, cy - lampRadius, lampRadius * 2, lampRadius * 2);

      // ===== Layer 6: volumetric occlusion shadow at the star's silhouette =====
      // A blurred dark star shape darkens the back-light exactly where the
      // star sits, creating the soft penumbra you'd expect when a solid
      // object blocks a diffuse light source. Drawn slightly larger than
      // the actual star so the shadow extends a touch past the silhouette
      // edge, blending into the surrounding glow. The real SVG star sits
      // on top of the canvas in the DOM — the dark shape underneath gives
      // the silhouette a believable "shadowed border" feel.
      if (starShadowSize > 0) {
        const sScale = starShadowSize / 200;
        ctx.save();
        ctx.filter = `blur(${starShadowBlur}px)`;
        ctx.fillStyle = `hsla(228, 95%, 4%, ${starShadowOpacity})`;
        ctx.translate(cx, cy);
        ctx.scale(sScale, sScale);
        ctx.translate(-100, -100);
        ctx.fill(starPath);
        ctx.restore();
      }

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
  }, [
    glowReach,
    brightness,
    spread,
    yBias,
    lampRadius,
    lampIntensity,
    streakReach,
    streakStrength,
    starShadowSize,
    starShadowBlur,
    starShadowOpacity,
    starPath,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
