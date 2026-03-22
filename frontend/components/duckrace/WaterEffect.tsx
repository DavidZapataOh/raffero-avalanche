"use client";

import { cn } from "@/lib/utils";

interface WaterEffectProps {
  className?: string;
}

/**
 * Animated water background using CSS gradients and keyframe animations.
 * Renders layered sine-wave-like ripples with a blue-tinted dark palette.
 */
function WaterEffect({ className }: WaterEffectProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-2xl",
        className,
      )}
    >
      {/* Base water colour */}
      <div className="absolute inset-0 bg-[#060e18]" />

      {/* Wave layer 1 — slow, large */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(83,227,195,0.06) 40px, rgba(83,227,195,0.06) 80px)",
          animation: "water-drift-1 8s linear infinite",
        }}
      />

      {/* Wave layer 2 — medium speed */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "repeating-linear-gradient(95deg, transparent, transparent 30px, rgba(83,227,195,0.08) 30px, rgba(83,227,195,0.08) 60px)",
          animation: "water-drift-2 5s linear infinite",
        }}
      />

      {/* Wave layer 3 — fast, small ripples */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background:
            "repeating-linear-gradient(88deg, transparent, transparent 18px, rgba(100,180,255,0.06) 18px, rgba(100,180,255,0.06) 36px)",
          animation: "water-drift-3 3s linear infinite",
        }}
      />

      {/* Surface shimmer — horizontal highlight band */}
      <div
        className="absolute inset-x-0 h-[2px] opacity-10"
        style={{
          top: "30%",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(83,227,195,0.4) 30%, rgba(83,227,195,0.6) 50%, rgba(83,227,195,0.4) 70%, transparent 100%)",
          animation: "shimmer 4s ease-in-out infinite",
        }}
      />

      {/* Vignette overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(4,4,4,0.6) 100%)",
        }}
      />

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes water-drift-1 {
          from { transform: translateX(0); }
          to   { transform: translateX(-80px); }
        }
        @keyframes water-drift-2 {
          from { transform: translateX(0); }
          to   { transform: translateX(60px); }
        }
        @keyframes water-drift-3 {
          from { transform: translateX(0); }
          to   { transform: translateX(-36px); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.06; transform: translateX(-20%); }
          50%      { opacity: 0.14; transform: translateX(20%); }
        }
      `}</style>
    </div>
  );
}

export { WaterEffect, type WaterEffectProps };
