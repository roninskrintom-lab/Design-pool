/**
 * Soft horizon glow line — used in footer like the reference video.
 */
export default function HorizonGlow({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Curved bright line */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[200%] h-[800px] rounded-[100%] border-t border-primary/60"
        style={{
          background:
            "radial-gradient(ellipse 70% 30% at 50% 0%, hsl(200 100% 60% / 0.35), transparent 60%)",
          boxShadow:
            "0 -2px 30px hsl(200 100% 65% / 0.55), 0 -1px 10px hsl(195 100% 80% / 0.6)",
        }}
      />
      {/* Bright spot on the horizon */}
      <div
        className="absolute left-[20%] -translate-x-1/2 -translate-y-1/2 top-0 w-32 h-32 rounded-full"
        style={{
          background:
            "radial-gradient(circle, white 0%, hsl(195 100% 80%) 25%, transparent 60%)",
          filter: "blur(6px)",
        }}
      />
    </div>
  );
}
