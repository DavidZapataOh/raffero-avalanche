"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CartoonBorderProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

/**
 * Wraps children in a container with an SVG feTurbulence filter that gives
 * edges a wobbly, hand-drawn cartoon look.
 */
function CartoonBorder({
  children,
  className,
  color = "#3a3a3a",
}: CartoonBorderProps) {
  const filterId = "wobble-filter";

  return (
    <div className={cn("relative", className)}>
      {/* Hidden SVG filter definition */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <filter id={filterId}>
            <feTurbulence
              type="turbulence"
              baseFrequency="0.015"
              numOctaves={3}
              seed={2}
              result="turbulence"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale={3}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Bordered container with the wobbly filter applied */}
      <div
        className="rounded-2xl"
        style={{
          border: `2px solid ${color}`,
          filter: `url(#${filterId})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export { CartoonBorder, type CartoonBorderProps };
