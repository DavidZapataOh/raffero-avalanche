"use client";

import { cn } from "@/lib/utils";

interface FilmGrainProps {
  intensity?: number;
  className?: string;
}

/**
 * Film grain noise overlay rendered as a React component.
 * Uses the same SVG feTurbulence technique as the CSS `.film-grain::after`
 * rule in globals.css, but parameterised via props.
 */
function FilmGrain({ intensity = 0.4, className }: FilmGrainProps) {
  // Clamp intensity between 0 and 1
  const opacity = Math.max(0, Math.min(1, intensity));

  return (
    <div
      className={cn("pointer-events-none fixed inset-0", className)}
      style={{ zIndex: 9999 }}
      aria-hidden
    >
      <style>{`
        @keyframes film-grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          20% { transform: translate(-15%, 5%); }
          30% { transform: translate(7%, -25%); }
          40% { transform: translate(-5%, 25%); }
          50% { transform: translate(-15%, 10%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(3%, 35%); }
          90% { transform: translate(-10%, 10%); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: "-50%",
          width: "200%",
          height: "200%",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")",
          animation: "film-grain 8s steps(10) infinite",
          pointerEvents: "none",
          opacity,
        }}
      />
    </div>
  );
}

export { FilmGrain, type FilmGrainProps };
