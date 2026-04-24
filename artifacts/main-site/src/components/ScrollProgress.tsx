import { useEffect, useState } from "react";

/**
 * Vertical battery-style scroll progress indicator (left edge),
 * matching the reference video.
 */
export default function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const p = total > 0 ? (h.scrollTop / total) * 100 : 0;
      setPct(Math.max(0, Math.min(100, p)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const segments = 16;
  const filled = Math.round((pct / 100) * segments);

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-2 select-none pointer-events-none">
      <div className="flex flex-col gap-[3px]">
        {Array.from({ length: segments }).map((_, i) => {
          const isOn = i < filled;
          return (
            <div
              key={i}
              className={`w-3 h-[6px] rounded-[1px] transition-all duration-300 ${
                isOn
                  ? "bg-primary shadow-[0_0_8px_hsl(200_100%_62%/0.8)]"
                  : "bg-white/12"
              }`}
            />
          );
        })}
      </div>
      <div className="text-[10px] tracking-[0.2em] text-primary font-mono mt-1 tabular-nums">
        {Math.round(pct).toString().padStart(2, "0")}%
      </div>
    </div>
  );
}
